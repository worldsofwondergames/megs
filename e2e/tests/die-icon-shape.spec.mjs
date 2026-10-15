import { test, expect } from '../fixtures/foundry-test.mjs';
import {
    prefixName,
    createHeroActor,
    addPowerToActor,
    deleteActor,
    openActorSheet,
    closeAllWindows,
} from '../fixtures/test-data.mjs';

/**
 * Issue #283: the blue die on rollable powers looked stretched next to the gray
 * die on auto powers. Each die is drawn into a canvas at its rendered size, and
 * the width and height of its visible pixels, in rendered pixels, are compared.
 */
test.describe('Die icon shape (#283)', () => {
    /** Width and height, in rendered pixels, of the opaque pixels of the die in `rowSelector`. */
    async function dieShape(page, rowSelector) {
        const img = page.locator(`${rowSelector} .item-controls a.d10.rollable img`);
        await expect(img).toHaveCount(1);
        await expect.poll(() => img.evaluate(el => el.complete && el.naturalWidth > 0)).toBe(true);
        return img.evaluate((el) => {
            const scale = 10;
            const w = Math.round(el.getBoundingClientRect().width * scale);
            const h = Math.round(el.getBoundingClientRect().height * scale);
            const canvas = document.createElement('canvas');
            canvas.width = w;
            canvas.height = h;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(el, 0, 0, w, h);
            const { data } = ctx.getImageData(0, 0, w, h);
            let top = h;
            let bottom = -1;
            let left = w;
            let right = -1;
            for (let y = 0; y < h; y++) {
                for (let x = 0; x < w; x++) {
                    if (data[(y * w + x) * 4 + 3] > 32) {
                        top = Math.min(top, y);
                        bottom = Math.max(bottom, y);
                        left = Math.min(left, x);
                        right = Math.max(right, x);
                    }
                }
            }
            if (right < 0) throw new Error('die image drew no visible pixels');
            return { width: (right - left + 1) / scale, height: (bottom - top + 1) / scale };
        });
    }

    test('the rollable power die has the same size and shape as the auto power die', async ({ page }) => {
        let actorId;
        try {
            actorId = await createHeroActor(page, prefixName('DieShape'));
            const autoId = await addPowerToActor(page, actorId, {
                name: 'Flight', aps: 6, baseCost: 10, factorCost: 1, link: 'dex', type: 'auto',
            });
            const diceId = await addPowerToActor(page, actorId, {
                name: 'Energy Blast', aps: 8, baseCost: 15, factorCost: 3, link: 'str', type: 'dice',
            });
            await page.evaluate(async (id) => {
                await game.actors.get(id).setFlag('megs', 'edit-mode', false);
            }, actorId);

            await openActorSheet(page, actorId, 'powers');
            const gray = await dieShape(page, `.sheet.actor .tab.powers .item-row[data-item-id="${autoId}"]`);
            const blue = await dieShape(page, `.sheet.actor .tab.powers .item-row[data-item-id="${diceId}"]`);

            expect(blue.width).toBeCloseTo(gray.width, 0);
            expect(blue.height).toBeCloseTo(gray.height, 0);
        } finally {
            await closeAllWindows(page);
            if (actorId) await deleteActor(page, actorId);
        }
    });
});
