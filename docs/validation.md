# Validation record

Checkpoint: **18 October 2026**. Public browser review and publication are pending.

## Executed successfully

- `npm run typecheck` — strict TypeScript, including the browser test harness.
- `npm run lint` — zero warnings.
- `npm run format:check` — all matched source files formatted.
- `npm test` — **38 tests passed** across itinerary/budget, transfer and storage.
- `npm run build` — Vite production build succeeded.
- `npx playwright test --list` — **39 entries discovered** across Chromium,
  Firefox and Pixel 7 emulation. The mobile pointer-drag entry intentionally
  skips; keyboard and explicit day controls are included for mobile.

Browser-test discovery is not execution. No browser pass count is claimed yet.

## Awaiting execution and inspection

- Complete browser journeys: create/edit/reload, ordering, notes, day removal,
  exact budgets, sharing, export/import, duplication, deletion and recovery.
- Stale-editor behavior in two tabs and blocked-write behavior in a browser.
- Representative axe scans, keyboard focus and viewport overflow assertions.
- Desktop/mobile screenshots, image loading and motion-pause inspection.
- Public Pages deployment, live route verification, README/About demo links.
- A physical-GPU review of the WebGL globe. Automated browser coverage would
  not establish physical-device, Safari or complete accessibility coverage.
- External PDF/print application behavior. A print stylesheet exists but has
  not been manually inspected in a print dialog.

This managed workspace has no approved local browser preview route. Browser
execution belongs on the GitHub Actions runner. The public repository is initialized
and selected-repository access has been approved. The full source is being prepared
for its first browser verification and deployment. No live deployment is claimed
at this checkpoint.

## Bundle and asset observations

The successful build reports a 486.14 kB minified initial entry (160.11 kB gzip),
a 157.67 kB lazy globe chunk (62.95 kB gzip), and a 912.24 kB lazy WebGL chunk
(242.09 kB gzip). Vite warns about the WebGL chunk's size. The warning is retained;
the globe is deferred near the viewport and the WebGL renderer is a further lazy
enhancement. These are build sizes, not measured network or Core Web Vitals scores.

Photographs have 800/1800-pixel WebP variants. The initial Madeira hero is roughly
108 kB at 1800 pixels and 27 kB at 800 pixels. Other images load lazily where
applicable. Fonts are self-hosted. There are no invented Lighthouse or performance
scores.
