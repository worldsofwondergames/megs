import { test, expect } from '../fixtures/foundry-test.mjs';
import {
    prefixName,
    createHeroActor,
    addPowerToActor,
    addSkillToActor,
    deleteActor,
    openActorSheet,
    closeAllWindows,
} from '../fixtures/test-data.mjs';

/**
 * Issue #286: a linked Power or Skill whose APs differ from its linked Attribute
 * must show a visible warning on the Character Builder and the regular actor sheet.
 */
test.describe('Linked APs mismatch warning (#286)', () => {
    /** Hero with DEX 7, a linked power and a linked skill, each rated `aps`. */
    async function setUpHero(page, label, aps) {
        const actorId = await createHeroActor(page, prefixName(label), { dex: 7 });
        const powerId = await addPowerToActor(page, actorId, {
            name: 'Flight', aps, baseCost: 10, factorCost: 1, link: 'dex',
        });
        const skillId = await addSkillToActor(page, actorId, {
            name: 'Acrobatics', aps, factorCost: 6, link: 'dex',
        });
        await page.evaluate(async ({ actorId, ids }) => {
            const actor = game.actors.get(actorId);
            await actor.updateEmbeddedDocuments('Item', ids.map(_id => ({ _id, 'system.isLinked': 'true' })));
        }, { actorId, ids: [powerId, skillId] });
        return { actorId, powerId, skillId };
    }

    async function openSheet(page, actorId, { builder, editMode, tab }) {
        await page.evaluate(async ({ actorId, builder, editMode }) => {
            const actor = game.actors.get(actorId);
            if (builder) await actor.setFlag('core', 'sheetClass', 'megs.MEGSCharacterBuilderSheet');
            await actor.setFlag('megs', 'edit-mode', editMode);
        }, { actorId, builder, editMode });
        await openActorSheet(page, actorId, tab);
    }

    /** The AP cell for an item: its classes, tooltip, and the color of the AP value. */
    async function apCell(page, tab, itemId) {
        const cell = page.locator(`.sheet.actor .tab.${tab} .item-row[data-item-id="${itemId}"] .item-aps`);
        await expect(cell).toHaveCount(1);
        return cell.evaluate((el) => {
            const value = el.querySelector('input') ?? el;
            const icon = el.querySelector('.link-mismatch-icon');
            return {
                mismatch: el.classList.contains('link-mismatch'),
                title: el.getAttribute('title'),
                color: getComputedStyle(value).color,
                hasInput: !!el.querySelector('input'),
                iconColor: icon && icon.getBoundingClientRect().width > 0 ? getComputedStyle(icon).color : null,
            };
        });
    }

    const expectedTooltip = (page, aps) => page.evaluate((aps) => game.i18n.format('MEGS.LinkMismatch', {
        attribute: game.i18n.localize(CONFIG.MEGS.attributes.dex), value: 7, aps,
    }), aps);

    const RED = 'rgb(211, 47, 47)';

    for (const sheet of [
        { name: 'Character Builder', builder: true, editMode: true, input: true },
        { name: 'regular actor sheet in edit mode', builder: false, editMode: true, input: true },
        { name: 'regular actor sheet in view mode', builder: false, editMode: false, input: false },
    ]) {
        test(`${sheet.name} warns on a mismatched linked power and skill`, async ({ page }) => {
            let actorId;
            try {
                const hero = await setUpHero(page, 'LinkMismatch_6', 6);
                actorId = hero.actorId;
                const tooltip = await expectedTooltip(page, 6);
                expect(tooltip).toContain('7');

                await openSheet(page, actorId, { ...sheet, tab: 'powers' });
                const power = await apCell(page, 'powers', hero.powerId);
                expect(power).toEqual({ mismatch: true, title: tooltip, color: RED, hasInput: sheet.input, iconColor: RED });

                await page.click('.sheet.actor .tabs .item[data-tab="skills"]');
                const skill = await apCell(page, 'skills', hero.skillId);
                expect(skill).toEqual({ mismatch: true, title: tooltip, color: RED, hasInput: sheet.input, iconColor: RED });
            } finally {
                await closeAllWindows(page);
                if (actorId) await deleteActor(page, actorId);
            }
        });

        test(`${sheet.name} shows no warning when the APs match`, async ({ page }) => {
            let actorId;
            try {
                const hero = await setUpHero(page, 'LinkMismatch_7', 7);
                actorId = hero.actorId;

                await openSheet(page, actorId, { ...sheet, tab: 'powers' });
                const power = await apCell(page, 'powers', hero.powerId);
                expect(power.hasInput).toBe(sheet.input);
                expect(power.mismatch).toBe(false);
                expect(power.title).toBe('');
                expect(power.color).not.toBe(RED);
                expect(power.iconColor).toBeNull();
            } finally {
                await closeAllWindows(page);
                if (actorId) await deleteActor(page, actorId);
            }
        });
    }
});
