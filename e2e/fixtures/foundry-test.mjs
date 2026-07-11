import { test as base, expect } from '@playwright/test';

export const test = base.extend({
    // Worker-scoped: one browser context and page shared by every test in the
    // worker, so the Foundry world loads once instead of once per test.
    workerPage: [async ({ browser }, use) => {
        const context = await browser.newContext();
        const page = await context.newPage();
        await page.goto('/game', { timeout: 60_000 });
        await page.waitForFunction(
            () => typeof game !== 'undefined' && game.ready === true,
            null,
            { timeout: 60_000 }
        );
        await use(page);
        await context.close();
    }, { scope: 'worker' }],

    // Every test's `page` is the shared worker page; close any Foundry
    // windows a test left open before handing it to the next test.
    page: async ({ workerPage }, use) => {
        await use(workerPage);
        await workerPage.evaluate(() => {
            Object.values(ui.windows).forEach(w => w.close());
        }).catch(() => {});
        await workerPage.waitForFunction(
            () => Object.keys(ui.windows).length === 0,
            null,
            { timeout: 5000 }
        ).catch(() => {});
    },
});

export { expect };
