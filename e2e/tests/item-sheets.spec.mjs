import { test, expect } from '../fixtures/foundry-test.mjs';
import {
    prefixName,
    createHeroActor,
    addPowerToActor,
    addSkillToActor,
    addSubskillToActor,
    addTraitToActor,
    addModifierToActorItem,
    addGadgetToActor,
    deleteActor,
    openItemSheet,
    closeAllWindows,
} from '../fixtures/test-data.mjs';

/**
 * Category 4 of #226: Item Sheets.
 * Every MEGS item type opens its sheet and renders its key fields.
 */
test.describe('Item Sheets (#226 cat 4)', () => {
    /** Read a sheet field that may render as an input (edit mode) or plain text. */
    async function readField(page, selector) {
        return page.evaluate((sel) => {
            const el = document.querySelector(sel);
            if (!el) return null;
            if (el.tagName === 'INPUT' || el.tagName === 'SELECT') return el.value;
            return el.textContent.trim();
        }, selector);
    }

    /** Force the item sheet into view mode (edit-mode off) before opening. */
    async function setViewMode(page, actorId, itemId) {
        await page.evaluate(async ({ actorId, itemId }) => {
            const item = game.actors.get(actorId).items.get(itemId);
            item.sheet; // eslint-disable-line no-unused-expressions -- construct first; constructor resets the flag
            await item.setFlag('megs', 'edit-mode', false);
        }, { actorId, itemId });
    }

    test('Power sheet displays APs, base cost, factor cost, and linked attribute', async ({ page }) => {
        let actorId;
        try {
            actorId = await createHeroActor(page, prefixName('ItemSheet_Power'));
            const itemId = await addPowerToActor(page, actorId, {
                name: 'Heat Vision', aps: 6, baseCost: 10, factorCost: 3, link: 'int',
            });
            await setViewMode(page, actorId, itemId);
            await openItemSheet(page, actorId, itemId);

            expect(await readField(page, '.sheet.item #apsInput')).toBe('6');

            const header = await page.evaluate(() => {
                const sheet = document.querySelector('.sheet.item');
                const labels = [...sheet.querySelectorAll('.resource-label')].map(l => l.textContent.trim());
                return { labels, text: sheet.textContent };
            });
            expect(header.labels).toContain('Base');
            expect(header.labels).toContain('Factor');
            expect(header.labels).toContain('APs');

            // Base cost 10 shown under the Base label (view mode)
            const baseCost = await page.evaluate(() => {
                const label = [...document.querySelectorAll('.sheet.item .resource-label')]
                    .find(l => l.textContent.trim() === 'Base');
                return label?.parentElement.querySelector('div')?.textContent.trim() ?? null;
            });
            expect(baseCost).toBe('10');

            // Linked attribute displayed on characteristics tab
            const tabText = await page.evaluate(() => {
                return document.querySelector('.sheet.item .tab[data-tab="characteristics"]')?.textContent ?? '';
            });
            expect(tabText).toContain('Link');
        } finally {
            await closeAllWindows(page);
            if (actorId) await deleteActor(page, actorId);
        }
    });

    test('Skill sheet displays APs and has subskills tab', async ({ page }) => {
        let actorId;
        try {
            actorId = await createHeroActor(page, prefixName('ItemSheet_Skill'));
            const itemId = await addSkillToActor(page, actorId, {
                name: 'Acrobatics', aps: 4, factorCost: 4, link: 'dex',
            });
            await setViewMode(page, actorId, itemId);
            await openItemSheet(page, actorId, itemId);

            expect(await readField(page, '.sheet.item #apsInput')).toBe('4');

            const tabs = await page.evaluate(() =>
                [...document.querySelectorAll('.sheet.item nav.sheet-tabs .item')].map(a => a.dataset.tab));
            expect(tabs).toContain('characteristics');
            expect(tabs).toContain('subskills');
            expect(tabs).toContain('description');
        } finally {
            await closeAllWindows(page);
            if (actorId) await deleteActor(page, actorId);
        }
    });

    test('Subskill sheet opens and renders under its parent skill', async ({ page }) => {
        let actorId;
        try {
            actorId = await createHeroActor(page, prefixName('ItemSheet_Subskill'));
            const skillId = await addSkillToActor(page, actorId, {
                name: 'Vehicles', aps: 3, factorCost: 3, link: 'dex',
            });
            const subskillId = await addSubskillToActor(page, actorId, {
                name: 'Land Vehicles', aps: 3, parent: skillId, linkedSkill: 'Vehicles',
            });
            await openItemSheet(page, actorId, subskillId);

            const rendered = await page.evaluate(() => {
                const sheet = document.querySelector('.sheet.item');
                return sheet ? sheet.textContent.includes('Land Vehicles') : false;
            });
            expect(rendered).toBe(true);
        } finally {
            await closeAllWindows(page);
            if (actorId) await deleteActor(page, actorId);
        }
    });

    test('Advantage sheet displays initial cost', async ({ page }) => {
        let actorId;
        try {
            actorId = await createHeroActor(page, prefixName('ItemSheet_Adv'));
            const itemId = await addTraitToActor(page, actorId, {
                name: 'Iron Nerves', type: 'advantage', baseCost: 10,
            });
            await setViewMode(page, actorId, itemId);
            await openItemSheet(page, actorId, itemId);

            const text = await page.evaluate(() =>
                document.querySelector('.sheet.item')?.textContent ?? '');
            expect(text).toContain('Iron Nerves');
            expect(text).toContain('Initial Cost');
        } finally {
            await closeAllWindows(page);
            if (actorId) await deleteActor(page, actorId);
        }
    });

    test('Drawback sheet displays initial bonus', async ({ page }) => {
        let actorId;
        try {
            actorId = await createHeroActor(page, prefixName('ItemSheet_Draw'));
            const itemId = await addTraitToActor(page, actorId, {
                name: 'Uncertainty', type: 'drawback', baseCost: 10,
            });
            await setViewMode(page, actorId, itemId);
            await openItemSheet(page, actorId, itemId);

            const text = await page.evaluate(() =>
                document.querySelector('.sheet.item')?.textContent ?? '');
            expect(text).toContain('Uncertainty');
            expect(text).toContain('Initial Bonus');
        } finally {
            await closeAllWindows(page);
            if (actorId) await deleteActor(page, actorId);
        }
    });

    test('Bonus sheet displays factor cost modifier', async ({ page }) => {
        let actorId;
        try {
            actorId = await createHeroActor(page, prefixName('ItemSheet_Bonus'));
            const powerId = await addPowerToActor(page, actorId, {
                name: 'Flame Project', aps: 5, factorCost: 3,
            });
            const bonusId = await addModifierToActorItem(page, actorId, {
                name: 'Area Effect', type: 'bonus', factorCostMod: 2, parent: powerId,
            });
            await openItemSheet(page, actorId, bonusId);

            expect(await readField(page, '.sheet.item input[name="system.factorCostMod"]')).toBe('2');
        } finally {
            await closeAllWindows(page);
            if (actorId) await deleteActor(page, actorId);
        }
    });

    test('Limitation sheet displays factor cost modifier', async ({ page }) => {
        let actorId;
        try {
            actorId = await createHeroActor(page, prefixName('ItemSheet_Lim'));
            const powerId = await addPowerToActor(page, actorId, {
                name: 'Ice Production', aps: 5, factorCost: 3,
            });
            const limId = await addModifierToActorItem(page, actorId, {
                name: 'Touch Only', type: 'limitation', factorCostMod: -1, parent: powerId,
            });
            await openItemSheet(page, actorId, limId);

            expect(await readField(page, '.sheet.item input[name="system.factorCostMod"]')).toBe('-1');
        } finally {
            await closeAllWindows(page);
            if (actorId) await deleteActor(page, actorId);
        }
    });

    test('Gadget sheet opens and renders abilities and description tabs', async ({ page }) => {
        let actorId;
        try {
            actorId = await createHeroActor(page, prefixName('ItemSheet_Gadget'));
            const gadgetId = await addGadgetToActor(page, actorId, {
                name: 'Utility Belt', av: 4, ev: 4,
            });
            await openItemSheet(page, actorId, gadgetId);

            const tabs = await page.evaluate(() =>
                [...document.querySelectorAll('.sheet.item nav.sheet-tabs .item')].map(a => a.dataset.tab));
            expect(tabs).toContain('abilities');
            expect(tabs).toContain('description');

            for (const tab of ['abilities', 'description']) {
                await page.click(`.sheet.item nav.sheet-tabs .item[data-tab="${tab}"]`);
                await page.waitForFunction(
                    (t) => {
                        const el = document.querySelector(`.sheet.item .tab[data-tab="${t}"]`);
                        return el && el.classList.contains('active');
                    },
                    tab,
                    { timeout: 5000 }
                );
            }
        } finally {
            await closeAllWindows(page);
            if (actorId) await deleteActor(page, actorId);
        }
    });
});
