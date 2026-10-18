import { describe, expect, it } from 'vitest';
import { createTrip, updateTrip } from './trip';
import { exportTrip, importTrip, parseShare, shareToken, tripText } from './transfer';
describe('portable trip snapshots', () => {
  it('round-trips Unicode notes, dates and exact decimal cents through a URL-safe link', () => {
    const base = createTrip('dilijan'),
      trip = updateTrip(
        { ...base, title: 'Հայաստան — new chapter', startDate: '2027-05-01' },
        {
          type: 'stop-details',
          stopId: base.days[0]!.stops[0]!.id,
          notes: 'Սուրճ ☕, потом прогулка',
          allowanceCents: 1299,
        },
      );
    const token = shareToken(trip);
    expect(token).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(exportTrip(parseShare(token))).toEqual(exportTrip(trip));
  });
  it('imports a new identity for the trip, its days and stops instead of overwriting originals', () => {
    const original = createTrip('madeira'),
      copy = importTrip(JSON.stringify(exportTrip(original)));
    expect(copy.id).not.toBe(original.id);
    expect(copy.days[0]!.id).not.toBe(original.days[0]!.id);
    expect(copy.days[0]!.stops[0]!.id).not.toBe(original.days[0]!.stops[0]!.id);
    expect(copy.revision).toBe(0);
  });
  it('rejects foreign destinations and unknown place IDs', () => {
    const portable = exportTrip(createTrip('madeira'));
    portable.days[0]!.stops[0]!.placeId = 'braies';
    expect(() => importTrip(JSON.stringify(portable))).toThrow('invalid places');
  });
  it('rejects a tampered negative allowance and a repeated place', () => {
    const portable = exportTrip(createTrip('madeira'));
    portable.days[0]!.stops[0]!.allowanceCents = -1;
    expect(() => importTrip(JSON.stringify(portable))).toThrow();
    portable.days[0]!.stops[0]!.allowanceCents = 0;
    portable.days[1]!.stops[0]!.placeId = portable.days[0]!.stops[0]!.placeId;
    expect(() => importTrip(JSON.stringify(portable))).toThrow();
  });
  it('rejects malformed, excessively large and unsupported-version files', () => {
    expect(() => importTrip('{')).toThrow('readable JSON');
    expect(() => importTrip('a'.repeat(200001))).toThrow('200 KB');
    expect(() =>
      importTrip(JSON.stringify({ ...exportTrip(createTrip('madeira')), version: 2 })),
    ).toThrow('not a supported');
  });
  it('rejects broken or oversized shared URLs without exposing parser exceptions', () => {
    for (const token of ['', '<script>', 'abcdef', 'a'.repeat(16001)])
      expect(() => parseShare(token)).toThrow('link');
  });
  it('exports readable plans with notes, exact totals and the planning limits', () => {
    const trip = createTrip('madeira');
    trip.days[0]!.stops[0]!.notes = 'Meet at noon';
    const text = tripText(trip);
    expect(text).toContain('Funchal old town — Meet at noon');
    expect(text).toContain('€705 total');
    expect(text).toContain('not navigation routes');
    expect(text).toContain('Flights and insurance are excluded');
  });
});
