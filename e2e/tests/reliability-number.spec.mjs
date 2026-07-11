import { test, expect } from '../fixtures/foundry-test.mjs';
import {
    prefixName,
    createHeroActor,
    addGadgetToActor,
    deleteActor,
    openActorSheet,
    openItemSheet,
    closeAllWindows,
} from '../fixtures/test-data.mjs';

test.describe('Gadget Reliability Number (#8)', () => {
    test('Non-zero R# is displayed in gadget description on actor sheet', async ({ page }) => {
        let actorId;
        try {
            actorId = await createHeroActor(page, prefixName('Reliability_Show'));
            await addGadgetToActor(page, actorId, {
                name: 'Throwing Blade',
                reliability: 4, // CONFIG.reliabilityScores[4] = 7
                attrs: { str: 5 },
            });

            await openActorSheet(page, actorId, 'gadgets');

            // The getGadgetDescription helper renders "R#7" for reliability index 4
            const descriptionText = await page.evaluate(() => {
                const descEl = document.querySelector('.sheet.actor .tab.gadgets .item-row .item-description');
                return descEl ? descEl.textContent.trim() : null;
            });

            expect(descriptionText).not.toBeNull();
            expect(descriptionText).toContain('R#7');
        } finally {
            await closeAllWindows(page);
            if (actorId) await deleteActor(page, actorId);
        }
    });

    test('R#0 (reliability index 0) is hidden from gadget description', async ({ page }) => {
        let actorId;
        try {
            actorId = await createHeroActor(page, prefixName('Reliability_Hide'));
            await addGadgetToActor(page, actorId, {
                name: 'Simple Rope',
                reliability: 0, // CONFIG.reliabilityScores[0] = 0
                attrs: { str: 3 },
            });

            await openActorSheet(page, actorId, 'gadgets');

            const descriptionText = await page.evaluate(() => {
                const descEl = document.querySelector('.sheet.actor .tab.gadgets .item-row .item-description');
                return descEl ? descEl.textContent.trim() : null;
            });

            expect(descriptionText).not.toBeNull();
            expect(descriptionText).not.toContain('R#');
        } finally {
            await closeAllWindows(page);
            if (actorId) await deleteActor(page, actorId);
        }
    });

    test('Reliability dropdown on gadget sheet has 7 options', async ({ page }) => {
        let actorId;
        try {
            actorId = await createHeroActor(page, prefixName('Reliability_Opts'));
            const gadgetId = await addGadgetToActor(page, actorId, {
                name: 'Gadget With Options',
                reliability: 3,
                attrs: { str: 4 },
            });

            // Set gadget item to edit mode so the dropdown renders
            await page.evaluate(({ actorId, gadgetId }) => {
                const actor = game.actors.get(actorId);
                const gadget = actor.items.get(gadgetId);
                gadget.setFlag('megs', 'edit-mode', true);
            }, { actorId, gadgetId });

            await openItemSheet(page, actorId, gadgetId);

            // Navigate to the abilities tab (default tab, but ensure it)
            await page.waitForSelector('.sheet.item select[name="system.reliability"]', { timeout: 5000 });

            const optionCount = await page.evaluate(() => {
                const select = document.querySelector('.sheet.item select[name="system.reliability"]');
                return select ? select.options.length : 0;
            });

            // CONFIG.reliabilityScores = [0, 2, 3, 5, 7, 9, 11] = 7 entries
            expect(optionCount).toBe(7);
        } finally {
            await closeAllWindows(page);
            if (actorId) await deleteActor(page, actorId);
        }
    });

    test('Changing reliability affects gadget cost calculation', async ({ page }) => {
        let actorId;
        try {
            actorId = await createHeroActor(page, prefixName('Reliability_Cost'));

            // Create gadget with reliability index 3 (R#5, modifier 0)
            const gadgetId = await addGadgetToActor(page, actorId, {
                name: 'Cost Test Gadget',
                reliability: 3, // R#5, modifier 0
                attrs: { str: 8 },
            });

            // Expected behavior (3E rules / AP Purchase Chart):
            //   STR 8 APs @ FC 6                     = 60 HP
            //   default gadget can be taken away     => ÷4 => 15 HP at R#5 (mod 0)
            //   R#0 adds +3 to factor costs => FC 9  => 90 HP ÷4 => ceil => 23 HP
            const costAtR5 = await page.evaluate(({ actorId, gadgetId }) => {
                const gadget = game.actors.get(actorId).items.get(gadgetId);
                gadget.prepareData();
                return gadget.system.totalCost;
            }, { actorId, gadgetId });
            expect(costAtR5).toBe(15);

            // Now change reliability to index 0 (R#0, modifier +3)
            await page.evaluate(({ actorId, gadgetId }) => {
                const gadget = game.actors.get(actorId).items.get(gadgetId);
                return gadget.update({ 'system.reliability': 0 });
            }, { actorId, gadgetId });

            const costAtR0 = await page.evaluate(({ actorId, gadgetId }) => {
                const gadget = game.actors.get(actorId).items.get(gadgetId);
                gadget.prepareData();
                return gadget.system.totalCost;
            }, { actorId, gadgetId });
            expect(costAtR0).toBe(23);
        } finally {
            await closeAllWindows(page);
            if (actorId) await deleteActor(page, actorId);
        }
    });

    test('Gadget cost tooltip shows the cost breakdown with final cost', async ({ page }) => {
        // Expected behavior: the character-creator gadget cost tooltip
        // breaks down attribute/AV/EV costs and ends with "Final Cost: N".
        // KNOWN BUG #245: a duplicate getGadgetCostTooltip registration in
        // megs.mjs replaces the detailed breakdown helper, so the tooltip
        // renders empty for gadget items. Remove test.fail() with #245.
        test.fail();
        let actorId;
        try {
            actorId = await createHeroActor(page, prefixName('Reliability_Tooltip'));
            const gadgetId = await addGadgetToActor(page, actorId, {
                name: 'Tooltip Test Gadget',
                reliability: 3, // R#5, modifier 0
                attrs: { str: 8 },
            });

            const tooltip = await page.evaluate(({ actorId, gadgetId }) => {
                const gadget = game.actors.get(actorId).items.get(gadgetId);
                return Handlebars.helpers.getGadgetCostTooltip(gadget);
            }, { actorId, gadgetId });

            // STR 8 APs @ FC 6 = 60 HP; ÷4 (can be taken away) => 15 HP
            expect(tooltip).toContain('Attributes: 60');
            expect(tooltip).toMatch(/Final Cost:\s*15/);
        } finally {
            await closeAllWindows(page);
            if (actorId) await deleteActor(page, actorId);
        }
    });
});
