# Validation record

Verified release: **18 October 2026**.

- [Live demo](https://rafayelkaramyan.github.io/tavriqa/)
- [Successful verification and deployment](https://github.com/RafayelKaramyan/tavriqa/actions/runs/39159001829)
- Tested application commit: `e085c5a480337f62b60e6db7172af4c6b34a13e5`.
  Later documentation and screenshot updates do not change application code.

## Executed successfully

- `npm run typecheck` — strict TypeScript, including the browser test harness.
- `npm run lint` — zero warnings.
- `npm run format:check` — all matched source files formatted.
- `npm test` — **38 tests passed** across itinerary/budget, transfer and storage.
- `npm run build` — Vite production build succeeded.
- `npm run test:e2e` on the Actions runner — **38 passed, 1 intentionally skipped**.
  Chromium and Firefox each passed 13 scenarios; Pixel 7 Chromium passed 12.
  The mobile pointer-drag entry skips, while keyboard and explicit day controls
  execute on mobile.
- GitHub Pages deployment — successful after the verification job.

The browser suite exercised creation, detail edits, exact budgets, ordering,
notes, places, empty-day removal, sharing, JSON export/import, duplication,
guarded deletion, corrupt-data export/reset, blocked writes, stale editors in
two tabs, missing routes, malformed links, SVG fallback and motion pause.
Representative axe scans, keyboard-focus checks and viewport-overflow assertions
passed. Desktop/mobile home, destination and planner screenshots were inspected.

## Public browser review

The published site was opened and its real assets and self-hosted fonts loaded.
Review verified bookmarking Madeira, starting its three-day outline, renaming it
to “Atlantic, at our own pace”, choosing three travellers and 10 May 2027,
editing allowances to €80/room/night, €12.34/person/day, €35/group/day and a
€900 limit. The exact **€746.06** total remained after reload.

Explicit ordering and moving Funchal to day three also survived a full reload.
The itinerary and map controls showed Ponta de São Lourenço followed by Funchal,
with matching numbers, and the dates remained 10–12 May. Live motion pause
disabled route animation; resume restored motion. The SVG globe loaded when
scrolled into view, changed its selected destination to Dilijan and responded
to its rotate control. README contains an actual published-homepage screenshot.

This managed workspace has no approved local browser preview route. Automated
browser execution ran on GitHub Actions; manual review used the public Pages site.

## Remaining verification limits

- No physical-GPU or physical-device review, Safari coverage or complete
  accessibility certification is claimed. The cloud browser displayed the SVG
  globe fallback; it did not establish WebGL quality on real hardware.
- A print stylesheet exists, but no external PDF/print application or native
  print dialog was manually inspected.

## Bundle and asset observations

The successful build reports a 486.14 kB minified initial entry (160.11 kB gzip),
a 157.67 kB lazy globe chunk (62.94 kB gzip), and a 912.24 kB lazy WebGL chunk
(242.09 kB gzip). Vite warns about the WebGL chunk's size. The warning is retained;
the globe is deferred near the viewport and the WebGL renderer is a further lazy
enhancement. These are build sizes, not measured network or Core Web Vitals scores.

Photographs have 800/1800-pixel WebP variants. The initial Madeira hero is roughly
108 kB at 1800 pixels and 27 kB at 800 pixels. Other images load lazily where
applicable. Fonts are self-hosted. There are no invented Lighthouse or performance
scores.
