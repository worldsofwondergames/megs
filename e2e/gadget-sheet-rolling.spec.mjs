/**
 * E2E tests for Issue #13: Roll attacks from gadget sheet
 *
 * These tests verify that a gadget's item sheet has a roll button that
 * triggers the full gadget roll flow (picker dialog when multiple options,
 * direct roll dialog when single option).
 *
 * Requirements under test:
 * R1. A gadget sheet with explicit AV/EV shows a roll button in the header.
 * R2. A gadget sheet with child powers shows a roll button.
 * R3. A gadget sheet with attribute pairs shows a roll button.
 * R4. A gadget sheet with NO rollable options does NOT show a roll button.
 * R5. Single roll option: clicking roll button opens roll dialog directly.
 * R6. Multiple roll options: clicking roll button opens picker dialog.
 * R7. Roll button tooltip indicates available roll options.
 * R8. Roll from gadget sheet produces a chat message identifying the gadget.
 * R9. Picker dialog from gadget sheet lists all available options.
 *
 * Preconditions:
 * - Foundry VTT running at http://localhost:30000 with a MEGS world loaded
 * - Logged in as Gamemaster
 */

const FOUNDRY_URL = 'http://localhost:30000/game';
const TEST_ACTOR_PREFIX = '_E2E_GadgetSheetRoll_';

// ============================================================
// Foundry API Helpers
// ============================================================

async function createTestActor(page, name, gadgets) {
    return page.evaluate(async ({ name, gadgets }) => {
        const actor = await Actor.create({
            name,
            type: 'hero',
            system: {
                attributes: {
                    dex: { value: 5 },
                    str: { value: 4 },
                    body: { value: 4 },
                    int: { value: 3 },
                    will: { value: 3 },
                    mind: { value: 3 },
                    infl: { value: 3 },
                    aura: { value: 3 },
                    spirit: { value: 3 },
                },
                heroPoints: { value: 10 },
            },
        });

        const gadgetIds = {};
        const itemIds = {};

        for (const g of gadgets) {
            const gadgetData = {
                name: g.name,
                type: 'gadget',
                system: {
                    actionValue: g.av || 0,
                    effectValue: g.ev || 0,
                    description: g.description || '',
                    settings: {
                        hasAVAndEV: (g.av > 0 || g.ev > 0) ? 'true' : 'false',
                        hasAttributes: g.hasAttributes ?? {
                            physical: 'true',
                            mental: 'false',
                            mystical: 'false',
                        },
                        hasPowers: (g.powers && g.powers.length > 0) ? 'true' : 'false',
                        hasSkills: (g.skills && g.skills.length > 0) ? 'true' : 'false',
                        hasGadgets: 'false',
                        hasTraits: 'false',
                    },
                    attributes: {
                        dex: { value: g.attrs?.dex || 0, label: 'DEX', alwaysSubstitute: false },
                        str: { value: g.attrs?.str || 0, label: 'STR', alwaysSubstitute: false },
                        body: { value: g.attrs?.body || 0, label: 'BODY', alwaysSubstitute: false },
                        int: { value: g.attrs?.int || 0, label: 'INT', alwaysSubstitute: false },
                        will: { value: g.attrs?.will || 0, label: 'WILL', alwaysSubstitute: false },
                        mind: { value: g.attrs?.mind || 0, label: 'MIND', alwaysSubstitute: false },
                        infl: { value: g.attrs?.infl || 0, label: 'INFL', alwaysSubstitute: false },
                        aura: { value: g.attrs?.aura || 0, label: 'AURA', alwaysSubstitute: false },
                        spirit: { value: g.attrs?.spirit || 0, label: 'SPIRIT', alwaysSubstitute: false },
                    },
                },
            };
            const gadgetItem = await actor.createEmbeddedDocuments('Item', [gadgetData]);
            const gadgetId = gadgetItem[0].id;
            gadgetIds[g.name] = gadgetId;

            if (g.powers) {
                for (const p of g.powers) {
                    const powerData = {
                        name: p.name,
                        type: 'power',
                        system: {
                            aps: p.aps,
                            parent: gadgetId,
                            link: p.link || 'dex',
                            source: p.source || 'physical',
                        },
                    };
                    const items = await actor.createEmbeddedDocuments('Item', [powerData]);
                    itemIds[p.name] = items[0].id;
                }
            }

            if (g.skills) {
                for (const s of g.skills) {
                    const skillData = {
                        name: s.name,
                        type: 'skill',
                        system: {
                            aps: s.aps,
                            parent: gadgetId,
                            link: s.link || 'dex',
                        },
                    };
                    const items = await actor.createEmbeddedDocuments('Item', [skillData]);
                    itemIds[s.name] = items[0].id;
                }
            }
        }

        return { actorId: actor.id, gadgetIds, itemIds };
    }, { name, gadgets });
}

async function waitForGameReady(page) {
    await page.waitForSelector('#sidebar', { timeout: 15000 });
}

async function deleteTestActor(page, actorId) {
    await page.evaluate(async (id) => {
        const actor = game.actors.get(id);
        if (actor) await actor.delete();
    }, actorId);
}

async function closeAll(page) {
    await page.evaluate(() => {
        Object.values(ui.windows).forEach(w => w.close());
    });
    await page.waitForFunction(() => Object.keys(ui.windows).length === 0, { timeout: 5000 });
}

/**
 * Open a gadget's item sheet by its ID on an actor.
 */
async function openGadgetSheet(page, actorId, gadgetId) {
    await page.evaluate(({ actorId, gadgetId }) => {
        const actor = game.actors.get(actorId);
        if (!actor) throw new Error('Actor not found: ' + actorId);
        const gadget = actor.items.get(gadgetId);
        if (!gadget) throw new Error('Gadget not found: ' + gadgetId);
        gadget.sheet.render(true);
    }, { actorId, gadgetId });
    await page.waitForSelector('.sheet.item', { timeout: 5000 });
}

/**
 * Check if the gadget sheet roll button is visible.
 */
async function hasGadgetSheetRollButton(page) {
    return page.evaluate(() => {
        const btn = document.querySelector('.sheet.item .d10.rollable[data-type="gadget-roll"]');
        return !!btn;
    });
}

/**
 * Get the tooltip of the gadget sheet roll button.
 */
async function getGadgetSheetRollTooltip(page) {
    return page.evaluate(() => {
        const btn = document.querySelector('.sheet.item .d10.rollable[data-type="gadget-roll"]');
        return btn?.getAttribute('title') || null;
    });
}

/**
 * Click the gadget sheet roll button.
 */
async function clickGadgetSheetRollButton(page) {
    const clicked = await page.evaluate(() => {
        const btn = document.querySelector('.sheet.item .d10.rollable[data-type="gadget-roll"]');
        if (btn) { btn.click(); return true; }
        return false;
    });
    if (!clicked) throw new Error('Gadget sheet roll button not found');
}

/**
 * Check if the roll dialog (AV/EV/OV/RV) is open.
 */
async function isRollDialogOpen(page) {
    return page.evaluate(() => {
        for (const d of document.querySelectorAll('.dialog .megs-dialog')) {
            if (d.querySelector('#actionValue')) return true;
        }
        return false;
    });
}

/**
 * Wait for the roll dialog to appear.
 */
async function waitForRollDialog(page) {
    await page.waitForSelector('.dialog .megs-dialog #actionValue', { timeout: 5000 });
}

/**
 * Get AV and EV values from the open roll dialog.
 */
async function getRollDialogValues(page) {
    return page.evaluate(() => {
        const av = document.querySelector('.dialog .megs-dialog #actionValue');
        const ev = document.querySelector('.dialog .megs-dialog #effectValue');
        return {
            actionValue: av ? Number.parseInt(av.value) : null,
            effectValue: ev ? Number.parseInt(ev.value) : null,
        };
    });
}

/**
 * Check if the picker dialog is open.
 */
async function isPickerDialogOpen(page) {
    return page.evaluate(() => {
        for (const d of document.querySelectorAll('.dialog .megs-dialog')) {
            if (d.querySelector('input[name="selectedOption"]')) return true;
        }
        return false;
    });
}

/**
 * Get the option labels from the picker dialog.
 */
async function getPickerOptions(page) {
    return page.$$eval(
        '.dialog .megs-dialog .gadget-roll-option span',
        (spans) => spans.map(s => s.textContent.trim())
    );
}

/**
 * Close the roll dialog via the Close button.
 */
async function closeRollDialog(page) {
    await page.evaluate(() => {
        for (const btn of document.querySelectorAll('.dialog button')) {
            if (btn.textContent.trim() === 'Close') { btn.click(); return; }
        }
    });
    await page.waitForFunction(
        () => !document.querySelector('.dialog .megs-dialog #actionValue'),
        { timeout: 5000 }
    );
}

/**
 * Submit the roll dialog via the Submit button and wait for chat message.
 */
async function submitRollDialog(page, beforeCount) {
    await page.evaluate(() => {
        for (const btn of document.querySelectorAll('.dialog button')) {
            if (btn.textContent.trim() === 'Submit') { btn.click(); return; }
        }
    });
    await page.waitForFunction(
        (before) => document.querySelectorAll('#chat-log .chat-message').length > before,
        { timeout: 10000 },
        beforeCount
    );
}

async function getChatMessageCount(page) {
    return page.evaluate(() => document.querySelectorAll('#chat-log .chat-message').length);
}

async function getLatestChatHeader(page) {
    return page.evaluate(() => {
        const msgs = document.querySelectorAll('#chat-log .chat-message');
        if (!msgs.length) return null;
        const h = msgs[msgs.length - 1].querySelector('.message-header h4');
        return h?.textContent?.trim() || null;
    });
}


// ============================================================
// TEST SUITE
// ============================================================

export default function gadgetSheetRollingTests(test, expect) {

    // ----------------------------------------------------------
    // R1: Roll button on gadget sheet with AV/EV
    // ----------------------------------------------------------
    test('R1: Gadget sheet with AV/EV shows roll button', async ({ page }) => {
        await page.goto(FOUNDRY_URL);
        await waitForGameReady(page);

        const data = await createTestActor(page, TEST_ACTOR_PREFIX + 'R1', [
            { name: 'TestWeapon', av: 6, ev: 8 },
        ]);
        try {
            await openGadgetSheet(page, data.actorId, data.gadgetIds['TestWeapon']);
            const hasBtn = await hasGadgetSheetRollButton(page);
            expect(hasBtn).toBe(true);
        } finally {
            await closeAll(page);
            await deleteTestActor(page, data.actorId);
        }
    });

    // ----------------------------------------------------------
    // R2: Roll button on gadget sheet with child powers
    // ----------------------------------------------------------
    test('R2: Gadget sheet with child power shows roll button', async ({ page }) => {
        await page.goto(FOUNDRY_URL);
        await waitForGameReady(page);

        const data = await createTestActor(page, TEST_ACTOR_PREFIX + 'R2', [
            {
                name: 'TestDevice',
                powers: [{ name: 'EnergyBlast', aps: 8, link: 'dex', source: 'physical' }],
            },
        ]);
        try {
            await openGadgetSheet(page, data.actorId, data.gadgetIds['TestDevice']);
            const hasBtn = await hasGadgetSheetRollButton(page);
            expect(hasBtn).toBe(true);
        } finally {
            await closeAll(page);
            await deleteTestActor(page, data.actorId);
        }
    });

    // ----------------------------------------------------------
    // R3: Roll button on gadget sheet with attributes
    // ----------------------------------------------------------
    test('R3: Gadget sheet with DEX/STR attributes shows roll button', async ({ page }) => {
        await page.goto(FOUNDRY_URL);
        await waitForGameReady(page);

        const data = await createTestActor(page, TEST_ACTOR_PREFIX + 'R3', [
            {
                name: 'TestSuit',
                attrs: { dex: 7, str: 9 },
                hasAttributes: { physical: 'true', mental: 'false', mystical: 'false' },
            },
        ]);
        try {
            await openGadgetSheet(page, data.actorId, data.gadgetIds['TestSuit']);
            const hasBtn = await hasGadgetSheetRollButton(page);
            expect(hasBtn).toBe(true);
        } finally {
            await closeAll(page);
            await deleteTestActor(page, data.actorId);
        }
    });

    // ----------------------------------------------------------
    // R4: No roll button when no rollable options
    // ----------------------------------------------------------
    test('R4: Gadget sheet with no rollable options hides roll button', async ({ page }) => {
        await page.goto(FOUNDRY_URL);
        await waitForGameReady(page);

        const data = await createTestActor(page, TEST_ACTOR_PREFIX + 'R4', [
            {
                name: 'TestContainer',
                attrs: { body: 5 },
                hasAttributes: { physical: 'true', mental: 'false', mystical: 'false' },
            },
        ]);
        try {
            await openGadgetSheet(page, data.actorId, data.gadgetIds['TestContainer']);
            const hasBtn = await hasGadgetSheetRollButton(page);
            expect(hasBtn).toBe(false);
        } finally {
            await closeAll(page);
            await deleteTestActor(page, data.actorId);
        }
    });

    // ----------------------------------------------------------
    // R5: Single option goes directly to roll dialog
    // ----------------------------------------------------------
    test('R5: Single roll option opens roll dialog directly', async ({ page }) => {
        await page.goto(FOUNDRY_URL);
        await waitForGameReady(page);

        const data = await createTestActor(page, TEST_ACTOR_PREFIX + 'R5', [
            { name: 'TestGun', av: 4, ev: 7 },
        ]);
        try {
            await openGadgetSheet(page, data.actorId, data.gadgetIds['TestGun']);
            await clickGadgetSheetRollButton(page);
            await waitForRollDialog(page);

            const isRoll = await isRollDialogOpen(page);
            expect(isRoll).toBe(true);

            const values = await getRollDialogValues(page);
            expect(values.actionValue).toBe(4);
            expect(values.effectValue).toBe(7);

            await closeRollDialog(page);
        } finally {
            await closeAll(page);
            await deleteTestActor(page, data.actorId);
        }
    });

    // ----------------------------------------------------------
    // R6: Multiple options open picker dialog
    // ----------------------------------------------------------
    test('R6: Multiple roll options opens picker dialog', async ({ page }) => {
        await page.goto(FOUNDRY_URL);
        await waitForGameReady(page);

        const data = await createTestActor(page, TEST_ACTOR_PREFIX + 'R6', [
            {
                name: 'TestMulti',
                av: 5, ev: 5,
                powers: [{ name: 'HeatVision', aps: 10, link: 'dex', source: 'physical' }],
            },
        ]);
        try {
            await openGadgetSheet(page, data.actorId, data.gadgetIds['TestMulti']);
            await clickGadgetSheetRollButton(page);

            await page.waitForFunction(() => {
                for (const d of document.querySelectorAll('.dialog .megs-dialog')) {
                    if (d.querySelector('input[name="selectedOption"]')) return true;
                }
                return false;
            }, { timeout: 5000 });

            const isPicker = await isPickerDialogOpen(page);
            expect(isPicker).toBe(true);

            const options = await getPickerOptions(page);
            expect(options.length).toBeGreaterThanOrEqual(2);
        } finally {
            await closeAll(page);
            await deleteTestActor(page, data.actorId);
        }
    });

    // ----------------------------------------------------------
    // R7: Roll button tooltip shows option info
    // ----------------------------------------------------------
    test('R7: Roll button tooltip indicates rollable options', async ({ page }) => {
        await page.goto(FOUNDRY_URL);
        await waitForGameReady(page);

        const data = await createTestActor(page, TEST_ACTOR_PREFIX + 'R7', [
            { name: 'TestBlaster', av: 6, ev: 8 },
        ]);
        try {
            await openGadgetSheet(page, data.actorId, data.gadgetIds['TestBlaster']);
            const tooltip = await getGadgetSheetRollTooltip(page);
            expect(tooltip).not.toBeNull();
            expect(tooltip).toContain('TestBlaster');
        } finally {
            await closeAll(page);
            await deleteTestActor(page, data.actorId);
        }
    });

    // ----------------------------------------------------------
    // R8: Roll from gadget sheet produces chat message
    // ----------------------------------------------------------
    test('R8: Rolling from gadget sheet produces chat message with gadget name', async ({ page }) => {
        await page.goto(FOUNDRY_URL);
        await waitForGameReady(page);

        const data = await createTestActor(page, TEST_ACTOR_PREFIX + 'R8', [
            { name: 'TestRifle', av: 5, ev: 6 },
        ]);
        try {
            await openGadgetSheet(page, data.actorId, data.gadgetIds['TestRifle']);
            const beforeCount = await getChatMessageCount(page);

            await clickGadgetSheetRollButton(page);
            await waitForRollDialog(page);
            await submitRollDialog(page, beforeCount);

            const header = await getLatestChatHeader(page);
            expect(header).not.toBeNull();
            expect(header).toContain('TestRifle');
        } finally {
            await closeAll(page);
            await deleteTestActor(page, data.actorId);
        }
    });

    // ----------------------------------------------------------
    // R9: Picker options match available gadget abilities
    // ----------------------------------------------------------
    test('R9: Picker dialog lists all rollable options from gadget', async ({ page }) => {
        await page.goto(FOUNDRY_URL);
        await waitForGameReady(page);

        const data = await createTestActor(page, TEST_ACTOR_PREFIX + 'R9', [
            {
                name: 'TestMultiAbility',
                av: 3, ev: 3,
                attrs: { dex: 6, str: 8 },
                hasAttributes: { physical: 'true', mental: 'false', mystical: 'false' },
                powers: [{ name: 'Flame', aps: 7, link: 'dex', source: 'physical' }],
            },
        ]);
        try {
            await openGadgetSheet(page, data.actorId, data.gadgetIds['TestMultiAbility']);
            await clickGadgetSheetRollButton(page);

            await page.waitForFunction(() => {
                for (const d of document.querySelectorAll('.dialog .megs-dialog')) {
                    if (d.querySelector('input[name="selectedOption"]')) return true;
                }
                return false;
            }, { timeout: 5000 });

            const options = await getPickerOptions(page);
            const optionTexts = options.join(' ');

            // Should have AV/EV option, power option, and attribute pair option
            expect(options.length).toBeGreaterThanOrEqual(3);
            expect(optionTexts).toContain('Flame');
            expect(optionTexts).toContain('DEX/STR');
        } finally {
            await closeAll(page);
            await deleteTestActor(page, data.actorId);
        }
    });
}
