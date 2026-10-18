import { describe, expect, it } from 'vitest';
import {
  CollectionRepository,
  ConflictError,
  STORAGE_KEY,
  type Collection,
  type StorageLike,
} from './repository';
import { createTrip } from '../domain/trip';
function storage() {
  const map = new Map<string, string>();
  const api: StorageLike = {
    getItem: (key) => map.get(key) ?? null,
    setItem: (key, value) => {
      map.set(key, value);
    },
  };
  return { map, api };
}
function ready(repository: CollectionRepository): Collection {
  const view = repository.snapshot();
  if (view.kind !== 'ready') throw new Error('Expected ready state');
  return view.data;
}
describe('durable collection writes', () => {
  it('reopens the same saved itinerary with notes, allowances and bookmarks', () => {
    const { api } = storage(),
      repo = new CollectionRepository(() => api),
      trip = createTrip('dilijan');
    repo.add(ready(repo), trip);
    repo.command(ready(repo), trip.id, {
      type: 'stop-details',
      stopId: trip.days[0]!.stops[0]!.id,
      notes: 'A note in հայերեն',
      allowanceCents: 99,
    });
    repo.bookmark(ready(repo), 'madeira');
    const reopened = ready(new CollectionRepository(() => api));
    expect(reopened.trips[0]!.days[0]!.stops[0]!.notes).toBe('A note in հայերեն');
    expect(reopened.bookmarks).toEqual(['madeira']);
  });
  it('rejects a stale tab lease and exposes the latest collection', () => {
    const { api } = storage(),
      first = new CollectionRepository(() => api);
    first.add(ready(first), createTrip('madeira'));
    const second = new CollectionRepository(() => api),
      lease = ready(second);
    first.bookmark(ready(first), 'iceland');
    expect(() => second.bookmark(lease, 'dilijan')).toThrow(ConflictError);
    expect(ready(second).bookmarks).toEqual(['iceland']);
  });
  it('rejects a stale open editor even when its collection lease is fresh', () => {
    const { api } = storage(),
      repo = new CollectionRepository(() => api),
      trip = createTrip('madeira');
    repo.add(ready(repo), trip);
    repo.command(ready(repo), trip.id, { type: 'details', title: 'A newer title' }, trip.revision);
    expect(() =>
      repo.command(ready(repo), trip.id, { type: 'details', title: 'Stale title' }, trip.revision),
    ).toThrow(ConflictError);
    expect(ready(repo).trips[0]!.title).toBe('A newer title');
  });
  it('guards deletion against a trip changed since confirmation opened', () => {
    const { api } = storage(),
      repo = new CollectionRepository(() => api),
      trip = createTrip('madeira');
    repo.add(ready(repo), trip);
    repo.command(ready(repo), trip.id, { type: 'details', travellers: 3 });
    expect(() => repo.remove(ready(repo), trip.id, 0)).toThrow(ConflictError);
    expect(ready(repo).trips).toHaveLength(1);
  });
  it('does not report success or replace the snapshot when a write is blocked', () => {
    const { api } = storage(),
      repo = new CollectionRepository(() => api),
      before = ready(repo);
    api.setItem = () => {
      throw new Error('quota');
    };
    expect(() => repo.add(before, createTrip('madeira'))).toThrow('not saved');
    expect(ready(repo)).toEqual(before);
  });
  it('preserves corrupt bytes and refuses every ordinary mutation', () => {
    const { api, map } = storage();
    map.set(STORAGE_KEY, '{unfinished');
    const repo = new CollectionRepository(() => api);
    expect(repo.snapshot()).toMatchObject({ kind: 'corrupt', raw: '{unfinished' });
    expect(() =>
      repo.add({ generation: crypto.randomUUID(), revision: 0 }, createTrip('iceland')),
    ).toThrow('could not be read');
    expect(map.get(STORAGE_KEY)).toBe('{unfinished');
  });
  it('refuses a reset if another tab has replaced the unreadable data', () => {
    const { api, map } = storage();
    map.set(STORAGE_KEY, 'broken');
    const repo = new CollectionRepository(() => api);
    map.set(STORAGE_KEY, 'different');
    expect(() => repo.reset('broken')).toThrow(ConflictError);
    expect(map.get(STORAGE_KEY)).toBe('different');
  });
  it('starts a new generation only after an explicit guarded reset', () => {
    const { api, map } = storage();
    map.set(STORAGE_KEY, 'broken');
    const repo = new CollectionRepository(() => api);
    repo.reset('broken');
    expect(ready(repo).trips).toEqual([]);
    expect(JSON.parse(map.get(STORAGE_KEY)!).schema).toBe(1);
  });
  it('does not erase unreadable bytes when reset cannot be persisted', () => {
    const { api, map } = storage();
    map.set(STORAGE_KEY, 'broken');
    const repo = new CollectionRepository(() => api);
    api.setItem = () => {
      throw new Error('quota');
    };
    expect(() => repo.reset('broken')).toThrow('could not be reset');
    expect(map.get(STORAGE_KEY)).toBe('broken');
  });
  it('handles a denied storage getter without crashing destination exploration', () => {
    const repo = new CollectionRepository(() => {
      throw new Error('denied');
    });
    expect(repo.snapshot()).toMatchObject({ kind: 'unavailable' });
  });
  it('bounds the collection and prevents duplicate trip identities', () => {
    const { api } = storage(),
      repo = new CollectionRepository(() => api),
      trip = createTrip('madeira');
    repo.add(ready(repo), trip);
    expect(() => repo.add(ready(repo), trip)).toThrow();
    while (ready(repo).trips.length < 24) repo.add(ready(repo), createTrip('madeira'));
    expect(() => repo.add(ready(repo), createTrip('dilijan'))).toThrow('up to 24');
  });
  it('rejects a forged unknown place in stored data', () => {
    const { api, map } = storage(),
      repo = new CollectionRepository(() => api),
      trip = createTrip('madeira');
    repo.add(ready(repo), trip);
    const forged = ready(repo);
    forged.trips[0]!.days[0]!.stops[0]!.placeId = 'foreign';
    map.set(STORAGE_KEY, JSON.stringify(forged));
    expect(new CollectionRepository(() => api).snapshot().kind).toBe('corrupt');
  });
});
