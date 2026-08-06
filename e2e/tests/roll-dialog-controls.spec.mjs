import { test, expect } from '../fixtures/foundry-test.mjs';
import {
    prefixName,
    createHeroActor,
    deleteActor,
    openActorSheet,
    closeAllWindows,
} from '../fixtures/test-data.mjs';
import {
    waitForRollDialog,
    closeRollDialog,
    getChatMessageCount,
} from '../fixtures/roll-helpers.mjs';

/**
 * Issue #275: Foundry v14 runs DialogV2 string content through
 * foundry.utils.cleanHTML(), which strips every inline on* attribute. The roll
 * dialog's controls used to rely on them, so its +/- buttons became bare submit
 * buttons that closed the dialog and discarded the roll, and its hero-point
 * slider readouts never moved.
 *
 * These tests drive the controls the way a player does -- real clicks and a real
 * pointer drag -- because the defect was invisible to any test that set .value
 * directly, which is what every other spec here does.
 */
test.describe('Roll dialog controls (#275)', () => {
    async function setHeroPoints(page, actorId, value) {
        await page.evaluate(async ({ id, value }) => {
            await game.actors.get(id).update({ 'system.heroPoints.value': value });
        }, { id: actorId, value });
    }

    async function openDexRollDialog(page, actorId) {
        await page.evaluate(() => {
            for (const t of [...game.user.targets]) {
                t.setTarget(false, { user: game.user, releaseOthers: false });
            }
        });
        await openActorSheet(page, actorId, 'abilities');
        await page.click('.sheet.actor .tab.abilities .resource-label.rollable[data-key="dex"]');
        await waitForRollDialog(page);
    }

    /** Expand "Hero Point options" by clicking its summary, as a player would. */
    async function openHeroPointOptions(page) {
        await page.locator('dialog.dialog[open] .megs-dialog details').first()
            .locator('summary').click();
        await page.waitForFunction(
            () => [...document.querySelectorAll('dialog.dialog[open]')]
                .find(d => d.querySelector('#actionValue'))
                ?.querySelector('details')?.open === true,
            null,
            { timeout: 5000 }
        );
    }

    function stepper(page, fieldId, direction) {
        return page.locator(
            `dialog.dialog[open] .quantity[data-control="stepper"]:has(#${fieldId}) button.${direction}`
        );
    }

    test('the + button raises the field instead of submitting the dialog', async ({ page }) => {
        let actorId;
        try {
            actorId = await createHeroActor(page, prefixName('RDC_Plus'), { dex: 8 });
            await openDexRollDialog(page, actorId);

            const av = page.locator('dialog.dialog[open] #actionValue');
            await expect(av).toHaveValue('8');

            const chatBefore = await getChatMessageCount(page);
            await stepper(page, 'actionValue', 'plus').click();
            await stepper(page, 'actionValue', 'plus').click();

            await expect(av).toHaveValue('10');
            // The regression: a stripped handler left a submit button, so clicking
            // + tore the dialog down and the roll was lost.
            await expect(page.locator('dialog.dialog[open] #actionValue')).toBeVisible();
            expect(await getChatMessageCount(page)).toBe(chatBefore);

            await closeRollDialog(page);
        } finally {
            await closeAllWindows(page);
            if (actorId) await deleteActor(page, actorId);
        }
    });

    test('the - button lowers the field and stops at its minimum', async ({ page }) => {
        let actorId;
        try {
            actorId = await createHeroActor(page, prefixName('RDC_Minus'), { dex: 2 });
            await openDexRollDialog(page, actorId);

            const av = page.locator('dialog.dialog[open] #actionValue');
            await expect(av).toHaveValue('2');

            await stepper(page, 'actionValue', 'minus').click();
            await expect(av).toHaveValue('1');
            await stepper(page, 'actionValue', 'minus').click();
            await expect(av).toHaveValue('0');
            // min="0" on the input, so a further click must not go negative.
            await stepper(page, 'actionValue', 'minus').click();
            await expect(av).toHaveValue('0');

            await closeRollDialog(page);
        } finally {
            await closeAllWindows(page);
            if (actorId) await deleteActor(page, actorId);
        }
    });

    test('dragging a hero-point slider updates the number beside it', async ({ page }) => {
        let actorId;
        try {
            actorId = await createHeroActor(page, prefixName('RDC_Slider'), { dex: 8 });
            await setHeroPoints(page, actorId, 10);
            await openDexRollDialog(page, actorId);
            await openHeroPointOptions(page);

            const slider = page.locator('dialog.dialog[open] input[name="hpSpentAV"]');
            const readout = page.locator('dialog.dialog[open] #hpSpentAPRangeValue');

            // Assert the starting state before asserting it changes, so a renamed
            // selector fails here rather than silently matching nothing later.
            await expect(slider).toHaveValue('0');
            await expect(readout).toHaveText('0');

            const box = await slider.boundingBox();
            await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
            await page.mouse.down();
            await page.mouse.move(box.x + box.width - 1, box.y + box.height / 2, { steps: 10 });
            await page.mouse.up();

            // max is min(heroPoints 10, DEX 8) = 8.
            await expect(slider).toHaveValue('8');
            await expect(readout).toHaveText('8');

            await closeRollDialog(page);
        } finally {
            await closeAllWindows(page);
            if (actorId) await deleteActor(page, actorId);
        }
    });

    test('with no hero points the sliders are capped at 0 and say so', async ({ page }) => {
        let actorId;
        try {
            actorId = await createHeroActor(page, prefixName('RDC_Broke'), { dex: 8 });
            await setHeroPoints(page, actorId, 0);
            await openDexRollDialog(page, actorId);
            await openHeroPointOptions(page);

            const slider = page.locator('dialog.dialog[open] input[name="hpSpentAV"]');
            await expect(slider).toHaveAttribute('max', '0');

            const available = page.locator('dialog.dialog[open] .hero-points-available');
            await expect(available).toBeVisible();
            await expect(available).toContainText('0');
            await expect(available.locator('.hint')).toBeVisible();

            await closeRollDialog(page);
        } finally {
            await closeAllWindows(page);
            if (actorId) await deleteActor(page, actorId);
        }
    });

    test('the available hero point total is shown when the actor has some', async ({ page }) => {
        let actorId;
        try {
            actorId = await createHeroActor(page, prefixName('RDC_Avail'), { dex: 8 });
            await setHeroPoints(page, actorId, 37);
            await openDexRollDialog(page, actorId);
            await openHeroPointOptions(page);

            const available = page.locator('dialog.dialog[open] .hero-points-available');
            await expect(available).toContainText('37');
            // The "nothing to spend" hint belongs only to the zero case.
            await expect(available.locator('.hint')).toHaveCount(0);

            await closeRollDialog(page);
        } finally {
            await closeAllWindows(page);
            if (actorId) await deleteActor(page, actorId);
        }
    });
});
