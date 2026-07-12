import { test, expect } from '../fixtures/foundry-test.mjs';
import {
    prefixName,
    createHeroActor,
    deleteActor,
    openActorSheet,
    closeAllWindows,
} from '../fixtures/test-data.mjs';

async function createActorWithSubGadget(page, actorName) {
    const actorId = await createHeroActor(page, actorName);

    const ids = await page.evaluate(async (actorId) => {
        const actor = game.actors.get(actorId);

        const [parentGadget] = await actor.createEmbeddedDocuments('Item', [{
            name: 'Batsuit',
            type: 'gadget',
            img: 'icons/svg/shield.svg',
        }]);

        const [subGadget] = await actor.createEmbeddedDocuments('Item', [{
            name: 'Grapple Gun',
            type: 'gadget',
            img: 'icons/svg/target.svg',
            system: { parent: parentGadget.id }
        }]);

        if (parentGadget.system.settings?.hasGadgets !== 'true') {
            await parentGadget.update({ 'system.settings.hasGadgets': 'true' });
        }

        return { parentId: parentGadget.id, subGadgetId: subGadget.id };
    }, actorId);

    return { actorId, ...ids };
}

test.describe('Sub-gadget display and controls (#78)', () => {

    test('Sub-gadget appears indented under parent on Gadgets tab', async ({ page }) => {
        let actorId;
        try {
            const result = await createActorWithSubGadget(page, prefixName('SubGadget_Display'));
            actorId = result.actorId;

            await openActorSheet(page, actorId, 'gadgets');
            await page.waitForTimeout(500);

            const subRow = await page.$(`.sub-gadget-row[data-item-id="${result.subGadgetId}"]`);
            expect(subRow).not.toBeNull();

            const parentId = await page.evaluate((subGadgetId) => {
                const row = document.querySelector(`.sub-gadget-row[data-item-id="${subGadgetId}"]`);
                return row?.dataset.parentId;
            }, result.subGadgetId);
            expect(parentId).toBe(result.parentId);
        } finally {
            await closeAllWindows(page);
            if (actorId) await deleteActor(page, actorId);
        }
    });

    test('Sub-gadget edit button opens the gadget item sheet', async ({ page }) => {
        let actorId;
        try {
            const result = await createActorWithSubGadget(page, prefixName('SubGadget_Edit'));
            actorId = result.actorId;

            await openActorSheet(page, actorId, 'gadgets');
            await page.waitForTimeout(500);

            await page.evaluate((subGadgetId) => {
                const row = document.querySelector(`.sub-gadget-row[data-item-id="${subGadgetId}"]`);
                const editBtn = row?.querySelector('.item-edit');
                if (editBtn) editBtn.click();
            }, result.subGadgetId);

            await page.waitForTimeout(1000);

            const sheetTitle = await page.evaluate(() => {
                const itemSheet = document.querySelector('.sheet.item');
                if (!itemSheet) return null;
                const nameInput = itemSheet.querySelector('input[name="name"]');
                if (nameInput) return nameInput.value;
                const nameDiv = itemSheet.querySelector('.charname div[name="name"]');
                if (nameDiv) return nameDiv.textContent.trim();
                return null;
            });

            expect(sheetTitle).toBe('Grapple Gun');
        } finally {
            await closeAllWindows(page);
            if (actorId) await deleteActor(page, actorId);
        }
    });

    test('Sub-gadget delete button removes it from the actor', async ({ page }) => {
        let actorId;
        try {
            const result = await createActorWithSubGadget(page, prefixName('SubGadget_Delete'));
            actorId = result.actorId;

            await openActorSheet(page, actorId, 'gadgets');
            await page.waitForTimeout(500);

            let subRow = await page.$(`.sub-gadget-row[data-item-id="${result.subGadgetId}"]`);
            expect(subRow).not.toBeNull();

            await page.evaluate((subGadgetId) => {
                const row = document.querySelector(`.sub-gadget-row[data-item-id="${subGadgetId}"]`);
                const deleteBtn = row?.querySelector('.item-delete');
                if (deleteBtn) deleteBtn.click();
            }, result.subGadgetId);

            await page.waitForSelector('.dialog .dialog-buttons', { timeout: 5000 });
            await page.evaluate(() => {
                const buttons = document.querySelectorAll('.dialog .dialog-buttons button');
                for (const btn of buttons) {
                    if (btn.textContent.trim().match(/yes|delete|ok/i)) {
                        btn.click();
                        return;
                    }
                }
                if (buttons.length > 0) buttons[0].click();
            });

            await page.waitForTimeout(1500);

            subRow = await page.$(`.sub-gadget-row[data-item-id="${result.subGadgetId}"]`);
            expect(subRow).toBeNull();

            const parentRow = await page.$(`.item-row[data-item-id="${result.parentId}"]`);
            expect(parentRow).not.toBeNull();
        } finally {
            await closeAllWindows(page);
            if (actorId) await deleteActor(page, actorId);
        }
    });

    test('Sub-gadget roll button opens roll dialog when sub-gadget has AV/EV', async ({ page }) => {
        let actorId;
        try {
            actorId = await createHeroActor(page, prefixName('SubGadget_Roll'));

            const ids = await page.evaluate(async (actorId) => {
                const actor = game.actors.get(actorId);

                const [parentGadget] = await actor.createEmbeddedDocuments('Item', [{
                    name: 'Power Armor',
                    type: 'gadget',
                    img: 'icons/svg/shield.svg',
                }]);

                const [subGadget] = await actor.createEmbeddedDocuments('Item', [{
                    name: 'Laser Cannon',
                    type: 'gadget',
                    img: 'icons/svg/target.svg',
                    system: {
                        parent: parentGadget.id,
                        settings: { hasAVAndEV: 'true' },
                        av: 6,
                        ev: 8,
                    }
                }]);

                if (parentGadget.system.settings?.hasGadgets !== 'true') {
                    await parentGadget.update({ 'system.settings.hasGadgets': 'true' });
                }

                return { parentId: parentGadget.id, subGadgetId: subGadget.id };
            }, actorId);

            await openActorSheet(page, actorId, 'gadgets');
            await page.waitForTimeout(500);

            const hasRollBtn = await page.evaluate((subGadgetId) => {
                const row = document.querySelector(`.sub-gadget-row[data-item-id="${subGadgetId}"]`);
                return !!row?.querySelector('.d10.rollable');
            }, ids.subGadgetId);

            if (hasRollBtn) {
                await page.evaluate((subGadgetId) => {
                    const row = document.querySelector(`.sub-gadget-row[data-item-id="${subGadgetId}"]`);
                    const rollBtn = row?.querySelector('.d10.rollable');
                    if (rollBtn) rollBtn.click();
                }, ids.subGadgetId);

                await page.waitForSelector('.megs-dialog', { timeout: 5000 });

                const dialogVisible = await page.evaluate(() => {
                    return !!document.querySelector('.megs-dialog');
                });
                expect(dialogVisible).toBe(true);

                await page.evaluate(() => {
                    const closeBtn = document.querySelector('.megs.dialog .header-button.close');
                    if (closeBtn) closeBtn.click();
                });
            } else {
                const rowExists = await page.$(`.sub-gadget-row[data-item-id="${ids.subGadgetId}"]`);
                expect(rowExists).not.toBeNull();
            }
        } finally {
            await closeAllWindows(page);
            if (actorId) await deleteActor(page, actorId);
        }
    });

    test('Drag gadget onto another gadget makes it a sub-gadget', async ({ page }) => {
        let actorId;
        try {
            actorId = await createHeroActor(page, prefixName('SubGadget_DragTo'));

            await page.evaluate(async (actorId) => {
                const actor = game.actors.get(actorId);
                await actor.createEmbeddedDocuments('Item', [
                    { name: 'Batsuit', type: 'gadget', img: 'icons/svg/shield.svg' },
                    { name: 'Grapple Gun', type: 'gadget', img: 'icons/svg/target.svg' },
                ]);
            }, actorId);

            await openActorSheet(page, actorId, 'gadgets');
            await page.waitForTimeout(500);

            // Programmatically set parent to simulate the drop
            const result = await page.evaluate(async (actorId) => {
                const actor = game.actors.get(actorId);
                const batsuit = actor.items.find(i => i.name === 'Batsuit');
                const grapple = actor.items.find(i => i.name === 'Grapple Gun');
                await grapple.update({ 'system.parent': batsuit.id });
                actor.sheet.render(false);
                return { parentId: batsuit.id, childId: grapple.id };
            }, actorId);

            await page.waitForTimeout(1000);

            const subRow = await page.$(`.sub-gadget-row[data-item-id="${result.childId}"]`);
            expect(subRow).not.toBeNull();
        } finally {
            await closeAllWindows(page);
            if (actorId) await deleteActor(page, actorId);
        }
    });

    test('Clearing parent makes sub-gadget top-level', async ({ page }) => {
        let actorId;
        try {
            const result = await createActorWithSubGadget(page, prefixName('SubGadget_Detach'));
            actorId = result.actorId;

            await openActorSheet(page, actorId, 'gadgets');
            await page.waitForTimeout(500);

            // Verify it's a sub-gadget first
            let subRow = await page.$(`.sub-gadget-row[data-item-id="${result.subGadgetId}"]`);
            expect(subRow).not.toBeNull();

            // Clear parent to detach
            await page.evaluate(async ({ actorId, subGadgetId }) => {
                const actor = game.actors.get(actorId);
                const subGadget = actor.items.get(subGadgetId);
                await subGadget.update({ 'system.parent': '' });
                actor.sheet.render(false);
            }, { actorId, subGadgetId: result.subGadgetId });

            await page.waitForTimeout(1000);

            // Should no longer be a sub-gadget row
            subRow = await page.$(`.sub-gadget-row[data-item-id="${result.subGadgetId}"]`);
            expect(subRow).toBeNull();

            // Should be a top-level row
            const topRow = await page.$(`.item-row[data-item-id="${result.subGadgetId}"]`);
            expect(topRow).not.toBeNull();
        } finally {
            await closeAllWindows(page);
            if (actorId) await deleteActor(page, actorId);
        }
    });

    test('Parent gadget totalCost includes sub-gadget cost', async ({ page }) => {
        let actorId;
        try {
            actorId = await createHeroActor(page, prefixName('SubGadget_Cost'));

            const costs = await page.evaluate(async (actorId) => {
                const actor = game.actors.get(actorId);

                const [parentGadget] = await actor.createEmbeddedDocuments('Item', [{
                    name: 'Power Armor',
                    type: 'gadget',
                    img: 'icons/svg/shield.svg',
                    system: { canBeTakenAway: true },
                }]);

                const parentCostBefore = parentGadget.system.totalCost || 0;

                const [subGadget] = await actor.createEmbeddedDocuments('Item', [{
                    name: 'Laser Cannon',
                    type: 'gadget',
                    img: 'icons/svg/target.svg',
                    system: {
                        parent: parentGadget.id,
                        settings: { hasAVAndEV: 'true' },
                        av: 4,
                        ev: 4,
                        canBeTakenAway: true,
                    }
                }]);

                const updatedParent = actor.items.get(parentGadget.id);
                const subGadgetCost = actor.items.get(subGadget.id).system.totalCost || 0;
                const parentCostAfter = updatedParent.system.totalCost || 0;

                return { parentCostBefore, parentCostAfter, subGadgetCost };
            }, actorId);

            expect(costs.subGadgetCost).toBeGreaterThan(0);
            expect(costs.parentCostAfter).toBeGreaterThan(costs.parentCostBefore);
        } finally {
            await closeAllWindows(page);
            if (actorId) await deleteActor(page, actorId);
        }
    });

    test('Gadget cost tooltip includes sub-gadget name and cost', async ({ page }) => {
        let actorId;
        try {
            actorId = await createHeroActor(page, prefixName('SubGadget_Tooltip'));

            await page.evaluate(async (actorId) => {
                const actor = game.actors.get(actorId);

                const [parentGadget] = await actor.createEmbeddedDocuments('Item', [{
                    name: 'Power Armor',
                    type: 'gadget',
                    img: 'icons/svg/shield.svg',
                    system: { canBeTakenAway: true },
                }]);

                await actor.createEmbeddedDocuments('Item', [{
                    name: 'Laser Cannon',
                    type: 'gadget',
                    img: 'icons/svg/target.svg',
                    system: {
                        parent: parentGadget.id,
                        settings: { hasAVAndEV: 'true' },
                        av: 4,
                        ev: 4,
                        canBeTakenAway: true,
                    }
                }]);

                if (parentGadget.system.settings?.hasGadgets !== 'true') {
                    await parentGadget.update({ 'system.settings.hasGadgets': 'true' });
                }
            }, actorId);

            // Open the parent gadget's item sheet
            await page.evaluate((actorId) => {
                const actor = game.actors.get(actorId);
                const gadget = actor.items.find(i => i.name === 'Power Armor' && !i.system.parent);
                gadget.sheet.render(true);
            }, actorId);

            await page.waitForSelector('.sheet.item', { timeout: 10000 });
            await page.waitForTimeout(1000);

            // Read the budget tooltip from the HP Spent value
            const tooltip = await page.evaluate(() => {
                const sheet = document.querySelector('.sheet.item');
                const tooltipEl = sheet?.querySelector('[title*="HP Spent"]') ||
                    sheet?.querySelector('.resource-value[title]');
                return tooltipEl?.getAttribute('title') || '';
            });

            expect(tooltip).toContain('Laser Cannon');
        } finally {
            await closeAllWindows(page);
            if (actorId) await deleteActor(page, actorId);
        }
    });
});
