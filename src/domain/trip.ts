import { z } from 'zod';
import { destinationById, destinationIds, placeById, type DestinationId } from './catalog';

const cents = z.number().int().min(0).max(10_000_000);
const date = z.union([z.literal(''), z.iso.date()]);
const stopSchema = z
  .object({ id: z.uuid(), placeId: z.string(), notes: z.string().max(240), allowanceCents: cents })
  .strict();
const daySchema = z.object({ id: z.uuid(), stops: z.array(stopSchema).max(8) }).strict();
export const tripSchema = z
  .object({
    id: z.uuid(),
    revision: z.number().int().nonnegative(),
    destinationId: z.enum(destinationIds),
    title: z.string().trim().min(1).max(80),
    startDate: date,
    travellers: z.number().int().min(1).max(8),
    budget: z
      .object({ lodgingCents: cents, foodCents: cents, transportCents: cents, limitCents: cents })
      .strict(),
    days: z.array(daySchema).min(1).max(10),
    createdAt: z.iso.datetime(),
    updatedAt: z.iso.datetime(),
  })
  .strict()
  .superRefine((trip, ctx) => {
    const days = new Set<string>(),
      stops = new Set<string>(),
      places = new Set<string>();
    for (const day of trip.days) {
      if (days.has(day.id)) ctx.addIssue({ code: 'custom', message: 'Duplicate day.' });
      days.add(day.id);
      for (const stop of day.stops) {
        if (!placeById(trip.destinationId, stop.placeId))
          ctx.addIssue({ code: 'custom', message: 'Unknown place for this destination.' });
        if (stops.has(stop.id) || places.has(stop.placeId))
          ctx.addIssue({ code: 'custom', message: 'A place can only appear once in a trip.' });
        stops.add(stop.id);
        places.add(stop.placeId);
      }
    }
  });
export type Trip = z.infer<typeof tripSchema>;
export type TripDay = Trip['days'][number];
export type Stop = TripDay['stops'][number];
export const MAX_TRIPS = 24;

export function createTrip(destinationId: DestinationId, title?: string): Trip {
  const destination = destinationById(destinationId)!;
  const now = new Date().toISOString();
  return tripSchema.parse({
    id: crypto.randomUUID(),
    revision: 0,
    destinationId,
    title: title ?? `A few days in ${destination.name}`,
    startDate: '',
    travellers: 2,
    budget: { ...destination.defaults },
    createdAt: now,
    updatedAt: now,
    days: Array.from({ length: destination.days }, (_, index) => ({
      id: crypto.randomUUID(),
      stops: destination.places.slice(index * 2, Math.min(index * 2 + 2, 5)).map((place) => ({
        id: crypto.randomUUID(),
        placeId: place.id,
        notes: '',
        allowanceCents: place.allowanceCents,
      })),
    })),
  });
}
export type TripCommand =
  | { type: 'details'; title?: string; startDate?: string; travellers?: number }
  | { type: 'budget'; field: keyof Trip['budget']; value: number }
  | { type: 'budget-all'; budget: Trip['budget'] }
  | { type: 'add-day' }
  | { type: 'remove-day'; dayId: string }
  | { type: 'add-stop'; dayId: string; placeId: string }
  | { type: 'remove-stop'; stopId: string }
  | { type: 'move-stop'; stopId: string; dayId: string; index: number }
  | { type: 'stop-details'; stopId: string; notes: string; allowanceCents: number };

export function updateTrip(trip: Trip, command: TripCommand): Trip {
  const next = structuredClone(trip);
  if (command.type === 'details') {
    if (command.title !== undefined) next.title = command.title;
    if (command.startDate !== undefined) next.startDate = command.startDate;
    if (command.travellers !== undefined) next.travellers = command.travellers;
  } else if (command.type === 'budget') next.budget[command.field] = command.value;
  else if (command.type === 'budget-all') next.budget = { ...command.budget };
  else if (command.type === 'add-day') {
    if (next.days.length === 10) throw new Error('A trip can have up to 10 days.');
    next.days.push({ id: crypto.randomUUID(), stops: [] });
  } else if (command.type === 'remove-day') {
    const day = next.days.find((d) => d.id === command.dayId);
    if (!day || next.days.length === 1) throw new Error('Keep at least one day in your trip.');
    if (day.stops.length) throw new Error('Move or remove this day’s places first.');
    next.days = next.days.filter((d) => d.id !== command.dayId);
  } else if (command.type === 'add-stop') {
    const place = placeById(next.destinationId, command.placeId);
    const day = next.days.find((d) => d.id === command.dayId);
    if (!place || !day) throw new Error('This place or day is unavailable.');
    if (next.days.some((d) => d.stops.some((s) => s.placeId === place.id)))
      throw new Error('That place is already in your trip.');
    if (day.stops.length === 8) throw new Error('A day can hold up to 8 places.');
    day.stops.push({
      id: crypto.randomUUID(),
      placeId: place.id,
      notes: '',
      allowanceCents: place.allowanceCents,
    });
  } else if (command.type === 'remove-stop') {
    if (!next.days.some((d) => d.stops.some((s) => s.id === command.stopId)))
      throw new Error('This place is no longer in the trip.');
    for (const day of next.days) day.stops = day.stops.filter((s) => s.id !== command.stopId);
  } else if (command.type === 'move-stop') {
    const from = next.days.find((d) => d.stops.some((s) => s.id === command.stopId));
    const to = next.days.find((d) => d.id === command.dayId);
    const stop = from?.stops.find((s) => s.id === command.stopId);
    if (!from || !to || !stop) throw new Error('This place or day is no longer available.');
    if (to !== from && to.stops.length === 8) throw new Error('A day can hold up to 8 places.');
    if (!Number.isInteger(command.index) || command.index < 0 || command.index > to.stops.length)
      throw new Error('Choose a valid place position.');
    from.stops = from.stops.filter((s) => s.id !== stop.id);
    to.stops.splice(Math.min(command.index, to.stops.length), 0, stop);
  } else if (command.type === 'stop-details') {
    const stop = next.days.flatMap((d) => d.stops).find((s) => s.id === command.stopId);
    if (!stop) throw new Error('This place is no longer in the trip.');
    stop.notes = command.notes;
    stop.allowanceCents = command.allowanceCents;
  }
  next.revision += 1;
  next.updatedAt = new Date().toISOString();
  return tripSchema.parse(next);
}

export function tripBudget(trip: Trip) {
  const nights = Math.max(0, trip.days.length - 1),
    rooms = Math.ceil(trip.travellers / 2);
  const lodging = trip.budget.lodgingCents * nights * rooms;
  const food = trip.budget.foodCents * trip.days.length * trip.travellers;
  const transport = trip.budget.transportCents * trip.days.length;
  const activities = trip.days
    .flatMap((d) => d.stops)
    .reduce((sum, s) => sum + s.allowanceCents * trip.travellers, 0);
  const total = lodging + food + transport + activities;
  return {
    lodging,
    food,
    transport,
    activities,
    total,
    nights,
    rooms,
    remaining: trip.budget.limitCents - total,
    perPerson: Math.round(total / trip.travellers),
  };
}
export const money = (cents: number) =>
  new Intl.NumberFormat('en-IE', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: cents % 100 ? 2 : 0,
  }).format(cents / 100);
export function parseMoney(value: string): number {
  if (!/^\d{1,6}(\.\d{1,2})?$/.test(value))
    throw new Error('Enter an amount from 0 to 100000, with up to two decimal places.');
  const [whole, fraction = ''] = value.split('.');
  const result = Number(whole) * 100 + Number(fraction.padEnd(2, '0'));
  if (result > 10_000_000) throw new Error('The maximum amount is €100,000.');
  return result;
}
export function dayDate(start: string, index: number) {
  if (!start) return '';
  const d = new Date(`${start}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + index);
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC',
  }).format(d);
}
export function directDistance(a: [number, number], b: [number, number]) {
  const rad = Math.PI / 180,
    lat = (b[1] - a[1]) * rad,
    lon = (b[0] - a[0]) * rad;
  const h =
    Math.sin(lat / 2) ** 2 + Math.cos(a[1] * rad) * Math.cos(b[1] * rad) * Math.sin(lon / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.min(1, Math.sqrt(h)));
}
export function dayDistance(trip: Trip, day: TripDay) {
  const points = day.stops.map((s) => placeById(trip.destinationId, s.placeId)!);
  return points.reduce(
    (sum, p, i) => sum + (i ? directDistance(points[i - 1]!.coordinates, p.coordinates) : 0),
    0,
  );
}
