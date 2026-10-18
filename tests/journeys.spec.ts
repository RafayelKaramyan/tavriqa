import { expect, test, type Page, type TestInfo } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { readFile } from 'node:fs/promises';

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
});
const KEY = 'tavriqa.collection.v1';
async function start(page: Page, name = 'Madeira') {
  await page.goto('#/planner');
  const card = page
    .locator('.planner-start-grid > div')
    .filter({ has: page.getByRole('heading', { name, exact: true }) });
  await card.getByRole('button', { name: 'Start a 3-day plan', exact: true }).click();
  await expect(page.getByRole('heading', { level: 1 })).toContainText(`A few days in ${name}`);
}
async function fit(page: Page) {
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1),
  ).toBe(true);
}
async function audit(page: Page) {
  const result = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
    .analyze();
  expect(result.violations).toEqual([]);
  await fit(page);
}
async function capture(page: Page, info: TestInfo, name: string) {
  await page.evaluate(async () => {
    document.querySelectorAll('img').forEach((image) => {
      image.loading = 'eager';
    });
    await document.fonts.ready;
    await Promise.all(Array.from(document.images, (image) => image.decode().catch(() => {})));
  });
  await page.screenshot({ path: info.outputPath(`${name}.png`), fullPage: true, scale: 'css' });
}

test('the homepage tells the story, changes its featured destination and saves inspiration', async ({
  page,
}, info) => {
  await page.goto('./');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Take the');
  await expect(page.locator('.hero-photo')).toBeVisible();
  await expect
    .poll(() =>
      page.locator('.hero-photo').evaluate((image) => (image as HTMLImageElement).naturalWidth),
    )
    .toBeGreaterThan(0);
  await page.getByRole('button', { name: 'Feature South Iceland', exact: true }).click();
  await expect(page.locator('.hero-destination h2')).toHaveText('South Iceland');
  await expect(page.getByRole('link', { name: /Step into the story/ })).toHaveAttribute(
    'href',
    '#/destinations/iceland',
  );
  const madeira = page
    .locator('.destination-card')
    .filter({ has: page.getByRole('heading', { name: 'Madeira', exact: true }) });
  await madeira.getByRole('button', { name: 'Save Madeira', exact: true }).click();
  await page.locator('.atlas-section').scrollIntoViewIfNeeded();
  await expect(page.locator('.globe-shell')).toBeVisible();
  await page.locator('.site-footer').scrollIntoViewIfNeeded();
  await page.getByRole('heading', { level: 1 }).scrollIntoViewIfNeeded();
  await audit(page);
  await capture(page, info, 'home');
  await page.goto('#/trips?tab=destinations');
  await expect(page.locator('.trips-page')).toBeVisible();
  await expect(page.locator('.destination-card h3')).toHaveText('Madeira');
  await page.getByRole('button', { name: 'Unsave Madeira', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Keep a little inspiration.' })).toBeVisible();
});

test('atlas filters survive reload and a filtered globe plans the visible destination', async ({
  page,
}, info) => {
  await page.goto('#/destinations');
  await page.getByRole('textbox', { name: 'Search destinations', exact: true }).fill('Dolomites');
  await expect(page.locator('.destination-card')).toHaveCount(1);
  await page.reload();
  await expect(page.getByRole('textbox', { name: 'Search destinations' })).toHaveValue('Dolomites');
  await page.getByRole('button', { name: 'Clear destination search' }).click();
  await page.getByRole('button', { name: 'Mountains', exact: true }).click();
  await expect(page.locator('.destination-card h3')).toHaveText('The Dolomites');
  await page.getByRole('button', { name: 'Globe view' }).click();
  await expect(page.getByRole('button', { name: 'Plan The Dolomites', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Card view' }).click();
  await page.getByRole('link', { name: 'Explore The Dolomites', exact: true }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'The Dolomites' })).toBeVisible();
  await audit(page);
  await capture(page, info, 'destination');
  await page.getByRole('button', { name: 'Start with a 3-day plan', exact: true }).click();
  await expect(page.getByRole('heading', { level: 1 })).toContainText(
    'A few days in The Dolomites',
  );
});

test('trip details and precise group-budget changes persist after a full reload', async ({
  page,
}, info) => {
  await start(page);
  await page.getByRole('button', { name: 'Trip details', exact: true }).click();
  let dialog = page.getByRole('dialog');
  await dialog.getByLabel('Trip name', { exact: false }).fill('Atlantic, at our own pace');
  await dialog.locator('input[type=date]').fill('2027-05-10');
  await dialog.getByLabel('Travellers', { exact: true }).selectOption('3');
  await dialog.getByRole('button', { name: 'Save trip details' }).click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Atlantic, at our own pace');
  await page.getByRole('button', { name: 'Edit budget allowances' }).click();
  dialog = page.getByRole('dialog');
  await dialog.getByLabel('Stay / room / night', { exact: false }).fill('80');
  await dialog.getByLabel('Food / traveller / day', { exact: false }).fill('12.34');
  await dialog.getByLabel('Transport / group / day', { exact: false }).fill('35');
  await dialog.getByLabel('Total trip budget', { exact: false }).fill('900');
  await dialog.getByRole('button', { name: 'Save allowances' }).click();
  await expect(page.locator('.budget-total')).toContainText('€746.06');
  await page.reload();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Atlantic, at our own pace');
  await expect(page.locator('.budget-total')).toContainText('€746.06');
  await expect(page.getByRole('button', { name: /Day 1, 10 May, 2 places/ })).toBeVisible();
  await audit(page);
  await capture(page, info, 'planner');
});

test('keyboard sorting and explicit cross-day controls keep every place exactly once', async ({
  page,
}) => {
  await start(page);
  const handle = page.getByRole('button', { name: 'Drag Funchal old town', exact: true });
  await handle.focus();
  await page.keyboard.press('Space');
  await expect(handle).toHaveAttribute('aria-pressed', 'true');
  await page.keyboard.press('ArrowDown');
  await expect(page.locator('[id^="DndLiveRegion"]')).toContainText('is over Cabo Girão');
  await page.keyboard.press('Space');
  const list = page.getByRole('list', { name: 'Day 1 places', exact: true });
  await expect(list.locator('.stop-name')).toHaveText(['Cabo Girão', 'Funchal old town']);
  await expect(page.locator('.map-place-controls button')).toHaveText([
    '1. Cabo Girão',
    '2. Funchal old town',
  ]);
  const day3Value = await page
    .getByRole('combobox', { name: 'Move Funchal old town to day', exact: true })
    .locator('option')
    .filter({ hasText: 'Day 3' })
    .getAttribute('value');
  await page
    .getByRole('combobox', { name: 'Move Funchal old town to day', exact: true })
    .selectOption(day3Value!);
  await expect(list.locator('.stop-name')).toHaveText(['Cabo Girão']);
  await page.getByRole('button', { name: /^Day 3,/ }).click();
  await expect(page.getByRole('list', { name: 'Day 3 places' }).locator('.stop-name')).toHaveText([
    'Ponta de São Lourenço',
    'Funchal old town',
  ]);
  await page.reload();
  await page.getByRole('button', { name: /^Day 3,/ }).click();
  await expect(page.getByRole('button', { name: 'Show Funchal old town on map' })).toBeVisible();
});

test('a pointer drag reorders the actual itinerary', async ({ page, isMobile }) => {
  test.skip(
    isMobile,
    'Pointer dragging is exercised on desktop; mobile has the same keyboard and explicit move controls.',
  );
  await start(page);
  const source = page.getByRole('button', { name: 'Drag Funchal old town', exact: true }),
    target = page.getByRole('button', { name: 'Drag Cabo Girão', exact: true });
  await page.getByRole('list', { name: 'Day 1 places', exact: true }).scrollIntoViewIfNeeded();
  const a = await source.boundingBox(),
    b = await target.boundingBox();
  expect(a).toBeTruthy();
  expect(b).toBeTruthy();
  await page.mouse.move(a!.x + a!.width / 2, a!.y + a!.height / 2);
  await page.mouse.down();
  await page.mouse.move(a!.x + a!.width / 2 + 12, a!.y + a!.height / 2 + 12, { steps: 3 });
  await expect(source).toHaveAttribute('aria-pressed', 'true');
  await page.mouse.move(b!.x + b!.width / 2, b!.y + b!.height / 2 + 5, { steps: 15 });
  await expect(page.locator('[id^="DndLiveRegion"]')).toContainText('is over Cabo Girão');
  await page.mouse.up();
  await expect(page.getByRole('list', { name: 'Day 1 places' }).locator('.stop-name')).toHaveText([
    'Cabo Girão',
    'Funchal old town',
  ]);
});

test('places, Unicode notes, zero allowances and empty-day removal form a complete editing flow', async ({
  page,
}) => {
  await start(page);
  await page.getByRole('button', { name: 'Add Seixal to day 1', exact: true }).click();
  await page.getByRole('button', { name: 'Edit Seixal', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Seixal', exact: true });
  await dialog.getByLabel('A note for later', { exact: false }).fill('Սուրճ ☕ — a slow afternoon');
  await dialog.getByLabel('Place allowance / traveller', { exact: false }).fill('0');
  await audit(page);
  await dialog.getByRole('button', { name: 'Save place details' }).click();
  await page.reload();
  await expect(page.locator('.stop-note')).toHaveText('Սուրճ ☕ — a slow afternoon');
  await page.getByRole('button', { name: 'Remove Seixal', exact: true }).click();
  await expect(
    page.getByRole('button', { name: 'Add Seixal to day 1', exact: true }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Add day', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'A little room for possibility.' })).toBeVisible();
  await page.getByRole('button', { name: 'Remove empty day 4' }).click();
  await expect(page.getByRole('button', { name: /^Day 4,/ })).toHaveCount(0);
});

test('a shared itinerary creates an independent copy and never overwrites its source', async ({
  page,
}) => {
  await start(page);
  const original = page.url();
  await page.getByRole('button', { name: 'Share', exact: true }).click();
  const url = await page.getByRole('textbox', { name: 'Trip link', exact: true }).inputValue();
  await page.getByRole('button', { name: 'Close dialog' }).click();
  await page.goto(url);
  await expect(
    page.getByRole('heading', { name: 'A few days in Madeira', exact: true }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Save a copy to my trips' }).click();
  await expect(page).toHaveURL(/#\/plan\//);
  expect(page.url()).not.toBe(original);
  await page.getByRole('button', { name: 'Trip details', exact: true }).click();
  await page
    .getByRole('dialog')
    .getByLabel('Trip name', { exact: false })
    .fill('An independent copy');
  await page.getByRole('button', { name: 'Save trip details' }).click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('An independent copy');
  await page.goto(original);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('A few days in Madeira');
});

test('export, import, duplication and guarded deletion preserve the remaining trips', async ({
  page,
}) => {
  await start(page);
  await page.getByRole('button', { name: 'Export', exact: true }).click();
  const pending = page.waitForEvent('download');
  await page.getByRole('button', { name: /^Trip file/ }).click();
  const file = await pending,
    path = await file.path();
  expect(file.suggestedFilename()).toBe('tavriqa-trip.json');
  const bytes = await readFile(path!);
  expect(JSON.parse(bytes.toString()).format).toBe('tavriqa-trip');
  await page.getByRole('button', { name: 'Close dialog' }).click();
  await page.goto('#/trips');
  await page
    .locator('input[type=file]')
    .setInputFiles({ name: 'travel.json', mimeType: 'application/json', buffer: bytes });
  await expect(page).toHaveURL(/#\/plan\//);
  await page.goto('#/trips');
  await expect(page.locator('.saved-trip-card')).toHaveCount(2);
  await page
    .locator('.saved-trip-card')
    .first()
    .getByRole('button', { name: 'Duplicate A few days in Madeira', exact: true })
    .click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('A few days in Madeira (copy)');
  await page.goto('#/trips');
  await expect(page.locator('.saved-trip-card')).toHaveCount(3);
  await page
    .getByRole('button', { name: 'Delete A few days in Madeira (copy)', exact: true })
    .click();
  await page.getByRole('button', { name: 'Keep my trip', exact: true }).click();
  await expect(page.locator('.saved-trip-card')).toHaveCount(3);
  await page
    .getByRole('button', { name: 'Delete A few days in Madeira (copy)', exact: true })
    .click();
  await page.getByRole('button', { name: 'Delete trip permanently', exact: true }).click();
  await expect(page.locator('.saved-trip-card')).toHaveCount(2);
  await page.reload();
  await expect(page.locator('.saved-trip-card')).toHaveCount(2);
  await audit(page);
});

test('damaged storage is preserved, exportable and reset only after explicit confirmation', async ({
  page,
}) => {
  await page.addInitScript(({ key }) => localStorage.setItem(key, '{unfinished'), { key: KEY });
  await page.goto('#/trips');
  await expect(
    page.getByRole('complementary', { name: 'Saved collection needs attention' }),
  ).toBeVisible();
  const pending = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export original data' }).click();
  const file = await pending;
  expect(await readFile((await file.path())!, 'utf8')).toBe('{unfinished');
  await page.getByRole('button', { name: 'Reset collection', exact: true }).click();
  await page.getByRole('button', { name: 'Keep original data' }).click();
  expect(await page.evaluate((key) => localStorage.getItem(key), KEY)).toBe('{unfinished');
  await page.getByRole('button', { name: 'Reset collection', exact: true }).click();
  await page.getByRole('button', { name: 'Reset saved collection', exact: true }).click();
  await expect(
    page.getByRole('complementary', { name: 'Saved collection needs attention' }),
  ).toHaveCount(0);
  await expect(
    page.getByRole('heading', { name: 'Your next story is still unwritten.' }),
  ).toBeVisible();
});

test('blocked writes never pretend a trip was created', async ({ page }) => {
  await page.addInitScript(
    ({ key }) => {
      const original = Storage.prototype.setItem;
      Storage.prototype.setItem = function (name, value) {
        if (name === key) throw new DOMException('Quota exceeded', 'QuotaExceededError');
        original.call(this, name, value);
      };
    },
    { key: KEY },
  );
  await page.goto('#/planner');
  await page
    .locator('.planner-start-grid > div')
    .first()
    .getByRole('button', { name: 'Start a 3-day plan', exact: true })
    .click();
  await expect(page.locator('.feedback').getByRole('alert')).toContainText('not saved');
  await expect(page).toHaveURL(/#\/planner$/);
  await page.goto('#/trips');
  await expect(page.locator('.saved-trip-card')).toHaveCount(0);
});

test('an editor opened before another tab changed the trip must review the new version', async ({
  page,
  context,
}) => {
  await start(page);
  const url = page.url(),
    other = await context.newPage();
  await other.goto(url);
  await page.getByRole('button', { name: 'Trip details', exact: true }).click();
  await other.getByRole('button', { name: 'Trip details', exact: true }).click();
  await other
    .getByRole('dialog')
    .getByLabel('Trip name', { exact: false })
    .fill('The newer chapter');
  await other.getByRole('button', { name: 'Save trip details' }).click();
  await expect(other.getByRole('heading', { level: 1 })).toHaveText('The newer chapter');
  await page.getByRole('dialog').getByLabel('Trip name', { exact: false }).fill('A stale chapter');
  await page.getByRole('button', { name: 'Save trip details' }).click();
  await expect(page.getByRole('dialog').getByRole('alert')).toContainText('changed in another tab');
  await page.getByRole('button', { name: 'Close dialog' }).click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('The newer chapter');
  await other.close();
});

test('globe fallback and a motion pause keep the full experience usable', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
      value: function (this: HTMLCanvasElement, id: string, ...args: unknown[]) {
        if (id.startsWith('webgl')) return null;
        return Reflect.apply(original, this, [id, ...args]);
      },
    });
  });
  await page.goto('./');
  await expect(page.locator('html')).toHaveAttribute('data-motion', 'full');
  await page.locator('.atlas-section').scrollIntoViewIfNeeded();
  await expect(page.locator('.flat-globe')).toBeVisible();
  await page.getByRole('button', { name: 'Rotate globe east' }).click();
  await page.getByRole('button', { name: 'Pause decorative motion' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-motion', 'reduced');
  expect(
    await page
      .locator('.hero-seal>svg')
      .first()
      .evaluate((element) => getComputedStyle(element).animationName),
  ).toBe('none');
  await page.getByRole('button', { name: 'Resume decorative motion' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-motion', 'full');
  await fit(page);
});

test('keyboard navigation, missing pages and malformed shared links have clear recovery', async ({
  page,
}) => {
  await page.goto('#/about');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Made for');
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'Skip to content', exact: true })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('#main')).toBeFocused();
  await audit(page);
  await page.goto('#/destinations/not-a-place');
  await expect(
    page.getByRole('heading', { name: 'That direction is outside our atlas.' }),
  ).toBeVisible();
  await page.goto('#/plan/not-a-trip');
  await expect(
    page.getByRole('heading', { name: 'This trip is not in your collection.' }),
  ).toBeVisible();
  await page.goto('#/import?trip=broken');
  await expect(
    page.getByRole('heading', { name: 'This shared chapter could not open.' }),
  ).toBeVisible();
  await page.goto('#/not-a-page');
  await expect(page.getByRole('heading', { name: 'A little off the map.' })).toBeVisible();
  await fit(page);
});
