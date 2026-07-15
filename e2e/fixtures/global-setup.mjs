import { chromium } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

const AUTH_FILE = './e2e/.auth/state.json';
const WORLD_ID = 'megs-test-world';

export default async function globalSetup() {
    mkdirSync(dirname(AUTH_FILE), { recursive: true });

    const browser = await chromium.launch({ headless: false });
    const context = await browser.newContext();
    const page = await context.newPage();

    await page.goto('http://localhost:30000');
    await page.waitForLoadState('domcontentloaded');

    // If on setup page, launch the test world
    if (page.url().includes('/setup')) {
        await page.locator(`li:has(h3:has-text("MEGS Test World")) a[data-action="worldLaunch"]`).click({ force: true });
        await page.waitForURL('**/join', { timeout: 60_000 });
    }

    // Select Gamemaster and join
    await page.waitForSelector('select[name="userid"]', { timeout: 60_000 });
    await page.locator('select[name="userid"]').selectOption({ label: 'Gamemaster' });
    await page.locator('button:has-text("Join Game Session")').click();

    await page.waitForFunction(
        () => typeof game !== 'undefined' && game.ready === true,
        null,
        { timeout: 60_000 }
    );

    // Clean up leftover test actors
    await page.evaluate(async () => {
        const e2eActors = game.actors.filter(a => a.name.startsWith('_E2E_'));
        for (const actor of e2eActors) {
            await actor.delete();
        }
    });

    await context.storageState({ path: AUTH_FILE });
    await browser.close();
}
