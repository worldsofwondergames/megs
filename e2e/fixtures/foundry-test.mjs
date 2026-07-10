import { test as base, expect } from '@playwright/test';

export const test = base.extend({
    gameReady: [async ({ page }, use) => {
        await page.goto('/game');
        await page.waitForFunction(
            () => typeof game !== 'undefined' && game.ready === true,
            { timeout: 30_000 }
        );
        await use(page);
        await page.evaluate(() => {
            Object.values(ui.windows).forEach(w => w.close());
        });
    }, { auto: true }],
});

export { expect };
