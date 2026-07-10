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

test.describe('Trait Subtext Display (#209)', () => {
    test('Advantage with subtext shows "Name (Detail)" on actor traits tab', async ({ page }) => {
        let actorId;
        try {
            actorId = await createHeroActor(page, prefixName('TraitSubtext_Adv'));
            await addTraitToActor(page, actorId, {
                name: 'Connections',
                type: 'advantage',
                baseCost: 5,
                text: 'Gotham PD',
            });

            await openActorSheet(page, actorId, 'traits');

            const traitText = await page.evaluate(() => {
                const rows = document.querySelectorAll('.sheet.actor .tab.traits .item-row');
                for (const row of rows) {
                    const nameEl = row.querySelector('.item-name a.item-edit.bold');
                    if (nameEl && nameEl.textContent.includes('Connections')) {
                        return nameEl.textContent.trim();
                    }
                }
                return null;
            });

            expect(traitText).toBe('Connections (Gotham PD)');
        } finally {
            await closeAllWindows(page);
            if (actorId) await deleteActor(page, actorId);
        }
    });

    test('Advantage without subtext shows name only (no parentheses)', async ({ page }) => {
        let actorId;
        try {
            actorId = await createHeroActor(page, prefixName('TraitSubtext_NoText'));
            await addTraitToActor(page, actorId, {
                name: 'Sharp Eye',
                type: 'advantage',
                baseCost: 5,
                text: '',
            });

            await openActorSheet(page, actorId, 'traits');

            const traitText = await page.evaluate(() => {
                const rows = document.querySelectorAll('.sheet.actor .tab.traits .item-row');
                for (const row of rows) {
                    const nameEl = row.querySelector('.item-name a.item-edit.bold');
                    if (nameEl && nameEl.textContent.includes('Sharp Eye')) {
                        return nameEl.textContent.trim();
                    }
                }
                return null;
            });

            expect(traitText).toBe('Sharp Eye');
            expect(traitText).not.toContain('(');
        } finally {
            await closeAllWindows(page);
            if (actorId) await deleteActor(page, actorId);
        }
    });

    test('Drawback with subtext shows "Name (Detail)" on actor traits tab', async ({ page }) => {
        let actorId;
        try {
            actorId = await createHeroActor(page, prefixName('TraitSubtext_Draw'));
            await addTraitToActor(page, actorId, {
                name: 'Dark Secret',
                type: 'drawback',
                baseCost: 5,
                text: 'Criminal Past',
            });

            await openActorSheet(page, actorId, 'traits');

            const traitText = await page.evaluate(() => {
                const rows = document.querySelectorAll('.sheet.actor .tab.traits .item-row');
                for (const row of rows) {
                    const nameEl = row.querySelector('.item-name a.item-edit.bold');
                    if (nameEl && nameEl.textContent.includes('Dark Secret')) {
                        return nameEl.textContent.trim();
                    }
                }
                return null;
            });

            expect(traitText).toBe('Dark Secret (Criminal Past)');
        } finally {
            await closeAllWindows(page);
            if (actorId) await deleteActor(page, actorId);
        }
    });

    test('Item sheet view mode header shows combined "Name (Detail)"', async ({ page }) => {
        let actorId;
        try {
            actorId = await createHeroActor(page, prefixName('TraitSubtext_Sheet'));
            const itemId = await addTraitToActor(page, actorId, {
                name: 'Connections',
                type: 'advantage',
                baseCost: 5,
                text: 'Gotham PD',
            });

            // Ensure the item sheet opens in view mode (edit-mode off)
            await page.evaluate(({ actorId, itemId }) => {
                const actor = game.actors.get(actorId);
                const item = actor.items.get(itemId);
                item.setFlag('megs', 'edit-mode', false);
            }, { actorId, itemId });

            await openItemSheet(page, actorId, itemId);

            // In view mode, the header shows: <h1 class="charname isLocked"><div name="name">Name (Detail)</div></h1>
            const headerText = await page.evaluate(() => {
                const header = document.querySelector('.sheet.item h1.charname.isLocked div[name="name"]');
                return header ? header.textContent.trim() : null;
            });

            expect(headerText).toBe('Connections (Gotham PD)');
        } finally {
            await closeAllWindows(page);
            if (actorId) await deleteActor(page, actorId);
        }
    });

    test('Item sheet edit mode shows editable system.text input', async ({ page }) => {
        let actorId;
        try {
            actorId = await createHeroActor(page, prefixName('TraitSubtext_Edit'));
            const itemId = await addTraitToActor(page, actorId, {
                name: 'Connections',
                type: 'advantage',
                baseCost: 5,
                text: 'Gotham PD',
                hasSubtext: true,
            });

            // Set edit mode on the item
            await page.evaluate(({ actorId, itemId }) => {
                const actor = game.actors.get(actorId);
                const item = actor.items.get(itemId);
                item.setFlag('megs', 'edit-mode', true);
            }, { actorId, itemId });

            await openItemSheet(page, actorId, itemId);

            // Wait for the item sheet to re-render in edit mode
            await page.waitForSelector('.sheet.item input[name="system.text"]', { timeout: 5000 });

            const inputValue = await page.evaluate(() => {
                const input = document.querySelector('.sheet.item input[name="system.text"]');
                return input ? input.value : null;
            });

            expect(inputValue).toBe('Gotham PD');

            // Verify the input is editable (not disabled/readonly)
            const isEditable = await page.evaluate(() => {
                const input = document.querySelector('.sheet.item input[name="system.text"]');
                return input && !input.disabled && !input.readOnly;
            });

            expect(isEditable).toBe(true);
        } finally {
            await closeAllWindows(page);
            if (actorId) await deleteActor(page, actorId);
        }
    });
});
