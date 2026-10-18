# Reviewing Tavriqa

## The problem and the interaction

A travel concept needs an attractive first impression and a useful next step.
Tavriqa connects a four-destination editorial atlas to a small but complete local
trip planner. The starting outline is deliberately limited: three days and five
stops, leaving two more places available in each destination.

The typography pairs a precise sans with an italic serif. Photographs establish
each landscape's identity. Motion introduces scenes, rotates the globe toward a
selected destination, traces the current day's connections and gives rearranged
places a clear new position. It does not reduce text contrast or intercept
ordinary scrolling.

## A concrete walkthrough

1. Open Madeira from the atlas and start its three-day outline.
2. Move Funchal after Cabo Girão with the keyboard, then use the day selector to
   move it to day three. Explain why the stop ID and notes remain unchanged.
3. Set three travellers, €80 per room/night, €12.34 food per traveller/day,
   €35 group transport/day and a €900 budget. With the five default stops,
   the result is **€746.06**. Explain the two-room rounding and exact cents.
4. Add Seixal, leave a note, change its allowance and reload. The UI reads the
   validated saved collection, not a hardcoded success message.
5. Share a link. Its recipient previews a snapshot and explicitly saves a new
   copy. Editing that copy cannot overwrite the source trip.
6. Open an editor in two tabs. Save a change in the second tab, then submit the
   older first editor. Its captured trip revision makes the stale save fail.

These flows are covered by the passing Chromium, Firefox and mobile Chromium
suite. Public browser review also verified creation, details, exact budget edits,
cross-day movement and persistence after reload. See [validation](validation.md)
for the executed checks and the distinction between automated and manual review.

## State boundaries

The catalog is fixed content. A trip references known place IDs within one
destination. `tripSchema` validates lengths, dates, IDs, integer money, unique
places and bounds. Commands create a new trip value; UI controls never directly
reorder the stored arrays.

The repository validates the full envelope before accepting it. A generation ID
distinguishes resets; the envelope revision protects collection changes. Editors
also capture the trip revision when opened, because reading the latest envelope
at submission alone would not protect an older form.

`useSyncExternalStore` provides a stable collection snapshot. Supported browsers
use Web Locks around read/compare/write. Storage events bring other tabs forward.
Without Web Locks, the compare/write interval is not atomic; there is no claim of
server-grade concurrency.

Unreadable data remains untouched and exportable. Reset is a separate guarded
action that checks the exact raw contents before replacing them. A failed write
does not advance the visible snapshot or navigate to a fictional saved trip.

## Money and geometry

All allowances are integer cents. Decimal input is parsed as whole and fractional
parts rather than multiplying a floating-point value by 100. Lodging uses nights
(`days - 1`) and rooms (`ceil(travellers / 2)`), food uses people and days,
transport is one group amount per day, and stop allowances are per traveller.

The itinerary map projects approximate longitude/latitude locations into a
bounded SVG. Connections show the chosen ordering. Haversine distance is labeled
as direct distance and is not used to invent a driving time.

The destination globe uses Natural Earth land geometry in both SVG and a canvas
texture for Three.js. Its presentation is lazy; the rest of the planner has no
dependency on WebGL availability. Three.js rendering stops when orientation
settles. The texture is disposed on unmount.

## Accessibility and motion decisions

- Use native links, buttons, selects, date inputs and modal dialogs.
- Keep an explicit move-to-day selector and up/down buttons alongside dragging.
- Supply drag instructions, keyboard sorting and announcements using place names.
  Keyboard scrolling follows the reduced-motion preference.
- Focus main content on route changes, preserve search focus during query changes,
  and keep in-page anchors from colliding with hash routing.
- Honor reduced motion and provide a decorative-motion pause. Animate position,
  image framing and route strokes while preserving readable text opacity.
- Keep a non-WebGL destination globe and labeled HTML destination choices.

Representative axe checks, overflow assertions and screenshots are part of the
browser suite, but no full accessibility certification is claimed.

## Deliberate limits

There is no routing engine, map-tile service, live travel API, account system or
payment collection. This keeps the public demo portable and makes its data
boundaries clear. A production travel product would need current access and
pricing data, real route computation, synchronization and an account/privacy
model. Those features are not implied by this portfolio implementation.
