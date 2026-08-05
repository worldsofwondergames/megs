import { test as base } from '@playwright/test';
export { expect } from '@playwright/test';

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
        await workerPage.evaluate(async () => {
            // Sheets still extend the V1 ActorSheet/ItemSheet and register in
            // ui.windows, but every MEGS dialog is a DialogV2, which registers in
            // foundry.applications.instances instead. Calling close() on the native
            // <dialog> element skips the V2 teardown, leaving the app registered and
            // its element in the DOM for the next test to pick up by mistake, so
            // close through the app. Core UI (directories, HUD) shares that registry
            // and must be left alone -- none of it renders as <dialog>.
            for (const app of [...foundry.applications.instances.values()]) {
                if (app.element?.tagName === 'DIALOG') await app.close();
            }
            for (const w of Object.values(ui.windows)) w.close();
        });
        // Not swallowed: leaked state here is what makes later tests fail in
        // confusing ways, so it should fail the test that caused it.
        await workerPage.waitForFunction(
            () => ![...foundry.applications.instances.values()]
                .some(a => a.element?.tagName === 'DIALOG')
                && Object.keys(ui.windows).length === 0
                && !document.querySelector('dialog[open]'),
            null,
            { timeout: 5000 }
        );
    },
});


