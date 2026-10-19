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
import { waitForRollDialog, getRollDialogValues, closeRollDialog } from '../fixtures/roll-helpers.mjs';

/**
 * Issue #210: an equipped gadget's italicized Attribute replaces the character's own
 * for rolls when it is higher. The hero from createHeroActor has DEX 5, STR 4, BODY 4.
 */
async function setEquipped(page, actorId, gadgetId, value) {
    await page.evaluate(async ({ actorId, gadgetId, value }) => {
        await game.actors.get(actorId).items.get(gadgetId).update({ 'system.isEquipped': value });
    }, { actorId, gadgetId, value });
}

test.describe('Equipped gadget Attributes (#210)', () => {
    /** The info icon on an Attribute of the open actor sheet, or null. */
    async function readOverrideIcon(page, key) {
        return page.evaluate((key) => {
            const label = document.querySelector(`.sheet.actor .tab.abilities label[for="system.attributes.${key}.value"]`);
            const cell = label?.closest('.attribute');
            const icon = cell?.querySelector('.attribute-override-icon');
            return {
                cellFound: !!cell,
                title: icon ? icon.getAttribute('title') : null,
                shownValue: cell?.querySelector('.attribute-input input')?.value ?? cell?.querySelector('label + div')?.textContent.trim(),
            };
        }, key);
    }

    test('the Equipped select on the gadget sheet saves and makes the gadget replace the Attribute', async ({ page }) => {
        let actorId;
        try {
            actorId = await createHeroActor(page, prefixName('Override_Select'));
            const gadgetId = await addGadgetToActor(page, actorId, {
                name: 'Armor', reliability: 3, attrs: { body: 11, bodyItalic: true },
            });
            await page.evaluate(async ({ actorId, gadgetId }) => {
                await game.actors.get(actorId).items.get(gadgetId).setFlag('megs', 'edit-mode', true);
            }, { actorId, gadgetId });
            await openItemSheet(page, actorId, gadgetId);

            await page.selectOption('.sheet.item select[name="system.isEquipped"]', 'true');
            await page.waitForFunction(
                ({ actorId }) => game.actors.get(actorId).system.effectiveAttributes?.body === 11,
                { actorId },
                { timeout: 5000 }
            );
            const saved = await page.evaluate(({ actorId, gadgetId }) =>
                String(game.actors.get(actorId).items.get(gadgetId).system.isEquipped), { actorId, gadgetId });
            expect(saved).toBe('true');
        } finally {
            await closeAllWindows(page);
            if (actorId) await deleteActor(page, actorId);
        }
    });

    test('an equipped gadget marks the replaced Attribute and keeps showing the character\'s own value', async ({ page }) => {
        let actorId;
        try {
            actorId = await createHeroActor(page, prefixName('Override_Icon'));
            const gadgetId = await addGadgetToActor(page, actorId, {
                name: 'Armor', reliability: 3, attrs: { body: 11, bodyItalic: true },
            });
            await setEquipped(page, actorId, gadgetId, true);
            await page.evaluate((id) => game.actors.get(id).setFlag('megs', 'edit-mode', false), actorId);
            await openActorSheet(page, actorId, 'abilities');

            const expected = await page.evaluate(() =>
                game.i18n.format('MEGS.AttributeOverride', { gadget: 'Armor', value: 11 }));
            const body = await readOverrideIcon(page, 'body');
            expect(body.title).toBe(expected);
            expect(body.shownValue).toBe('4');

            // Presence above; now unequip and the icon goes away
            await closeAllWindows(page);
            await setEquipped(page, actorId, gadgetId, false);
            await openActorSheet(page, actorId, 'abilities');
            const after = await readOverrideIcon(page, 'body');
            expect(after.cellFound).toBe(true);
            expect(after.title).toBeNull();
        } finally {
            await closeAllWindows(page);
            if (actorId) await deleteActor(page, actorId);
        }
    });

    test('an attribute roll starts from the equipped gadget\'s values', async ({ page }) => {
        let actorId;
        try {
            actorId = await createHeroActor(page, prefixName('Override_Roll'));
            const gadgetId = await addGadgetToActor(page, actorId, {
                name: 'Battlesuit', reliability: 3, attrs: { dex: 8, dexItalic: true, str: 9, strItalic: true },
            });
            await page.evaluate(() => {
                for (const t of [...game.user.targets]) t.setTarget(false, { user: game.user, releaseOthers: false });
            });

            const rollDex = async () => {
                await openActorSheet(page, actorId, 'abilities');
                await page.click('.sheet.actor .tab.abilities .resource-label.rollable[data-key="dex"]');
                await waitForRollDialog(page);
                const values = await getRollDialogValues(page);
                await closeRollDialog(page);
                await closeAllWindows(page);
                return values;
            };

            // Not equipped: the character's own DEX 5 / STR 4
            expect(await rollDex()).toEqual({ actionValue: 5, effectValue: 4 });

            await setEquipped(page, actorId, gadgetId, true);
            expect(await rollDex()).toEqual({ actionValue: 8, effectValue: 9 });
        } finally {
            await closeAllWindows(page);
            if (actorId) await deleteActor(page, actorId);
        }
    });
});

/**
 * Issue #306: Initiative (DEX + INT + INFL) uses an equipped gadget's italicized
 * Attributes. The hero from createHeroActor has DEX 5, INT 3, INFL 2.
 */
test.describe('Initiative with an equipped gadget (#306)', () => {
    /** The Initiative Bonus and its tooltip on the open actor sheet, plus the value combat uses. */
    async function readInitiative(page, actorId) {
        return page.evaluate((id) => {
            const el = document.querySelector('.sheet.actor .initiative .tooltip');
            return {
                shown: el ? el.childNodes[0].textContent.trim() : null,
                tooltip: el?.querySelector('.tooltiptext')?.textContent.trim() ?? null,
                combat: game.actors.get(id)._calculateInitiativeBonus(),
            };
        }, actorId);
    }

    test('equipping a gadget with italicized DEX raises the Initiative Bonus on the sheet and in combat', async ({ page }) => {
        let actorId;
        try {
            actorId = await createHeroActor(page, prefixName('Override_Initiative'));
            const gadgetId = await addGadgetToActor(page, actorId, {
                name: 'Battlesuit', reliability: 3, attrs: { dex: 8, dexItalic: true },
            });

            await openActorSheet(page, actorId, 'abilities');
            expect(await readInitiative(page, actorId)).toEqual({
                shown: '10', tooltip: 'DEX 5 + INT 3 + INFL 2', combat: 10,
            });
            await closeAllWindows(page);

            await setEquipped(page, actorId, gadgetId, true);
            await openActorSheet(page, actorId, 'abilities');
            expect(await readInitiative(page, actorId)).toEqual({
                shown: '13', tooltip: 'DEX 8 (Battlesuit) + INT 3 + INFL 2', combat: 13,
            });
        } finally {
            await closeAllWindows(page);
            if (actorId) await deleteActor(page, actorId);
        }
    });
});
