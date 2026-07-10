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
                name: 'Batarang',
                reliability: 4, // CONFIG.reliabilityScores[4] = 7
                attrs: { str: 5 },
            });

            await openActorSheet(page, actorId, 'gadgets');

            // The getGadgetDescription helper renders "R#7" for reliability index 4
            const descriptionText = await page.evaluate(() => {
                const descEl = document.querySelector('.sheet.actor .tab.gadgets .item-description');
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
                const descEl = document.querySelector('.sheet.actor .tab.gadgets .item-description');
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

            // Read the gadget cost tooltip to understand the cost at R#5
            const costAtR5 = await page.evaluate(({ actorId, gadgetId }) => {
                const actor = game.actors.get(actorId);
                const gadget = actor.items.get(gadgetId);
                // The getGadgetCostTooltip helper calculates costs
                // We can use the Handlebars helper directly
                const helper = Handlebars.helpers.getGadgetCostTooltip;
                // Build gadget context similar to how the template does
                const gadgetData = {
                    ...gadget,
                    _id: gadget.id,
                    ownerId: actorId,
                    system: gadget.system,
                    name: gadget.name,
                };
                return helper(gadgetData);
            }, { actorId, gadgetId });

            // Now change reliability to index 0 (R#0, modifier +3)
            await page.evaluate(({ actorId, gadgetId }) => {
                const actor = game.actors.get(actorId);
                const gadget = actor.items.get(gadgetId);
                return gadget.update({ 'system.reliability': 0 });
            }, { actorId, gadgetId });

            // Wait for update to propagate
            await page.waitForTimeout(500);

            const costAtR0 = await page.evaluate(({ actorId, gadgetId }) => {
                const actor = game.actors.get(actorId);
                const gadget = actor.items.get(gadgetId);
                const helper = Handlebars.helpers.getGadgetCostTooltip;
                const gadgetData = {
                    ...gadget,
                    _id: gadget.id,
                    ownerId: actorId,
                    system: gadget.system,
                    name: gadget.name,
                };
                return helper(gadgetData);
            }, { actorId, gadgetId });

            // R#0 has modifier +3 (increasing factor costs), so the total cost
            // should be higher than at R#5 (modifier 0)
            // Extract "Final Cost: X" from the tooltip text
            const finalCostR5 = parseInt(costAtR5.match(/Final Cost:\s*(\d+)/)?.[1] || '0');
            const finalCostR0 = parseInt(costAtR0.match(/Final Cost:\s*(\d+)/)?.[1] || '0');

            expect(finalCostR0).toBeGreaterThan(finalCostR5);
        } finally {
            await closeAllWindows(page);
            if (actorId) await deleteActor(page, actorId);
        }
    });
});
