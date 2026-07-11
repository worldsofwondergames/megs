import { test, expect } from '../fixtures/foundry-test.mjs';
import {
    prefixName,
    createHeroActor,
    addPowerToActor,
    addTraitToActor,
    deleteActor,
    openActorSheet,
    closeAllWindows,
} from '../fixtures/test-data.mjs';

/**
 * Category 5 of #226: Drag & Drop.
 * Drops are exercised through the same code paths the UI uses:
 * ActorSheet._onDropItemCreate for sheet drops, and real DragEvents with a
 * DataTransfer payload for the power-row bonus/limitation drop zones.
 */
test.describe('Drag & Drop (#226 cat 5)', () => {
    /** Fetch the first document of a compendium pack and drop it on the actor sheet. */
    async function dropFromCompendium(page, actorId, packName) {
        return page.evaluate(async ({ actorId, packName }) => {
            const pack = game.packs.get(packName);
            if (!pack) return { error: `pack ${packName} not found` };
            const index = await pack.getIndex();
            const first = index.contents[0];
            const doc = await pack.getDocument(first._id);
            const actor = game.actors.get(actorId);
            const created = await actor.sheet._onDropItemCreate(doc.toObject());
            return {
                name: doc.name,
                type: doc.type,
                createdCount: Array.isArray(created) ? created.length : (created ? 1 : 0),
            };
        }, { actorId, packName });
    }

    test('Dragging a power from the compendium onto an actor adds it', async ({ page }) => {
        let actorId;
        try {
            actorId = await createHeroActor(page, prefixName('Drop_Power'));
            const result = await dropFromCompendium(page, actorId, 'megs.powers');
            expect(result.error).toBeUndefined();
            expect(result.type).toBe('power');

            const onActor = await page.evaluate(({ actorId, name }) => {
                const actor = game.actors.get(actorId);
                return actor.items.some(i => i.type === 'power' && i.name === name);
            }, { actorId, name: result.name });
            expect(onActor).toBe(true);

            // Visible on the Powers tab
            await openActorSheet(page, actorId, 'powers');
            const visible = await page.evaluate((name) => {
                const tab = document.querySelector('.sheet.actor .tab.powers');
                return tab ? tab.textContent.includes(name) : false;
            }, result.name);
            expect(visible).toBe(true);
        } finally {
            await closeAllWindows(page);
            if (actorId) await deleteActor(page, actorId);
        }
    });

    test('Dragging a skill from the compendium onto an actor adds it', async ({ page }) => {
        let actorId;
        try {
            actorId = await createHeroActor(page, prefixName('Drop_Skill'));
            const result = await dropFromCompendium(page, actorId, 'world.megs-skills');
            expect(result.error).toBeUndefined();

            const onActor = await page.evaluate(({ actorId, name }) => {
                const actor = game.actors.get(actorId);
                return actor.items.some(i => i.name === name);
            }, { actorId, name: result.name });
            expect(onActor).toBe(true);
        } finally {
            await closeAllWindows(page);
            if (actorId) await deleteActor(page, actorId);
        }
    });

    test('Dragging an advantage from the compendium onto an actor adds it', async ({ page }) => {
        let actorId;
        try {
            actorId = await createHeroActor(page, prefixName('Drop_Adv'));
            const result = await dropFromCompendium(page, actorId, 'megs.advantages');
            expect(result.error).toBeUndefined();
            expect(result.type).toBe('advantage');

            const onActor = await page.evaluate(({ actorId, name }) => {
                const actor = game.actors.get(actorId);
                return actor.items.some(i => i.type === 'advantage' && i.name === name);
            }, { actorId, name: result.name });
            expect(onActor).toBe(true);
        } finally {
            await closeAllWindows(page);
            if (actorId) await deleteActor(page, actorId);
        }
    });

    test('Dropping a bonus onto a power row attaches it to that power', async ({ page }) => {
        let actorId;
        let worldItemId;
        try {
            actorId = await createHeroActor(page, prefixName('Drop_Bonus'));
            const powerId = await addPowerToActor(page, actorId, {
                name: 'Lightning', aps: 5, factorCost: 3,
            });

            // World-level bonus item to drag in
            worldItemId = await page.evaluate(async (name) => {
                const item = await Item.create({
                    name, type: 'bonus', system: { factorCostMod: 1 },
                });
                return item.id;
            }, prefixName('AreaEffectBonus'));

            await openActorSheet(page, actorId, 'powers');

            // Dispatch a real drop event on the power row
            const dropped = await page.evaluate(async ({ powerId, worldItemId }) => {
                const row = document.querySelector(`.sheet.actor .tab.powers .power-row[data-item-id="${powerId}"]`);
                if (!row) return { error: 'power row not found' };
                const item = game.items.get(worldItemId);
                const dt = new DataTransfer();
                dt.setData('text/plain', JSON.stringify({ type: 'Item', uuid: item.uuid }));
                row.dispatchEvent(new DragEvent('drop', { dataTransfer: dt, bubbles: true, cancelable: true }));
                return {};
            }, { powerId, worldItemId });
            expect(dropped.error).toBeUndefined();

            await page.waitForFunction(
                ({ actorId, powerId }) => {
                    const actor = game.actors.get(actorId);
                    return actor.items.some(i => i.type === 'bonus' && i.system.parent === powerId);
                },
                { actorId, powerId },
                { timeout: 10000 }
            );
        } finally {
            await closeAllWindows(page);
            if (actorId) await deleteActor(page, actorId);
            if (worldItemId) {
                await page.evaluate(async (id) => {
                    const item = game.items.get(id);
                    if (item) await item.delete();
                }, worldItemId);
            }
        }
    });

    test('Dropping a gadget onto an actor adds it to the Gadgets tab', async ({ page }) => {
        let actorId;
        let worldItemId;
        try {
            actorId = await createHeroActor(page, prefixName('Drop_Gadget'));

            worldItemId = await page.evaluate(async (name) => {
                const item = await Item.create({
                    name,
                    type: 'gadget',
                    system: { actionValue: 3, effectValue: 3 },
                });
                return item.id;
            }, prefixName('GrappleGun'));

            const result = await page.evaluate(async ({ actorId, worldItemId }) => {
                const actor = game.actors.get(actorId);
                const item = game.items.get(worldItemId);
                const created = await actor.sheet._onDropItemCreate(item.toObject());
                return { createdCount: Array.isArray(created) ? created.length : 0 };
            }, { actorId, worldItemId });
            expect(result.createdCount).toBeGreaterThan(0);

            await openActorSheet(page, actorId, 'gadgets');
            const visible = await page.evaluate((name) => {
                const tab = document.querySelector('.sheet.actor .tab.gadgets');
                return tab ? tab.textContent.includes(name) : false;
            }, prefixName('GrappleGun'));
            expect(visible).toBe(true);
        } finally {
            await closeAllWindows(page);
            if (actorId) await deleteActor(page, actorId);
            if (worldItemId) {
                await page.evaluate(async (id) => {
                    const item = game.items.get(id);
                    if (item) await item.delete();
                }, worldItemId);
            }
        }
    });

    test('Removing an item from an actor works (delete control + confirm)', async ({ page }) => {
        let actorId;
        try {
            actorId = await createHeroActor(page, prefixName('Drop_Delete'));
            const traitId = await addTraitToActor(page, actorId, {
                name: 'Expendable Trait', type: 'advantage', baseCost: 5,
            });

            // Delete controls only render in edit mode
            await page.evaluate(async (id) => {
                await game.actors.get(id).setFlag('megs', 'edit-mode', true);
            }, actorId);
            await openActorSheet(page, actorId, 'traits');

            await page.evaluate((itemId) => {
                const row = document.querySelector(`.sheet.actor .tab.traits .item[data-item-id="${itemId}"]`);
                if (!row) throw new Error('trait row not found');
                row.querySelector('.item-delete').click();
            }, traitId);

            // Confirm the deletion dialog
            await page.waitForFunction(
                () => [...document.querySelectorAll('.dialog')].some(d => d.textContent.includes('Are You Sure?')),
                null,
                { timeout: 5000 }
            );
            await page.evaluate(() => {
                const dialog = [...document.querySelectorAll('.dialog')].find(d => d.textContent.includes('Are You Sure?'));
                for (const btn of dialog.querySelectorAll('button')) {
                    if (btn.textContent.trim().includes('Yes')) { btn.click(); return; }
                }
            });

            await page.waitForFunction(
                ({ actorId, traitId }) => !game.actors.get(actorId).items.get(traitId),
                { actorId, traitId },
                { timeout: 10000 }
            );
            const stillExists = await page.evaluate(
                ({ actorId, traitId }) => !!game.actors.get(actorId).items.get(traitId),
                { actorId, traitId }
            );
            expect(stillExists).toBe(false);
        } finally {
            await closeAllWindows(page);
            if (actorId) await deleteActor(page, actorId);
        }
    });
});
