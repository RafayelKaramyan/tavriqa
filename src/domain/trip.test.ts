import { describe, expect, it } from 'vitest';
import {
  createTrip,
  dayDate,
  directDistance,
  parseMoney,
  tripBudget,
  tripSchema,
  updateTrip,
} from './trip';
import { destinations } from './catalog';

describe('itinerary invariants', () => {
  it('starts each researched destination with five different places across three days', () => {
    for (const d of destinations) {
      const trip = createTrip(d.id);
      expect(trip.days.map((day) => day.stops.length)).toEqual([2, 2, 1]);
      expect(new Set(trip.days.flatMap((day) => day.stops.map((s) => s.placeId))).size).toBe(5);
      expect(tripSchema.safeParse(trip).success).toBe(true);
    }
  });
  it('moves an existing place between days, preserving its notes and identity', () => {
    let trip = createTrip('madeira');
    const first = trip.days[0]!.stops[0]!;
    trip = updateTrip(trip, {
      type: 'stop-details',
      stopId: first.id,
      notes: 'Meet at the waterfront.',
      allowanceCents: 1234,
    });
    const result = updateTrip(trip, {
      type: 'move-stop',
      stopId: first.id,
      dayId: trip.days[2]!.id,
      index: 0,
    });
    expect(result.days[0]!.stops).toHaveLength(1);
    expect(result.days[2]!.stops[0]).toEqual({
      ...first,
      notes: 'Meet at the waterfront.',
      allowanceCents: 1234,
    });
    expect(trip.days[0]!.stops).toHaveLength(2);
  });
  it('reorders in both directions without dropping or duplicating a place', () => {
    const trip = createTrip('iceland'),
      day = trip.days[0]!,
      a = day.stops[0]!,
      b = day.stops[1]!;
    const moved = updateTrip(trip, { type: 'move-stop', stopId: a.id, dayId: day.id, index: 1 });
    expect(moved.days[0]!.stops.map((s) => s.id)).toEqual([b.id, a.id]);
    expect(
      updateTrip(moved, {
        type: 'move-stop',
        stopId: a.id,
        dayId: day.id,
        index: 0,
      }).days[0]!.stops.map((s) => s.id),
    ).toEqual([a.id, b.id]);
  });
  it('rejects a second scheduling of the same place', () => {
    const trip = createTrip('madeira');
    expect(() =>
      updateTrip(trip, { type: 'add-stop', dayId: trip.days[1]!.id, placeId: 'funchal' }),
    ).toThrow('already');
  });
  it('rejects a foreign or unknown place', () => {
    const trip = createTrip('madeira');
    expect(() =>
      updateTrip(trip, { type: 'add-stop', dayId: trip.days[0]!.id, placeId: 'braies' }),
    ).toThrow('unavailable');
  });
  it('preserves a nonempty day instead of silently discarding its stops', () => {
    const trip = createTrip('madeira');
    expect(() => updateTrip(trip, { type: 'remove-day', dayId: trip.days[0]!.id })).toThrow(
      'Move or remove',
    );
  });
  it('removes an empty day but keeps at least one', () => {
    let trip = createTrip('dilijan');
    trip = { ...trip, days: [{ ...trip.days[0]!, stops: [] }] };
    expect(() => updateTrip(trip, { type: 'remove-day', dayId: trip.days[0]!.id })).toThrow(
      'at least one',
    );
    trip = updateTrip(trip, { type: 'add-day' });
    expect(updateTrip(trip, { type: 'remove-day', dayId: trip.days[1]!.id }).days).toHaveLength(1);
  });
  it('caps the day count at ten', () => {
    let trip = createTrip('dilijan');
    while (trip.days.length < 10) trip = updateTrip(trip, { type: 'add-day' });
    expect(() => updateTrip(trip, { type: 'add-day' })).toThrow('10 days');
  });
  it('rejects missing stops and invalid move indices', () => {
    const trip = createTrip('madeira');
    expect(() =>
      updateTrip(trip, {
        type: 'move-stop',
        stopId: crypto.randomUUID(),
        dayId: trip.days[0]!.id,
        index: 0,
      }),
    ).toThrow('no longer');
    expect(() =>
      updateTrip(trip, {
        type: 'move-stop',
        stopId: trip.days[0]!.stops[0]!.id,
        dayId: trip.days[1]!.id,
        index: -1,
      }),
    ).toThrow('valid place position');
  });
  it('rejects forged duplicate IDs and repeated places on loaded trips', () => {
    const trip = createTrip('madeira');
    trip.days[1]!.stops[0] = { ...trip.days[0]!.stops[0]! };
    expect(tripSchema.safeParse(trip).success).toBe(false);
  });
  it('accepts leap day and rejects impossible or malformed dates without throwing from safeParse', () => {
    const trip = createTrip('madeira');
    expect(tripSchema.safeParse({ ...trip, startDate: '2028-02-29' }).success).toBe(true);
    for (const startDate of ['2027-02-29', '2027-13-05', 'tomorrow', '2027-02-30'])
      expect(tripSchema.safeParse({ ...trip, startDate }).success).toBe(false);
  });
  it('does not allow blank names, fractional travellers or negative money', () => {
    const trip = createTrip('madeira');
    for (const patch of [
      { title: '  ' },
      { travellers: 1.5 },
      { travellers: 9 },
      { budget: { ...trip.budget, limitCents: -1 } },
    ])
      expect(tripSchema.safeParse({ ...trip, ...patch }).success).toBe(false);
  });
});
describe('honest planning estimates', () => {
  it('calculates rooms, nights, group transport and per-person allowances in integer cents', () => {
    expect(tripBudget(createTrip('madeira'))).toEqual({
      lodging: 22000,
      food: 21000,
      transport: 13500,
      activities: 14000,
      total: 70500,
      nights: 2,
      rooms: 1,
      remaining: 9500,
      perPerson: 35250,
    });
  });
  it('rounds room count up for an odd group and updates all traveller-dependent costs', () => {
    const trip = updateTrip(createTrip('madeira'), { type: 'details', travellers: 3 });
    const budget = tripBudget(trip);
    expect(budget.rooms).toBe(2);
    expect(budget.total).toBe(110000);
    expect(budget.transport).toBe(13500);
    expect(budget.remaining).toBe(-30000);
  });
  it('keeps one-day lodging at zero and allows a deliberately zero allowance', () => {
    const trip = createTrip('madeira');
    trip.days = [trip.days[0]!];
    trip.budget = { lodgingCents: 9999, foodCents: 0, transportCents: 0, limitCents: 0 };
    trip.days[0]!.stops = [];
    expect(tripBudget(trip).total).toBe(0);
    expect(tripBudget(trip).nights).toBe(0);
  });
  it('parses decimal amounts exactly without binary floating-point multiplication', () => {
    expect(parseMoney('0.29')).toBe(29);
    expect(parseMoney('17.5')).toBe(1750);
    expect(parseMoney('100000.00')).toBe(10000000);
  });
  it('rejects ambiguous amounts and excessive precision', () => {
    for (const value of ['-1', '1e3', '1,000', '2.999', 'Infinity', '', '100000.01'])
      expect(() => parseMoney(value)).toThrow();
  });
  it('formats itinerary dates across year boundaries in a fixed timezone', () => {
    expect(dayDate('2027-12-31', 1)).toBe('1 Jan');
    expect(dayDate('', 3)).toBe('');
  });
  it('uses a direct geographic distance rather than pretending to know a road route', () => {
    expect(directDistance([0, 0], [0, 0])).toBe(0);
    expect(directDistance([0, 0], [1, 0])).toBeCloseTo(111.195, 2);
  });
});
