import { test, expect } from '../fixtures/foundry-test.mjs';
import {
    prefixName,
    createHeroActor,
    deleteActor,
    openActorSheet,
    closeAllWindows,
} from '../fixtures/test-data.mjs';

/**
 * Categories 2 + 3 of #226: Actor Sheets.
 * Hero / Villain / NPC sheets render all tabs with the 9 attributes,
 * derived values calculate, attributes are editable; Location and
 * Vehicle sheets render.
 */
test.describe('Actor Sheets (#226 cats 2-3)', () => {
    // Attribute labels are localized full names on the sheet
    const ATTRIBUTE_LABELS = ['Dexterity', 'Strength', 'Body', 'Intelligence', 'Will', 'Mind', 'Influence', 'Aura', 'Spirit'];
    const TAB_NAMES = ['abilities', 'powers', 'skills', 'traits', 'gadgets', 'description'];

    async function createActorOfType(page, name, type) {
        return page.evaluate(async ({ name, type }) => {
            const actor = await Actor.create({ name, type });
            return actor.id;
        }, { name, type });
    }

    /** Open the sheet and click through every tab, asserting each becomes active. */
    async function verifyAllTabsRender(page, actorId) {
        await openActorSheet(page, actorId);
        for (const tab of TAB_NAMES) {
            await page.click(`.sheet.actor nav.sheet-tabs .item[data-tab="${tab}"]`);
            await page.waitForFunction(
                (t) => {
                    const el = document.querySelector(`.sheet.actor .tab[data-tab="${t}"]`);
                    return el && el.classList.contains('active');
                },
                tab,
                { timeout: 5000 }
            );
        }
    }

    async function getDisplayedAttributes(page) {
        return page.evaluate(() => {
            const out = {};
            const cells = document.querySelectorAll('.sheet.actor .tab.abilities .attribute');
            for (const cell of cells) {
                const label = cell.querySelector('label')?.textContent.trim();
                // Edit mode renders an input, view mode a plain div
                const input = cell.querySelector('.attribute-input input');
                const value = input ? input.value : cell.querySelector('label + div')?.textContent.trim();
                if (label) out[label] = value;
            }
            return out;
        });
    }

    test('Hero sheet opens and renders all tabs', async ({ page }) => {
        let actorId;
        try {
            actorId = await createHeroActor(page, prefixName('Sheet_Hero'));
            await verifyAllTabsRender(page, actorId);
        } finally {
            await closeAllWindows(page);
            if (actorId) await deleteActor(page, actorId);
        }
    });

    test('Villain sheet opens and renders all tabs', async ({ page }) => {
        let actorId;
        try {
            actorId = await createActorOfType(page, prefixName('Sheet_Villain'), 'villain');
            await verifyAllTabsRender(page, actorId);
        } finally {
            await closeAllWindows(page);
            if (actorId) await deleteActor(page, actorId);
        }
    });

    test('NPC sheet opens and renders all tabs', async ({ page }) => {
        let actorId;
        try {
            actorId = await createActorOfType(page, prefixName('Sheet_NPC'), 'npc');
            await verifyAllTabsRender(page, actorId);
        } finally {
            await closeAllWindows(page);
            if (actorId) await deleteActor(page, actorId);
        }
    });

    test('All 9 attributes display with their values on the hero sheet', async ({ page }) => {
        let actorId;
        try {
            actorId = await createHeroActor(page, prefixName('Sheet_Attrs'));
            await openActorSheet(page, actorId, 'abilities');

            const attrs = await getDisplayedAttributes(page);
            for (const label of ATTRIBUTE_LABELS) {
                expect(Object.keys(attrs), `attribute ${label} shown`).toContain(label);
            }
            expect(attrs.Dexterity).toBe('5');
            expect(attrs.Strength).toBe('4');
            expect(attrs.Body).toBe('4');
            expect(attrs.Spirit).toBe('2');
        } finally {
            await closeAllWindows(page);
            if (actorId) await deleteActor(page, actorId);
        }
    });

    test('Derived values: initiative bonus, hero points, current BODY', async ({ page }) => {
        let actorId;
        try {
            actorId = await createHeroActor(page, prefixName('Sheet_Derived'));

            // Initiative bonus = DEX + INT + INFL = 5 + 3 + 2 = 10 (no bonus
            // abilities). It is computed during sheet rendering, so it is
            // asserted from the rendered sheet below, not the document.
            await openActorSheet(page, actorId, 'abilities');

            const derived = await page.evaluate((id) => {
                const actor = game.actors.get(id);
                return {
                    heroPoints: actor.system.heroPoints.value,
                    currentBody: actor.system.currentBody.value,
                };
            }, actorId);
            expect(derived.heroPoints).toBe(10);
            const displayed = await page.evaluate(() => {
                const initEl = document.querySelector('.sheet.actor .initiative .tooltip');
                const hpInput = document.querySelector('.sheet.actor .hero-points input');
                const bodyInput = document.querySelector('.sheet.actor .sheet-header input[id*="currentBody"], .sheet.actor .sheet-header [name*="currentBody"]');
                return {
                    initiative: initEl ? initEl.childNodes[0].textContent.trim() : null,
                    heroPoints: hpInput ? hpInput.value : null,
                    currentBody: bodyInput ? bodyInput.value : null,
                    currentBodyMax: bodyInput ? bodyInput.getAttribute('max') : null,
                };
            });
            expect(displayed.initiative).toBe('10');
            expect(displayed.heroPoints).toBe('10');
            // Fresh actors start Current Body at 0; the input is capped at BODY
            expect(displayed.currentBody).toBe(String(derived.currentBody));
            expect(displayed.currentBodyMax).toBe('4');
        } finally {
            await closeAllWindows(page);
            if (actorId) await deleteActor(page, actorId);
        }
    });

    test('Attributes are editable in edit mode and persist', async ({ page }) => {
        let actorId;
        try {
            actorId = await createHeroActor(page, prefixName('Sheet_Edit'));
            await page.evaluate(async (id) => {
                await game.actors.get(id).setFlag('megs', 'edit-mode', true);
            }, actorId);
            await openActorSheet(page, actorId, 'abilities');
            await page.waitForSelector('.sheet.actor input[name="system.attributes.dex.value"]', { timeout: 5000 });

            await page.fill('.sheet.actor input[name="system.attributes.dex.value"]', '7');
            await page.dispatchEvent('.sheet.actor input[name="system.attributes.dex.value"]', 'change');

            await page.waitForFunction(
                (id) => game.actors.get(id).system.attributes.dex.value === 7,
                actorId,
                { timeout: 5000 }
            );
        } finally {
            await closeAllWindows(page);
            if (actorId) await deleteActor(page, actorId);
        }
    });

    test('Attribute +/- controls adjust the input value', async ({ page }) => {
        let actorId;
        try {
            actorId = await createHeroActor(page, prefixName('Sheet_PlusMinus'));
            await page.evaluate(async (id) => {
                await game.actors.get(id).setFlag('megs', 'edit-mode', true);
            }, actorId);
            await openActorSheet(page, actorId, 'abilities');
            await page.waitForSelector('.sheet.actor input[name="system.attributes.dex.value"]', { timeout: 5000 });

            const readDex = () => page.evaluate(() =>
                document.querySelector('.sheet.actor input[name="system.attributes.dex.value"]').value);

            expect(await readDex()).toBe('5');
            await page.evaluate(() => {
                document.querySelector('.sheet.actor input[name="system.attributes.dex.value"]')
                    .closest('.quantity').querySelector('button.plus').click();
            });
            expect(await readDex()).toBe('6');
            await page.evaluate(() => {
                document.querySelector('.sheet.actor input[name="system.attributes.dex.value"]')
                    .closest('.quantity').querySelector('button.minus').click();
            });
            expect(await readDex()).toBe('5');
        } finally {
            await closeAllWindows(page);
            if (actorId) await deleteActor(page, actorId);
        }
    });

    test('Location sheet opens and renders tabs with attributes', async ({ page }) => {
        let actorId;
        try {
            actorId = await createActorOfType(page, prefixName('Sheet_Location'), 'location');
            await verifyAllTabsRender(page, actorId);

            const attrs = await getDisplayedAttributes(page);
            for (const label of ATTRIBUTE_LABELS) {
                expect(Object.keys(attrs), `attribute ${label} shown`).toContain(label);
            }
        } finally {
            await closeAllWindows(page);
            if (actorId) await deleteActor(page, actorId);
        }
    });

    test('Vehicle sheet opens and renders its header (Owner field)', async ({ page }) => {
        let actorId;
        try {
            actorId = await createActorOfType(page, prefixName('Sheet_Vehicle'), 'vehicle');
            await openActorSheet(page, actorId);

            // A vehicle without a linked item shows only the header with the
            // Owner selector; the tab body renders once linked.
            const header = await page.evaluate(() => {
                const sheet = document.querySelector('.sheet.actor form.vehicle');
                if (!sheet) return null;
                // Name is an input in edit mode, a div in view mode
                const nameInput = sheet.querySelector('h1.charname input[name="name"]');
                const nameDiv = sheet.querySelector('h1.charname div[name="name"]');
                return {
                    hasOwnerLabel: !!sheet.querySelector('label[for="system.ownerId"]'),
                    name: nameInput ? nameInput.value : (nameDiv?.textContent.trim() ?? null),
                };
            });
            expect(header).not.toBeNull();
            expect(header.hasOwnerLabel).toBe(true);
            expect(header.name).toContain('Sheet_Vehicle');
        } finally {
            await closeAllWindows(page);
            if (actorId) await deleteActor(page, actorId);
        }
    });
});
