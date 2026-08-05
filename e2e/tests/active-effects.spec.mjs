import { test, expect } from '../fixtures/foundry-test.mjs';
import {
    prefixName,
    createHeroActor,
    deleteActor,
    closeAllWindows,
} from '../fixtures/test-data.mjs';

/**
 * Category 10 of #226: Active Effects.
 *
 * NOTE: The MEGS actor sheet does not currently render an Active Effects
 * panel (module/sheets/actor-sheet.mjs has the effect preparation commented
 * out as a TODO), so the sheet-level checklist items (edit button, delete
 * confirmation dialog, category display) cannot be exercised through the UI
 * yet. These tests cover the document-level behavior the eventual UI will
 * sit on: creating, toggling, categorizing, and deleting effects on actors.
 */
test.describe('Active Effects (#226 cat 10)', () => {
    test('Creating an Active Effect on an actor works', async ({ page }) => {
        let actorId;
        try {
            actorId = await createHeroActor(page, prefixName('AE_Create'));
            const effect = await page.evaluate(async (id) => {
                const actor = game.actors.get(id);
                const [created] = await actor.createEmbeddedDocuments('ActiveEffect', [{
                    name: 'Blessing',
                    img: 'icons/svg/aura.svg',
                    changes: [{ key: 'system.attributes.str.value', mode: 2, value: '2' }],
                }]);
                return { id: created.id, name: created.name, count: actor.effects.size };
            }, actorId);
            expect(effect.name).toBe('Blessing');
            expect(effect.count).toBe(1);
        } finally {
            await closeAllWindows(page);
            if (actorId) await deleteActor(page, actorId);
        }
    });

    test('Toggling an Active Effect enables and disables it', async ({ page }) => {
        let actorId;
        try {
            actorId = await createHeroActor(page, prefixName('AE_Toggle'));
            const states = await page.evaluate(async (id) => {
                const actor = game.actors.get(id);
                const [effect] = await actor.createEmbeddedDocuments('ActiveEffect', [{
                    name: 'Slow', img: 'icons/svg/anchor.svg',
                }]);
                const initial = effect.disabled;
                await effect.update({ disabled: true });
                const afterDisable = actor.effects.get(effect.id).disabled;
                await effect.update({ disabled: false });
                const afterEnable = actor.effects.get(effect.id).disabled;
                return { initial, afterDisable, afterEnable };
            }, actorId);
            expect(states.initial).toBe(false);
            expect(states.afterDisable).toBe(true);
            expect(states.afterEnable).toBe(false);
        } finally {
            await closeAllWindows(page);
            if (actorId) await deleteActor(page, actorId);
        }
    });

    test('Effects categorize as temporary, passive, and inactive', async ({ page }) => {
        let actorId;
        try {
            actorId = await createHeroActor(page, prefixName('AE_Categories'));
            const categories = await page.evaluate(async (id) => {
                const actor = game.actors.get(id);
                const effects = await actor.createEmbeddedDocuments('ActiveEffect', [
                    { name: 'Stunned', img: 'icons/svg/daze.svg', duration: { rounds: 2 } },
                    { name: 'Tough', img: 'icons/svg/shield.svg' },
                    { name: 'Dormant', img: 'icons/svg/sleep.svg', disabled: true },
                ]);
                const temporary = effects.find(e => e.name === 'Stunned');
                const passive = effects.find(e => e.name === 'Tough');
                const inactive = effects.find(e => e.name === 'Dormant');
                return {
                    temporaryIsTemporary: temporary.isTemporary,
                    passiveIsTemporary: passive.isTemporary,
                    inactiveDisabled: inactive.disabled,
                };
            }, actorId);
            expect(categories.temporaryIsTemporary).toBe(true);
            expect(categories.passiveIsTemporary).toBe(false);
            expect(categories.inactiveDisabled).toBe(true);
        } finally {
            await closeAllWindows(page);
            if (actorId) await deleteActor(page, actorId);
        }
    });

    test('Deleting an Active Effect removes it from the actor', async ({ page }) => {
        let actorId;
        try {
            actorId = await createHeroActor(page, prefixName('AE_Delete'));
            const result = await page.evaluate(async (id) => {
                const actor = game.actors.get(id);
                const [effect] = await actor.createEmbeddedDocuments('ActiveEffect', [{
                    name: 'Doomed', img: 'icons/svg/skull.svg',
                }]);
                const beforeDelete = actor.effects.size;
                await effect.delete();
                return { beforeDelete, afterDelete: actor.effects.size };
            }, actorId);
            expect(result.beforeDelete).toBe(1);
            expect(result.afterDelete).toBe(0);
        } finally {
            await closeAllWindows(page);
            if (actorId) await deleteActor(page, actorId);
        }
    });
});
