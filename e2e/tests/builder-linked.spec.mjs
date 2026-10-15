import { test, expect } from '../fixtures/foundry-test.mjs';
import {
    prefixName,
    createHeroActor,
    addPowerToActor,
    addSkillToActor,
    deleteActor,
    openActorSheet,
    openItemSheet,
    closeAllWindows,
} from '../fixtures/test-data.mjs';

/**
 * Issue #282: the character builder's Linked checkbox saves system.isLinked as a
 * boolean, while the item sheet's Yes/No select saves a string. The regular actor
 * sheet and the item sheet must treat both as linked.
 */
test.describe('Linked in the character builder (#282)', () => {
    /** Open the actor in the character builder and tick the Linked box for one item. */
    async function linkInBuilder(page, actorId, itemId, tab) {
        await page.evaluate(async (id) => {
            const actor = game.actors.get(id);
            await actor.setFlag('core', 'sheetClass', 'megs.MEGSCharacterBuilderSheet');
            actor.sheet.render(true);
        }, actorId);
        await page.click(`.sheet.actor .tabs .item[data-tab="${tab}"]`);
        const checkbox = page.locator(`.sheet.actor .tab.${tab} input[name="system.isLinked"][data-item-id="${itemId}"]`);
        await expect(checkbox).not.toBeChecked();
        await checkbox.check();
        await page.waitForFunction(
            ({ actorId, itemId }) => game.actors.get(actorId).items.get(itemId).system.isLinked === true,
            { actorId, itemId },
            { timeout: 5000 },
        );

        // Back to the regular actor sheet.
        await closeAllWindows(page);
        await page.evaluate(async (id) => {
            await game.actors.get(id).unsetFlag('core', 'sheetClass');
        }, actorId);
    }

    /** Text of the item's name link on the regular actor sheet. */
    async function displayedName(page, tab, itemId) {
        const name = page.locator(`.sheet.actor .tab.${tab} .item-row[data-item-id="${itemId}"] .item-name a.item-edit`);
        await expect(name).toHaveCount(1);
        return (await name.textContent()).trim();
    }

    /** Text shown beside Is Linked on the item sheet in view mode. */
    async function isLinkedText(page, actorId, itemId) {
        await page.evaluate(async ({ actorId, itemId }) => {
            const item = game.actors.get(actorId).items.get(itemId);
            await item.setFlag('megs', 'edit-mode', false);
        }, { actorId, itemId });
        await openItemSheet(page, actorId, itemId);
        const value = page.locator('.sheet.item label[for="system.isLinked"] + div');
        await expect(value).toHaveCount(1);
        return (await value.textContent()).trim();
    }

    test('a power linked in the builder shows as linked on the regular sheets', async ({ page }) => {
        let actorId;
        try {
            actorId = await createHeroActor(page, prefixName('BuilderLinked_Power'));
            const powerId = await addPowerToActor(page, actorId, {
                name: 'Flight', aps: 5, baseCost: 10, factorCost: 3, link: 'str',
            });

            await linkInBuilder(page, actorId, powerId, 'powers');

            await openActorSheet(page, actorId, 'powers');
            expect(await displayedName(page, 'powers', powerId)).toBe('Flight*');
            await closeAllWindows(page);

            expect(await isLinkedText(page, actorId, powerId)).toBe('Yes');
        } finally {
            await closeAllWindows(page);
            if (actorId) await deleteActor(page, actorId);
        }
    });

    test('a skill linked in the builder shows as linked on the regular actor sheet', async ({ page }) => {
        let actorId;
        try {
            actorId = await createHeroActor(page, prefixName('BuilderLinked_Skill'));
            const skillId = await addSkillToActor(page, actorId, {
                name: 'Acrobatics', aps: 3, factorCost: 6, link: 'dex',
            });

            await linkInBuilder(page, actorId, skillId, 'skills');

            await openActorSheet(page, actorId, 'skills');
            expect(await displayedName(page, 'skills', skillId)).toBe('Acrobatics*');
        } finally {
            await closeAllWindows(page);
            if (actorId) await deleteActor(page, actorId);
        }
    });

    test('an unlinked power has no asterisk and shows Is Linked: No', async ({ page }) => {
        let actorId;
        try {
            actorId = await createHeroActor(page, prefixName('BuilderLinked_Unlinked'));
            const powerId = await addPowerToActor(page, actorId, {
                name: 'Flight', aps: 5, baseCost: 10, factorCost: 3, link: 'str',
            });

            await openActorSheet(page, actorId, 'powers');
            expect(await displayedName(page, 'powers', powerId)).toBe('Flight');
            await closeAllWindows(page);

            expect(await isLinkedText(page, actorId, powerId)).toBe('No');
        } finally {
            await closeAllWindows(page);
            if (actorId) await deleteActor(page, actorId);
        }
    });
});
