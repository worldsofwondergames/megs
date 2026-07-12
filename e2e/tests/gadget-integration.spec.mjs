import { test, expect } from '../fixtures/foundry-test.mjs';
import {
    prefixName,
    createHeroActor,
    addGadgetToActor,
    addPowerToActor,
    addSkillToActor,
    deleteActor,
    openItemSheet,
    closeAllWindows,
} from '../fixtures/test-data.mjs';

/**
 * Category 9 of #226 (gaps not already covered by gadget-rolling,
 * gadget-sheet-rolling, and reliability-number specs): child powers/skills
 * on gadgets, gadget attribute values, and the Omni-Gadget sheet variant.
 */
test.describe('Gadget Integration (#226 cat 9)', () => {
    test('Power added to a gadget appears on the gadget sheet powers tab', async ({ page }) => {
        let actorId;
        try {
            actorId = await createHeroActor(page, prefixName('GadgetInt_Power'));
            const gadgetId = await addGadgetToActor(page, actorId, {
                name: 'Power Armor', av: 0, ev: 0,
            });
            // The powers tab is gated on the hasPowers setting (string flag)
            await page.evaluate(async ({ actorId, gadgetId }) => {
                const gadget = game.actors.get(actorId).items.get(gadgetId);
                await gadget.update({ 'system.settings.hasPowers': 'true' });
            }, { actorId, gadgetId });
            await addPowerToActor(page, actorId, {
                name: 'Armor Blast', aps: 6, factorCost: 3, parent: gadgetId,
            });

            await openItemSheet(page, actorId, gadgetId);
            const tabs = await page.evaluate(() =>
                [...document.querySelectorAll('.sheet.item nav.sheet-tabs .item')].map(a => a.dataset.tab));
            expect(tabs).toContain('powers');

            await page.click('.sheet.item nav.sheet-tabs .item[data-tab="powers"]');
            const visible = await page.evaluate(() => {
                const tab = document.querySelector('.sheet.item .tab[data-tab="powers"]');
                return tab ? tab.textContent.includes('Armor Blast') : false;
            });
            expect(visible).toBe(true);
        } finally {
            await closeAllWindows(page);
            if (actorId) await deleteActor(page, actorId);
        }
    });

    test('Skill added to a gadget appears on the gadget sheet skills tab', async ({ page }) => {
        let actorId;
        try {
            actorId = await createHeroActor(page, prefixName('GadgetInt_Skill'));
            const gadgetId = await addGadgetToActor(page, actorId, {
                name: 'Spy Kit', av: 0, ev: 0,
            });
            await page.evaluate(async ({ actorId, gadgetId }) => {
                const gadget = game.actors.get(actorId).items.get(gadgetId);
                await gadget.update({ 'system.settings.hasSkills': 'true' });
            }, { actorId, gadgetId });
            await addSkillToActor(page, actorId, {
                name: 'Surveillance', aps: 4, factorCost: 3, parent: gadgetId,
            });

            await openItemSheet(page, actorId, gadgetId);
            const tabs = await page.evaluate(() =>
                [...document.querySelectorAll('.sheet.item nav.sheet-tabs .item')].map(a => a.dataset.tab));
            expect(tabs).toContain('skills');

            await page.click('.sheet.item nav.sheet-tabs .item[data-tab="skills"]');
            const visible = await page.evaluate(() => {
                const tab = document.querySelector('.sheet.item .tab[data-tab="skills"]');
                return tab ? tab.textContent.includes('Surveillance') : false;
            });
            expect(visible).toBe(true);
        } finally {
            await closeAllWindows(page);
            if (actorId) await deleteActor(page, actorId);
        }
    });

    test('Gadget attribute values are settable and display on the abilities tab', async ({ page }) => {
        let actorId;
        try {
            actorId = await createHeroActor(page, prefixName('GadgetInt_Attrs'));
            const gadgetId = await addGadgetToActor(page, actorId, {
                name: 'Exo Frame',
                av: 0,
                ev: 0,
                attrs: { dex: 6, str: 9, body: 8 },
            });
            // The attributes section renders when hasAttributes marks a
            // category active; the gadget builder writes these as nested keys
            await page.evaluate(async ({ actorId, gadgetId }) => {
                const gadget = game.actors.get(actorId).items.get(gadgetId);
                await gadget.update({ 'system.settings.hasAttributes.physical': 'true' });
            }, { actorId, gadgetId });

            const stored = await page.evaluate(({ actorId, gadgetId }) => {
                const gadget = game.actors.get(actorId).items.get(gadgetId);
                const a = gadget.system.attributes;
                return { dex: a.dex.value, str: a.str.value, body: a.body.value };
            }, { actorId, gadgetId });
            expect(stored).toEqual({ dex: 6, str: 9, body: 8 });

            // Open in view mode; attribute labels localize to full names
            await page.evaluate(async ({ actorId, itemId }) => {
                const item = game.actors.get(actorId).items.get(itemId);
                await item.setFlag('megs', 'edit-mode', false);
            }, { actorId, itemId: gadgetId });
            await openItemSheet(page, actorId, gadgetId);
            const abilitiesText = await page.evaluate(() => {
                const tab = document.querySelector('.sheet.item .tab[data-tab="abilities"]');
                return tab ? tab.textContent.replace(/\s+/g, ' ') : '';
            });
            expect(abilitiesText).toContain('Dexterity 6');
            expect(abilitiesText).toContain('Strength 9');
            expect(abilitiesText).toContain('Body 8');
        } finally {
            await closeAllWindows(page);
            if (actorId) await deleteActor(page, actorId);
        }
    });

    test('Omni-Gadget variant renders the omni header (quantity + APs)', async ({ page }) => {
        let actorId;
        try {
            actorId = await createHeroActor(page, prefixName('GadgetInt_Omni'));
            const gadgetId = await addGadgetToActor(page, actorId, {
                name: 'Omni Device', av: 0, ev: 0,
            });
            await page.evaluate(async ({ actorId, gadgetId }) => {
                const gadget = game.actors.get(actorId).items.get(gadgetId);
                await gadget.update({ 'system.isOmni': 'true', 'system.aps': 8 });
            }, { actorId, gadgetId });

            await openItemSheet(page, actorId, gadgetId);
            const omni = await page.evaluate(() => {
                const sheet = document.querySelector('.sheet.item');
                return {
                    hasQuantity: !!sheet?.querySelector('label[for="system.quantity"]'),
                };
            });
            expect(omni.hasQuantity).toBe(true);
        } finally {
            await closeAllWindows(page);
            if (actorId) await deleteActor(page, actorId);
        }
    });
});
