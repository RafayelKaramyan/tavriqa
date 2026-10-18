import { z } from 'zod';
import { destinationIds, type DestinationId } from '../domain/catalog';
import { MAX_TRIPS, tripSchema, updateTrip, type Trip, type TripCommand } from '../domain/trip';

export const STORAGE_KEY = 'tavriqa.collection.v1';
const envelopeSchema = z
  .object({
    schema: z.literal(1),
    generation: z.uuid(),
    revision: z.number().int().nonnegative(),
    trips: z.array(tripSchema).max(MAX_TRIPS),
    bookmarks: z.array(z.enum(destinationIds)).max(4),
  })
  .strict()
  .superRefine((data, ctx) => {
    if (
      new Set(data.trips.map((t) => t.id)).size !== data.trips.length ||
      new Set(data.bookmarks).size !== data.bookmarks.length
    )
      ctx.addIssue({ code: 'custom', message: 'The collection contains duplicate entries.' });
  });
export type Collection = z.infer<typeof envelopeSchema>;
export type Lease = Pick<Collection, 'generation' | 'revision'>;
export type CollectionView =
  | { kind: 'ready'; data: Collection }
  | { kind: 'corrupt'; raw: string; message: string }
  | { kind: 'unavailable'; message: string };
export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}
const empty = (): Collection => ({
  schema: 1,
  generation: crypto.randomUUID(),
  revision: 0,
  trips: [],
  bookmarks: [],
});
export class ConflictError extends Error {
  constructor() {
    super(
      'This collection changed in another tab. The latest version is now loaded. Review it and try your change again.',
    );
    this.name = 'ConflictError';
  }
}
export class CollectionRepository {
  private listeners = new Set<() => void>();
  private view: CollectionView;
  constructor(private readonly storage: () => StorageLike) {
    this.view = { kind: 'ready', data: empty() };
    this.refresh();
  }
  snapshot = () => this.view;
  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };
  private publish(next: CollectionView) {
    this.view = next;
    this.listeners.forEach((fn) => fn());
  }
  private read(): CollectionView {
    let raw: string | null;
    try {
      raw = this.storage().getItem(STORAGE_KEY);
    } catch {
      return {
        kind: 'unavailable',
        message:
          'Your browser is blocking saved trips. Allow site storage, then reload. You can still explore destinations.',
      };
    }
    if (raw === null)
      return {
        kind: 'ready',
        data:
          this.view.kind === 'ready' && this.view.data.revision === 0 ? this.view.data : empty(),
      };
    try {
      if (raw.length > 1_000_000) throw new Error('oversized');
      return { kind: 'ready', data: envelopeSchema.parse(JSON.parse(raw)) };
    } catch {
      return {
        kind: 'corrupt',
        raw,
        message:
          'Your saved collection could not be read. Its original contents are preserved. Export a copy before resetting it.',
      };
    }
  }
  refresh = () => {
    this.publish(this.read());
  };
  mutate(lease: Lease, transform: (data: Collection) => Collection): Collection {
    const current = this.read();
    if (current.kind !== 'ready') {
      this.publish(current);
      throw new Error(current.message);
    }
    if (current.data.generation !== lease.generation || current.data.revision !== lease.revision) {
      this.publish(current);
      throw new ConflictError();
    }
    const next = envelopeSchema.parse(transform(structuredClone(current.data)));
    next.revision = current.data.revision + 1;
    try {
      this.storage().setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      throw new Error(
        'The change was not saved. Your browser storage may be full or blocked. Export a trip or free some space, then try again.',
      );
    }
    this.publish({ kind: 'ready', data: next });
    return next;
  }
  add(lease: Lease, trip: Trip) {
    return this.mutate(lease, (data) => {
      if (data.trips.length >= MAX_TRIPS)
        throw new Error(
          `You can save up to ${MAX_TRIPS} trips. Export and remove an older trip first.`,
        );
      data.trips.unshift(tripSchema.parse(trip));
      return data;
    });
  }
  command(lease: Lease, id: string, command: TripCommand, expectedRevision?: number) {
    return this.mutate(lease, (data) => {
      const i = data.trips.findIndex((t) => t.id === id);
      if (i < 0) throw new Error('This trip is no longer available.');
      if (expectedRevision !== undefined && data.trips[i]!.revision !== expectedRevision)
        throw new ConflictError();
      data.trips[i] = updateTrip(data.trips[i]!, command);
      return data;
    });
  }
  remove(lease: Lease, id: string, expectedRevision?: number) {
    return this.mutate(lease, (data) => {
      const trip = data.trips.find((t) => t.id === id);
      if (!trip) throw new Error('This trip is no longer available.');
      if (expectedRevision !== undefined && trip.revision !== expectedRevision)
        throw new ConflictError();
      data.trips = data.trips.filter((t) => t.id !== id);
      return data;
    });
  }
  bookmark(lease: Lease, id: DestinationId) {
    return this.mutate(lease, (data) => {
      data.bookmarks = data.bookmarks.includes(id)
        ? data.bookmarks.filter((d) => d !== id)
        : [...data.bookmarks, id];
      return data;
    });
  }
  reset(expectedRaw: string) {
    let actual: string | null;
    try {
      actual = this.storage().getItem(STORAGE_KEY);
    } catch {
      throw new Error('Saved trips are still blocked by your browser.');
    }
    if (actual !== expectedRaw) {
      this.refresh();
      throw new ConflictError();
    }
    const next = empty();
    try {
      this.storage().setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      throw new Error('The collection could not be reset. The original data is still preserved.');
    }
    this.publish({ kind: 'ready', data: next });
  }
}

export const collection = new CollectionRepository(() => localStorage);
if (typeof window !== 'undefined')
  window.addEventListener('storage', (event) => {
    if (event.key === STORAGE_KEY || event.key === null) collection.refresh();
  });
export async function collectionLock<T>(fn: () => T): Promise<T> {
  if (typeof navigator !== 'undefined' && navigator.locks)
    return navigator.locks.request(STORAGE_KEY, fn);
  return fn();
}
