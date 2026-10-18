import { z } from 'zod';
import { destinationById, destinationIds } from './catalog';
import { createTrip, tripSchema, tripBudget, money, dayDate, type Trip } from './trip';

const portable = z
  .object({
    format: z.literal('tavriqa-trip'),
    version: z.literal(1),
    destinationId: z.enum(destinationIds),
    title: z.string().trim().min(1).max(80),
    startDate: z.string(),
    travellers: z.number(),
    budget: z
      .object({
        lodgingCents: z.number(),
        foodCents: z.number(),
        transportCents: z.number(),
        limitCents: z.number(),
      })
      .strict(),
    days: z
      .array(
        z
          .object({
            stops: z
              .array(
                z
                  .object({ placeId: z.string(), notes: z.string(), allowanceCents: z.number() })
                  .strict(),
              )
              .max(8),
          })
          .strict(),
      )
      .min(1)
      .max(10),
  })
  .strict();
export function exportTrip(trip: Trip) {
  return {
    format: 'tavriqa-trip' as const,
    version: 1 as const,
    destinationId: trip.destinationId,
    title: trip.title,
    startDate: trip.startDate,
    travellers: trip.travellers,
    budget: trip.budget,
    days: trip.days.map((day) => ({
      stops: day.stops.map(({ placeId, notes, allowanceCents }) => ({
        placeId,
        notes,
        allowanceCents,
      })),
    })),
  };
}
export function importTrip(raw: string): Trip {
  if (raw.length > 200_000) throw new Error('Choose a Tavriqa trip file smaller than 200 KB.');
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error('This is not a readable JSON trip file.');
  }
  const result = portable.safeParse(parsed);
  if (!result.success)
    throw new Error(
      'This file is not a supported Tavriqa trip. Your existing trips have not changed.',
    );
  const item = result.data,
    base = createTrip(item.destinationId);
  const candidate = {
    ...base,
    ...item,
    days: item.days.map((day) => ({
      id: crypto.randomUUID(),
      stops: day.stops.map((stop) => ({ ...stop, id: crypto.randomUUID() })),
    })),
  };
  const { format: _format, version: _version, ...trip } = candidate;
  void _format;
  void _version;
  const valid = tripSchema.safeParse(trip);
  if (!valid.success)
    throw new Error(
      'This trip contains invalid places, dates or amounts. Your existing trips have not changed.',
    );
  return valid.data;
}
export function shareToken(trip: Trip) {
  const bytes = new TextEncoder().encode(JSON.stringify(exportTrip(trip)));
  const token = btoa(Array.from(bytes, (b) => String.fromCharCode(b)).join(''))
    .replaceAll('+', '-')
    .replaceAll('/', '_')
    .replace(/=+$/, '');
  if (token.length > 16_000)
    throw new Error('This trip is too detailed for a link. Export its JSON file instead.');
  return token;
}
export function parseShare(token: string) {
  if (token.length > 16_000 || !/^[A-Za-z0-9_-]+$/.test(token))
    throw new Error('This shared-trip link is invalid or too long.');
  try {
    const binary = atob(token.replaceAll('-', '+').replaceAll('_', '/'));
    return importTrip(
      new TextDecoder('utf-8', { fatal: true }).decode(
        Uint8Array.from(binary, (c) => c.charCodeAt(0)),
      ),
    );
  } catch {
    throw new Error('This shared-trip link could not be read. Ask for a new link or a trip file.');
  }
}
export function tripText(trip: Trip) {
  const destination = destinationById(trip.destinationId)!,
    budget = tripBudget(trip);
  return [
    trip.title,
    `${destination.name}, ${destination.country} · ${trip.travellers} travellers`,
    '',
    ...trip.days.flatMap((day, i) => [
      `DAY ${i + 1}${dayDate(trip.startDate, i) ? ` · ${dayDate(trip.startDate, i)}` : ''}`,
      ...day.stops.map(
        (s, j) =>
          `${j + 1}. ${destination.places.find((p) => p.id === s.placeId)!.name}${s.notes ? ` — ${s.notes}` : ''}`,
      ),
      '',
    ]),
    `Planning estimate: ${money(budget.total)} total / ${money(budget.perPerson)} per traveller.`,
    `Budget limit: ${money(trip.budget.limitCents)}.`,
    'Illustrative EUR allowances, not quotes. Flights and insurance are excluded.',
    'Map lines connect approximate locations directly; they are not navigation routes.',
    'Check official destination access and conditions before travelling.',
    destination.source,
    '',
    'Created with Tavriqa · https://rafayelkaramyan.github.io/tavriqa/',
  ].join('\n');
}
export function download(content: string, name: string, type = 'text/plain;charset=utf-8') {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = name;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
