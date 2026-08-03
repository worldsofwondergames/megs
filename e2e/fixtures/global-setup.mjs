import { chromium } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

const AUTH_FILE = './e2e/.auth/state.json';
const WORLD_ID = 'megs-test-world';
const STATUS_URL = 'http://localhost:30000/api/status';

/**
 * Wait until Foundry reports the world is up and nobody is connected.
 *
 * Foundry allows ONE session per user, and it only frees the Gamemaster seat when
 * the socket disconnects -- which happens after browser.close() has already
 * returned. Without this wait the first worker races that release, fails to reach
 * game.ready, and burns its full 60s timeout before retrying. /api/status is
 * served over plain HTTP and takes no seat of its own, so polling it is safe.
 */
async function waitForFreeSeat({ timeoutMs = 30_000, pollMs = 250 } = {}) {
    const deadline = Date.now() + timeoutMs;
    let last = null;
    while (Date.now() < deadline) {
        try {
            const res = await fetch(STATUS_URL);
            last = await res.json();
            if (last.active === true && last.users === 0) return last;
        } catch (err) {
            last = { error: err.message };
        }
        await new Promise(r => setTimeout(r, pollMs));
    }
    throw new Error(
        `Foundry did not report an idle world within ${timeoutMs}ms. `
        + `Last /api/status: ${JSON.stringify(last)}. `
        + `A leftover browser from a killed run is the usual cause.`
    );
}

export default async function globalSetup() {
    mkdirSync(dirname(AUTH_FILE), { recursive: true });

    // Nothing may hold the seat before we log in either.
    await waitForFreeSeat();

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

    // browser.close() returns before Foundry has processed the disconnect, so
    // hand off to the first worker only once the seat is genuinely free.
    await waitForFreeSeat();
}
