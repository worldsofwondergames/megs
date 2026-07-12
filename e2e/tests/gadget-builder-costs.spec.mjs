import { test, expect } from '../fixtures/foundry-test.mjs';
import {
    prefixName,
    createHeroActor,
    addGadgetToActor,
    deleteActor,
    closeAllWindows,
} from '../fixtures/test-data.mjs';

/**
 * Verifies that the Gadget Builder sheet correctly displays HP costs
 * for attributes. Regression test for #255.
 */
test.describe('Gadget Builder Attribute Costs (#255)', () => {
    test('Body 2 at R#5 (reliability index 3) shows 6 HP', async ({ page }) => {
        let actorId;
        try {
            actorId = await createHeroActor(page, prefixName('GBCost_R5'));
            const gadgetId = await addGadgetToActor(page, actorId, {
                name: 'Test Gadget R5',
                attrs: { body: 2 },
                reliability: 3, // Index 3 = R#5, no FC modifier
            });

            // Open gadget builder sheet
            await page.evaluate(async ({ actorId, gadgetId }) => {
                const actor = game.actors.get(actorId);
                const gadget = actor.items.get(gadgetId);
                await gadget.setFlag('core', 'sheetClass', 'megs.MEGSGadgetBuilderSheet');
                gadget.sheet.render(true);
            }, { actorId, gadgetId });
            await page.waitForSelector('.sheet.item.gadget-builder', { timeout: 5000 });

            // Get the Body attribute cost text
            const bodyCost = await page.evaluate(() => {
                const rows = document.querySelectorAll('.sheet.item.gadget-builder .attribute');
                for (const row of rows) {
                    const label = row.querySelector('.resource-label');
                    if (label && label.textContent.trim() === 'BODY') {
                        const cost = row.querySelector('.cost-value');
                        return cost ? cost.textContent.trim() : null;
                    }
                }
                return null;
            });

            // 2 APs at FC 6 = 6 HP
            expect(bodyCost).toBe('6 HP');
        } finally {
            await closeAllWindows(page);
            if (actorId) await deleteActor(page, actorId);
        }
    });

    test('Body 2 at R#0 (reliability index 0) shows 9 HP', async ({ page }) => {
        let actorId;
        try {
            actorId = await createHeroActor(page, prefixName('GBCost_R0'));
            const gadgetId = await addGadgetToActor(page, actorId, {
                name: 'Test Gadget R0',
                attrs: { body: 2 },
                reliability: 0, // Index 0 = R#0, +3 to FC
            });

            await page.evaluate(async ({ actorId, gadgetId }) => {
                const actor = game.actors.get(actorId);
                const gadget = actor.items.get(gadgetId);
                await gadget.setFlag('core', 'sheetClass', 'megs.MEGSGadgetBuilderSheet');
                gadget.sheet.render(true);
            }, { actorId, gadgetId });
            await page.waitForSelector('.sheet.item.gadget-builder', { timeout: 5000 });

            const bodyCost = await page.evaluate(() => {
                const rows = document.querySelectorAll('.sheet.item.gadget-builder .attribute');
                for (const row of rows) {
                    const label = row.querySelector('.resource-label');
                    if (label && label.textContent.trim() === 'BODY') {
                        const cost = row.querySelector('.cost-value');
                        return cost ? cost.textContent.trim() : null;
                    }
                }
                return null;
            });

            // 2 APs at FC (6+3=9) = 9 HP
            expect(bodyCost).toBe('9 HP');
        } finally {
            await closeAllWindows(page);
            if (actorId) await deleteActor(page, actorId);
        }
    });

    test('Changing reliability updates displayed costs', async ({ page }) => {
        let actorId;
        try {
            actorId = await createHeroActor(page, prefixName('GBCost_Change'));
            const gadgetId = await addGadgetToActor(page, actorId, {
                name: 'Test Gadget Change',
                attrs: { body: 2 },
                reliability: 3, // Start at R#5
            });

            await page.evaluate(async ({ actorId, gadgetId }) => {
                const actor = game.actors.get(actorId);
                const gadget = actor.items.get(gadgetId);
                await gadget.setFlag('core', 'sheetClass', 'megs.MEGSGadgetBuilderSheet');
                gadget.sheet.render(true);
            }, { actorId, gadgetId });
            await page.waitForSelector('.sheet.item.gadget-builder', { timeout: 5000 });

            // Change reliability to index 0 (R#0, +3 to FC)
            await page.evaluate(async ({ actorId, gadgetId }) => {
                const actor = game.actors.get(actorId);
                const gadget = actor.items.get(gadgetId);
                await gadget.update({ 'system.reliability': 0 });
            }, { actorId, gadgetId });
            await page.waitForTimeout(500);

            const bodyCost = await page.evaluate(() => {
                const rows = document.querySelectorAll('.sheet.item.gadget-builder .attribute');
                for (const row of rows) {
                    const label = row.querySelector('.resource-label');
                    if (label && label.textContent.trim() === 'BODY') {
                        const cost = row.querySelector('.cost-value');
                        return cost ? cost.textContent.trim() : null;
                    }
                }
                return null;
            });

            // After changing to R#0: 2 APs at FC (6+3=9) = 9 HP
            expect(bodyCost).toBe('9 HP');
        } finally {
            await closeAllWindows(page);
            if (actorId) await deleteActor(page, actorId);
        }
    });

    test('Hardened Defenses at R#0 clamps FC to 10', async ({ page }) => {
        let actorId;
        try {
            actorId = await createHeroActor(page, prefixName('GBCost_HD'));
            const gadgetId = await addGadgetToActor(page, actorId, {
                name: 'Armored Device',
                attrs: { body: 2 },
                reliability: 0, // R#0, +3 to FC
            });

            // Enable Hardened Defenses (+2 to Body FC)
            await page.evaluate(async ({ actorId, gadgetId }) => {
                const actor = game.actors.get(actorId);
                const gadget = actor.items.get(gadgetId);
                await gadget.update({ 'system.hasHardenedDefenses': true });
                await gadget.setFlag('core', 'sheetClass', 'megs.MEGSGadgetBuilderSheet');
                gadget.sheet.render(true);
            }, { actorId, gadgetId });
            await page.waitForSelector('.sheet.item.gadget-builder', { timeout: 5000 });

            const bodyCost = await page.evaluate(() => {
                const rows = document.querySelectorAll('.sheet.item.gadget-builder .attribute');
                for (const row of rows) {
                    const label = row.querySelector('.resource-label');
                    if (label && label.textContent.trim() === 'BODY') {
                        const cost = row.querySelector('.cost-value');
                        return cost ? cost.textContent.trim() : null;
                    }
                }
                return null;
            });

            // Body FC: 6 + 3 (R#0) + 2 (Hardened) = 11, clamped to 10
            // 2 APs at FC 10 = 10 HP
            expect(bodyCost).toBe('10 HP');
        } finally {
            await closeAllWindows(page);
            if (actorId) await deleteActor(page, actorId);
        }
    });

    test('Budget attributesCost matches sum of individual costs', async ({ page }) => {
        let actorId;
        try {
            actorId = await createHeroActor(page, prefixName('GBCost_Budget'));
            const gadgetId = await addGadgetToActor(page, actorId, {
                name: 'Multi-Attr Device',
                attrs: { body: 2, dex: 3 },
                reliability: 3, // R#5, no modifier
            });

            await page.evaluate(async ({ actorId, gadgetId }) => {
                const actor = game.actors.get(actorId);
                const gadget = actor.items.get(gadgetId);
                await gadget.setFlag('core', 'sheetClass', 'megs.MEGSGadgetBuilderSheet');
                gadget.sheet.render(true);
            }, { actorId, gadgetId });
            await page.waitForSelector('.sheet.item.gadget-builder', { timeout: 5000 });

            const result = await page.evaluate(() => {
                const rows = document.querySelectorAll('.sheet.item.gadget-builder .attribute');
                const costs = {};
                for (const row of rows) {
                    const label = row.querySelector('.resource-label');
                    const cost = row.querySelector('.cost-value');
                    if (label && cost) {
                        const name = label.textContent.trim();
                        const hp = parseInt(cost.textContent);
                        if (!isNaN(hp) && hp > 0) costs[name] = hp;
                    }
                }

                // Get budget summary attributesCost
                const summaryRows = document.querySelectorAll('.sheet.item.gadget-builder .attributes-summary .summary-row');
                let budgetCost = null;
                for (const row of summaryRows) {
                    const label = row.querySelector('.summary-label');
                    if (label && label.textContent.includes('Attributes')) {
                        const value = row.querySelector('.summary-value');
                        budgetCost = value ? value.textContent.trim() : null;
                        break;
                    }
                }

                return { costs, budgetCost };
            });

            // Body: 2 APs @ FC 6 = 6 HP
            // DEX: 3 APs @ FC 7 = 14 HP
            expect(result.costs['BODY']).toBe(6);
            expect(result.costs['DEX']).toBe(14);

            // Budget total should show (6+14)/4 = ceil(20/4) = 5 HP (with gadget bonus ÷4)
            expect(result.budgetCost).toBe('5 HP');
        } finally {
            await closeAllWindows(page);
            if (actorId) await deleteActor(page, actorId);
        }
    });

    test('Incrementing attribute via plus button updates cost', async ({ page }) => {
        let actorId;
        try {
            actorId = await createHeroActor(page, prefixName('GBCost_Plus'));
            const gadgetId = await addGadgetToActor(page, actorId, {
                name: 'Plus Button Device',
                attrs: { body: 0 },
                reliability: 3, // R#5, no modifier
            });

            await page.evaluate(async ({ actorId, gadgetId }) => {
                const actor = game.actors.get(actorId);
                const gadget = actor.items.get(gadgetId);
                await gadget.setFlag('core', 'sheetClass', 'megs.MEGSGadgetBuilderSheet');
                gadget.sheet.render(true);
            }, { actorId, gadgetId });
            await page.waitForSelector('.sheet.item.gadget-builder', { timeout: 5000 });

            // Click plus button for Body twice
            for (let i = 0; i < 2; i++) {
                await page.click('.sheet.item.gadget-builder .attribute-plus[data-attribute="body"]');
                await page.waitForTimeout(300);
            }

            const bodyCost = await page.evaluate(() => {
                const rows = document.querySelectorAll('.sheet.item.gadget-builder .attribute');
                for (const row of rows) {
                    const label = row.querySelector('.resource-label');
                    if (label && label.textContent.trim() === 'BODY') {
                        const cost = row.querySelector('.cost-value');
                        return cost ? cost.textContent.trim() : null;
                    }
                }
                return null;
            });

            // Body 2 APs at FC 6 (R#5) = 6 HP
            expect(bodyCost).toBe('6 HP');
        } finally {
            await closeAllWindows(page);
            if (actorId) await deleteActor(page, actorId);
        }
    });
});
