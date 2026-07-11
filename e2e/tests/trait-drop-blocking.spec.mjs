import { test, expect } from '../fixtures/foundry-test.mjs';
import {
    prefixName,
    createHeroActor,
    addTraitToActor,
    deleteActor,
    openActorSheet,
    openItemSheet,
    closeAllWindows,
} from '../fixtures/test-data.mjs';

test.describe('Trait Drop Blocking (#178 + #3)', () => {
    test('gadgetOnly trait is blocked from being added to a hero actor sheet', async ({ page }) => {
        let actorId;
        try {
            actorId = await createHeroActor(page, prefixName('DropBlock_GadgetOnly'));

            // Count items before the drop attempt
            const beforeCount = await page.evaluate((id) => {
                return game.actors.get(id).items.size;
            }, actorId);

            // Simulate _onDropItemCreate with a gadgetOnly advantage
            const result = await page.evaluate(async (id) => {
                const actor = game.actors.get(id);
                const sheet = actor.sheet;
                const itemData = {
                    name: 'Gadget Advantage',
                    type: 'advantage',
                    system: {
                        baseCost: 5,
                        gadgetOnly: true,
                        creationOnly: false,
                        text: '',
                    },
                };
                const created = await sheet._onDropItemCreate([itemData]);
                return created;
            }, actorId);

            // The blocked drop should return false (no items created)
            const afterCount = await page.evaluate((id) => {
                return game.actors.get(id).items.size;
            }, actorId);

            expect(afterCount).toBe(beforeCount);
        } finally {
            await closeAllWindows(page);
            if (actorId) await deleteActor(page, actorId);
        }
    });

    test('creationOnly trait is blocked from being added to a regular actor sheet', async ({ page }) => {
        let actorId;
        try {
            actorId = await createHeroActor(page, prefixName('DropBlock_Creation'));

            const beforeCount = await page.evaluate((id) => {
                return game.actors.get(id).items.size;
            }, actorId);

            // Simulate _onDropItemCreate with a creationOnly advantage
            await page.evaluate(async (id) => {
                const actor = game.actors.get(id);
                const sheet = actor.sheet;
                const itemData = {
                    name: 'Creation Advantage',
                    type: 'advantage',
                    system: {
                        baseCost: 5,
                        gadgetOnly: false,
                        creationOnly: true,
                        text: '',
                    },
                };
                await sheet._onDropItemCreate([itemData]);
            }, actorId);

            const afterCount = await page.evaluate((id) => {
                return game.actors.get(id).items.size;
            }, actorId);

            expect(afterCount).toBe(beforeCount);
        } finally {
            await closeAllWindows(page);
            if (actorId) await deleteActor(page, actorId);
        }
    });

    test('Normal trait (no flags) is accepted via drop on actor sheet', async ({ page }) => {
        let actorId;
        try {
            actorId = await createHeroActor(page, prefixName('DropBlock_Normal'));

            const beforeCount = await page.evaluate((id) => {
                return game.actors.get(id).items.size;
            }, actorId);

            // Simulate _onDropItemCreate with a normal advantage
            await page.evaluate(async (id) => {
                const actor = game.actors.get(id);
                const sheet = actor.sheet;
                const itemData = {
                    name: 'Normal Advantage',
                    type: 'advantage',
                    system: {
                        baseCost: 5,
                        gadgetOnly: false,
                        creationOnly: false,
                        text: '',
                    },
                };
                await sheet._onDropItemCreate([itemData]);
            }, actorId);

            const afterCount = await page.evaluate((id) => {
                return game.actors.get(id).items.size;
            }, actorId);

            expect(afterCount).toBe(beforeCount + 1);
        } finally {
            await closeAllWindows(page);
            if (actorId) await deleteActor(page, actorId);
        }
    });

    test('gadgetOnly checkbox is disabled for trait on hero (not in gadget)', async ({ page }) => {
        let actorId;
        try {
            actorId = await createHeroActor(page, prefixName('DropBlock_Locked'));
            const itemId = await addTraitToActor(page, actorId, {
                name: 'Test Advantage',
                type: 'advantage',
                baseCost: 5,
                gadgetOnly: false,
            });

            // Ensure edit mode is on for the item
            await page.evaluate(({ actorId, itemId }) => {
                const actor = game.actors.get(actorId);
                const item = actor.items.get(itemId);
                item.setFlag('megs', 'edit-mode', true);
            }, { actorId, itemId });

            await openItemSheet(page, actorId, itemId);

            // Navigate to options tab
            await page.click('.sheet.item .tabs .item[data-tab="options"]');
            await page.waitForSelector('.sheet.item .tab[data-tab="options"]', { timeout: 5000 });

            // The gadgetOnly checkbox should be disabled because the trait
            // is on a hero actor (not inside a gadget), which triggers gadgetOnlyLocked
            const isDisabled = await page.evaluate(() => {
                const checkbox = document.querySelector('.sheet.item input[name="system.gadgetOnly"]');
                return checkbox ? checkbox.disabled : null;
            });

            expect(isDisabled).toBe(true);
        } finally {
            await closeAllWindows(page);
            if (actorId) await deleteActor(page, actorId);
        }
    });

    test('gadgetOnly drawback is also blocked from being added to a hero actor', async ({ page }) => {
        let actorId;
        try {
            actorId = await createHeroActor(page, prefixName('DropBlock_DrawGO'));

            const beforeCount = await page.evaluate((id) => {
                return game.actors.get(id).items.size;
            }, actorId);

            // Simulate _onDropItemCreate with a gadgetOnly drawback
            await page.evaluate(async (id) => {
                const actor = game.actors.get(id);
                const sheet = actor.sheet;
                const itemData = {
                    name: 'Gadget Drawback',
                    type: 'drawback',
                    system: {
                        baseCost: 5,
                        gadgetOnly: true,
                        creationOnly: false,
                        text: '',
                    },
                };
                await sheet._onDropItemCreate([itemData]);
            }, actorId);

            const afterCount = await page.evaluate((id) => {
                return game.actors.get(id).items.size;
            }, actorId);

            expect(afterCount).toBe(beforeCount);
        } finally {
            await closeAllWindows(page);
            if (actorId) await deleteActor(page, actorId);
        }
    });
});
