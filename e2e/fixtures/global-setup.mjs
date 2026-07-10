import { chromium } from '@playwright/test';
import { mkdirSync } from 'fs';
import { dirname } from 'path';

const AUTH_FILE = './e2e/.auth/state.json';

export default async function globalSetup() {
    mkdirSync(dirname(AUTH_FILE), { recursive: true });

    const browser = await chromium.launch();
    const context = await browser.newContext();
    const page = await context.newPage();

    await page.goto('http://localhost:30000/game');
    await page.waitForURL('**/join', { timeout: 10_000 });

    const gmOption = await page.$('select[name="userid"] option');
    if (!gmOption) {
        throw new Error('No users found on join page — is Foundry running with a world loaded?');
    }

    await page.evaluate(() => {
        const select = document.querySelector('select[name="userid"]');
        const options = Array.from(select.options);
        const gm = options.find(o => o.text.includes('Gamemaster') || o.text.includes('gamemaster'));
        if (gm) {
            select.value = gm.value;
            select.dispatchEvent(new Event('change'));
        }
    });

    await page.locator('button[name="join"], button[type="submit"]').first().click();

    await page.waitForFunction(
        () => typeof game !== 'undefined' && game.ready === true,
        { timeout: 30_000 }
    );

    await page.evaluate(async () => {
        const e2eActors = game.actors.filter(a => a.name.startsWith('_E2E_'));
        for (const actor of e2eActors) {
            await actor.delete();
        }
    });

    await context.storageState({ path: AUTH_FILE });
    await browser.close();
}
