import { test, expect } from '../fixtures/foundry-test.mjs';
import {
    prefixName,
    createHeroActor,
    addPowerToActor,
    addGadgetToActor,
    deleteActor,
    openActorSheet,
    closeAllWindows,
} from '../fixtures/test-data.mjs';

/**
 * Issue #281: the HP cost tooltips and the omni-gadget description are built in
 * JavaScript. Each test swaps in marked translations for the strings it reads,
 * renders the sheet, and checks the marked text reaches the page, which only
 * happens if the text is looked up in the dictionary at render time.
 */
test.describe('Cost tooltip localization (#281)', () => {
    /** Replace MEGS strings with marked copies; returns the originals for restoring. */
    async function markTranslations(page, keys) {
        return page.evaluate((keys) => {
            const originals = {};
            for (const key of keys) {
                originals[key] = foundry.utils.getProperty(game.i18n.translations, key);
                foundry.utils.setProperty(game.i18n.translations, key, `«${originals[key]}»`);
            }
            return originals;
        }, keys);
    }

    async function restoreTranslations(page, originals) {
        if (!originals) return;
        await page.evaluate((originals) => {
            for (const [key, value] of Object.entries(originals)) {
                foundry.utils.setProperty(game.i18n.translations, key, value);
            }
        }, originals);
    }

    test('Character Builder HP Spent and power cost tooltips use the dictionary', async ({ page }) => {
        let actorId;
        let originals;
        try {
            actorId = await createHeroActor(page, prefixName('CostTooltipI18n'));
            const powerId = await addPowerToActor(page, actorId, {
                name: 'Flight', aps: 5, baseCost: 10, factorCost: 3, link: 'dex',
            });
            originals = await markTranslations(page, [
                'MEGS.CostTooltip.Heading', 'MEGS.CostTooltip.LineHP', 'MEGS.CostTooltip.BaseCost',
                'MEGS.CostTooltip.APCost', 'MEGS.Attributes',
            ]);
            await page.evaluate(async (id) => {
                await game.actors.get(id).setFlag('core', 'sheetClass', 'megs.MEGSCharacterBuilderSheet');
            }, actorId);
            await openActorSheet(page, actorId, 'powers');

            const spent = page.locator('.sheet.actor .hp-spent-tooltip');
            await expect(spent).toHaveCount(1);
            const spentTitle = await spent.getAttribute('title');
            expect(spentTitle.split('\n')[0]).toBe(`«${originals['MEGS.CostTooltip.Heading']}»`);
            expect(spentTitle).toContain(`«${originals['MEGS.Attributes']}»`);
            expect(spentTitle).toMatch(/^«.*»: .*»$/m);

            const cost = page.locator(`.sheet.actor .tab.powers .item-row[data-item-id="${powerId}"] .item-total-cost`);
            const costTitle = await cost.getAttribute('title');
            expect(costTitle).toContain('«');
            expect(costTitle.split('\n')[1]).toMatch(/^«.*»$/);
        } finally {
            await restoreTranslations(page, originals);
            await closeAllWindows(page);
            if (actorId) await deleteActor(page, actorId);
        }
    });

    test('omni-gadget description and gadget labels use the dictionary', async ({ page }) => {
        let actorId;
        let originals;
        try {
            actorId = await createHeroActor(page, prefixName('OmniI18n'));
            const omniId = await addGadgetToActor(page, actorId, { name: 'Utility Belt' });
            const blasterId = await addGadgetToActor(page, actorId, { name: 'Blaster', av: 5, ev: 6 });
            await page.evaluate(async ({ actorId, omniId }) => {
                const gadget = game.actors.get(actorId).items.get(omniId);
                await gadget.update({ 'system.isOmni': 'true', 'system.aps': 8, 'system.omniClasses.a': 'true' });
            }, { actorId, omniId });
            originals = await markTranslations(page, ['MEGS.PhysicalAttributes', 'MEGS.Abbr.AV', 'MEGS.Abbr.EV']);
            await openActorSheet(page, actorId, 'gadgets');

            const omni = page.locator(`.sheet.actor .tab.gadgets .item-row[data-item-id="${omniId}"] .item-description`);
            await expect(omni).toHaveCount(1);
            expect(await omni.textContent()).toContain(`(«${originals['MEGS.PhysicalAttributes']}»)`);

            const blaster = page.locator(`.sheet.actor .tab.gadgets .item-row[data-item-id="${blasterId}"] .item-description`);
            await expect(blaster).toHaveCount(1);
            const text = (await blaster.textContent()).trim();
            expect(text).toContain(`«${originals['MEGS.Abbr.AV']}» 5`);
            expect(text).toContain(`«${originals['MEGS.Abbr.EV']}» 6`);
        } finally {
            await restoreTranslations(page, originals);
            await closeAllWindows(page);
            if (actorId) await deleteActor(page, actorId);
        }
    });
});
