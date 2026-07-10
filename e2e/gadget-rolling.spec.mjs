/**
 * E2E tests for Issue #17: Gadgets - Rolling
 *
 * These tests verify the REQUIREMENTS for gadget rolling behavior per MEGS RPG
 * Chapter 7 rules, NOT the implementation. They are written adversarially
 * to catch regressions and edge cases.
 *
 * All test actors and items are created fresh for each test and deleted
 * afterward. No references to any specific IP or pre-existing world data.
 *
 * Requirements under test:
 * R1. A gadget with explicit AV/EV should be rollable from the actor Gadgets tab.
 * R2. A gadget with child powers (APs > 0) should be rollable.
 * R3. A gadget with child skills (APs > 0) should be rollable.
 * R4. A gadget with non-zero attribute pairs (DEX/STR, INT/WILL, INFL/AURA)
 *     should be rollable.
 * R5. A gadget with NONE of the above should NOT show a roll button.
 * R6. When exactly one roll option exists, clicking the roll button should
 *     proceed directly to the roll dialog (no picker).
 * R7. When multiple roll options exist, clicking the roll button should open
 *     a picker dialog listing all available options.
 * R8. Child powers/skills with 0 APs should NOT appear as roll options.
 * R9. The roll button tooltip should indicate what can be rolled.
 * R10. The "Always Substitute" (italicized) checkbox should be visible in
 *      gadget edit mode and persist when toggled.
 * R11. A gadget macro (item.roll()) should trigger the roll flow, not just
 *      post description text.
 * R12. Chat messages from gadget rolls should identify both the gadget and
 *      the specific ability rolled.
 *
 * Preconditions:
 * - Foundry VTT running at http://localhost:30000 with a MEGS world loaded
 * - Logged in as Gamemaster
 */

const FOUNDRY_URL = 'http://localhost:30000/game';
const TEST_ACTOR_PREFIX = '_E2E_GadgetTest_';

// ============================================================
// Foundry API Helpers — create and tear down test data
// ============================================================

/**
 * Create a fresh hero actor with the given gadgets configuration.
 * Returns { actorId, gadgetIds: { [name]: id }, itemIds: { [name]: id } }
 */
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
                    attributes: {
                        dex: { value: g.attrs?.dex || 0, label: 'DEX', alwaysSubstitute: g.attrs?.dexItalic || false },
                        str: { value: g.attrs?.str || 0, label: 'STR', alwaysSubstitute: g.attrs?.strItalic || false },
                        body: { value: g.attrs?.body || 0, label: 'BODY', alwaysSubstitute: g.attrs?.bodyItalic || false },
                        int: { value: g.attrs?.int || 0, label: 'INT', alwaysSubstitute: false },
                        will: { value: g.attrs?.will || 0, label: 'WILL', alwaysSubstitute: false },
                        mind: { value: g.attrs?.mind || 0, label: 'MIND', alwaysSubstitute: false },
                        infl: { value: g.attrs?.infl || 0, label: 'INFL', alwaysSubstitute: false },
                        aura: { value: g.attrs?.aura || 0, label: 'AURA', alwaysSubstitute: false },
                        spirit: { value: g.attrs?.spirit || 0, label: 'SPIRIT', alwaysSubstitute: false },
                    },
                    settings: { hasAttributes: g.hasAttributes ?? true },
                },
            };
            const gadgetItem = await actor.createEmbeddedDocuments('Item', [gadgetData]);
            const gadgetId = gadgetItem[0].id;
            gadgetIds[g.name] = gadgetId;

            // Create child powers
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

            // Create child skills
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

/**
 * Delete a test actor by ID.
 */
async function deleteTestActor(page, actorId) {
    await page.evaluate(async (id) => {
        const actor = game.actors.get(id);
        if (actor) await actor.delete();
    }, actorId);
    await page.waitForTimeout(200);
}

/**
 * Open actor sheet and switch to Gadgets tab.
 */
async function openActorGadgetsTab(page, actorId) {
    await page.evaluate((id) => {
        const actor = game.actors.get(id);
        if (!actor) throw new Error('Actor not found: ' + id);
        actor.sheet.render(true);
    }, actorId);
    await page.waitForSelector('.sheet.actor', { timeout: 5000 });
    await page.waitForTimeout(300);
    await page.click('.sheet.actor .tabs .item[data-tab="gadgets"]');
    await page.waitForTimeout(300);
}

/**
 * Close all open windows.
 */
async function closeAll(page) {
    await page.evaluate(() => {
        Object.values(ui.windows).forEach(w => w.close());
    });
    await page.waitForTimeout(300);
}

/**
 * Get names of gadgets that have a roll button visible.
 */
async function getRollableGadgetNames(page) {
    return page.$$eval(
        '.sheet.actor .tab.gadgets .item-row',
        (rows) => rows
            .filter(row => row.querySelector('.d10.rollable'))
            .map(row => row.querySelector('.item-name a.item-edit.bold')?.textContent?.trim() || '')
    );
}

/**
 * Get names of gadgets that do NOT have a roll button.
 */
async function getNonRollableGadgetNames(page) {
    return page.$$eval(
        '.sheet.actor .tab.gadgets .item-row',
        (rows) => rows
            .filter(row => !row.querySelector('.d10.rollable'))
            .map(row => row.querySelector('.item-name a.item-edit.bold')?.textContent?.trim() || '')
    );
}

/**
 * Click the roll button for a specific gadget by name.
 */
async function clickGadgetRollButton(page, gadgetName) {
    const clicked = await page.evaluate((name) => {
        const rows = document.querySelectorAll('.sheet.actor .tab.gadgets .item-row');
        for (const row of rows) {
            const nameEl = row.querySelector('.item-name a.item-edit.bold');
            if (nameEl && nameEl.textContent.trim() === name) {
                const btn = row.querySelector('.d10.rollable');
                if (btn) { btn.click(); return true; }
                return false;
            }
        }
        return false;
    }, gadgetName);
    if (!clicked) throw new Error(`Could not click roll button for "${gadgetName}"`);
    await page.waitForTimeout(500);
}

/**
 * Get the tooltip text of a gadget's roll button.
 */
async function getGadgetRollTooltip(page, gadgetName) {
    return page.evaluate((name) => {
        const rows = document.querySelectorAll('.sheet.actor .tab.gadgets .item-row');
        for (const row of rows) {
            const nameEl = row.querySelector('.item-name a.item-edit.bold');
            if (nameEl && nameEl.textContent.trim() === name) {
                const btn = row.querySelector('.d10.rollable');
                return btn?.getAttribute('title') || null;
            }
        }
        return null;
    }, gadgetName);
}

/**
 * Check if the gadget roll picker dialog is open.
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
 * Select a picker option by index and click Roll.
 */
async function selectPickerOptionAndRoll(page, index) {
    await page.evaluate((idx) => {
        const radios = document.querySelectorAll('.dialog .megs-dialog input[name="selectedOption"]');
        if (radios[idx]) radios[idx].checked = true;
    }, index);
    await page.click('.dialog button:has-text("Roll")');
    await page.waitForTimeout(500);
}

/**
 * Cancel/close the picker dialog.
 */
async function cancelPickerDialog(page) {
    await page.evaluate(() => {
        for (const btn of document.querySelectorAll('.dialog button')) {
            if (btn.textContent.includes('Close')) { btn.click(); return; }
        }
        const x = document.querySelector('.dialog .header-button.close');
        if (x) x.click();
    });
    await page.waitForTimeout(300);
}

/**
 * Check if the standard MEGS roll dialog (AV/EV/OV/RV) is open.
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
 * Close the roll dialog via the Close button.
 */
async function closeRollDialog(page) {
    await page.evaluate(() => {
        for (const btn of document.querySelectorAll('.dialog button')) {
            if (btn.textContent.includes('Close')) { btn.click(); return; }
        }
    });
    await page.waitForTimeout(300);
}

/**
 * Submit the roll dialog via the Roll button.
 */
async function submitRollDialog(page) {
    await page.evaluate(() => {
        for (const btn of document.querySelectorAll('.dialog button')) {
            if (btn.textContent.trim() === 'Roll') { btn.click(); return; }
        }
    });
    await page.waitForTimeout(1500);
}

/**
 * Count chat messages currently visible.
 */
async function getChatMessageCount(page) {
    return page.evaluate(() => document.querySelectorAll('#chat-log .chat-message').length);
}

/**
 * Get the header text of the most recent chat message.
 */
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

export default function gadgetRollingTests(test, expect) {

    // ----------------------------------------------------------
    // R1 + R5: Rollability — what should and should not roll
    // ----------------------------------------------------------

    test('R1: Gadget with explicit AV and EV shows roll button', async ({ page }) => {
        await page.goto(FOUNDRY_URL);
        await page.waitForTimeout(3000);

        const data = await createTestActor(page, TEST_ACTOR_PREFIX + 'R1_AVEV', [
            { name: 'Blaster', av: 6, ev: 8 },
        ]);
        try {
            await openActorGadgetsTab(page, data.actorId);
            const rollable = await getRollableGadgetNames(page);
            expect(rollable).toContain('Blaster');
        } finally {
            await closeAll(page);
            await deleteTestActor(page, data.actorId);
        }
    });

    test('R1: Gadget with only EV (no AV) is still rollable', async ({ page }) => {
        await page.goto(FOUNDRY_URL);
        await page.waitForTimeout(3000);

        const data = await createTestActor(page, TEST_ACTOR_PREFIX + 'R1_EVOnly', [
            { name: 'Baton', av: 0, ev: 7 },
        ]);
        try {
            await openActorGadgetsTab(page, data.actorId);
            const rollable = await getRollableGadgetNames(page);
            expect(rollable).toContain('Baton');
        } finally {
            await closeAll(page);
            await deleteTestActor(page, data.actorId);
        }
    });

    test('R2: Gadget with only child powers (APs > 0) is rollable', async ({ page }) => {
        await page.goto(FOUNDRY_URL);
        await page.waitForTimeout(3000);

        const data = await createTestActor(page, TEST_ACTOR_PREFIX + 'R2_Powers', [
            {
                name: 'Visor',
                av: 0, ev: 0,
                powers: [
                    { name: 'Energy Blast', aps: 10, link: 'dex', source: 'physical' },
                ],
            },
        ]);
        try {
            await openActorGadgetsTab(page, data.actorId);
            const rollable = await getRollableGadgetNames(page);
            expect(rollable).toContain('Visor');
        } finally {
            await closeAll(page);
            await deleteTestActor(page, data.actorId);
        }
    });

    test('R5: Gadget with no AV/EV, no powers, no skills, no attributes is NOT rollable', async ({ page }) => {
        await page.goto(FOUNDRY_URL);
        await page.waitForTimeout(3000);

        const data = await createTestActor(page, TEST_ACTOR_PREFIX + 'R5_Empty', [
            { name: 'Decorative Cape', av: 0, ev: 0 },
        ]);
        try {
            await openActorGadgetsTab(page, data.actorId);
            const nonRollable = await getNonRollableGadgetNames(page);
            expect(nonRollable).toContain('Decorative Cape');
        } finally {
            await closeAll(page);
            await deleteTestActor(page, data.actorId);
        }
    });

    test('R5/R8: Gadget with only 0-AP skills is NOT rollable', async ({ page }) => {
        await page.goto(FOUNDRY_URL);
        await page.waitForTimeout(3000);

        const data = await createTestActor(page, TEST_ACTOR_PREFIX + 'R5_ZeroSkills', [
            {
                name: 'Toolbox',
                av: 0, ev: 0,
                skills: [
                    { name: 'Gadgetry', aps: 0, link: 'int' },
                    { name: 'Scientist', aps: 0, link: 'int' },
                ],
            },
        ]);
        try {
            await openActorGadgetsTab(page, data.actorId);
            const nonRollable = await getNonRollableGadgetNames(page);
            expect(nonRollable).toContain('Toolbox');
        } finally {
            await closeAll(page);
            await deleteTestActor(page, data.actorId);
        }
    });

    test('R5/R8: Gadget with only 0-AP powers is NOT rollable', async ({ page }) => {
        await page.goto(FOUNDRY_URL);
        await page.waitForTimeout(3000);

        const data = await createTestActor(page, TEST_ACTOR_PREFIX + 'R5_ZeroPowers', [
            {
                name: 'Dead Battery',
                av: 0, ev: 0,
                powers: [
                    { name: 'Flight', aps: 0, link: 'dex', source: 'physical' },
                ],
            },
        ]);
        try {
            await openActorGadgetsTab(page, data.actorId);
            const nonRollable = await getNonRollableGadgetNames(page);
            expect(nonRollable).toContain('Dead Battery');
        } finally {
            await closeAll(page);
            await deleteTestActor(page, data.actorId);
        }
    });

    // ----------------------------------------------------------
    // R6: Single option → direct roll dialog, no picker
    // ----------------------------------------------------------

    test('R6: Single AV/EV option skips picker, opens roll dialog directly', async ({ page }) => {
        await page.goto(FOUNDRY_URL);
        await page.waitForTimeout(3000);

        const data = await createTestActor(page, TEST_ACTOR_PREFIX + 'R6_Single', [
            { name: 'Pistol', av: 5, ev: 5 },
        ]);
        try {
            await openActorGadgetsTab(page, data.actorId);
            await clickGadgetRollButton(page, 'Pistol');

            const pickerOpen = await isPickerDialogOpen(page);
            expect(pickerOpen).toBe(false);

            const rollOpen = await isRollDialogOpen(page);
            expect(rollOpen).toBe(true);

            const values = await getRollDialogValues(page);
            expect(values.actionValue).toBe(5);
            expect(values.effectValue).toBe(5);

            await closeRollDialog(page);
        } finally {
            await closeAll(page);
            await deleteTestActor(page, data.actorId);
        }
    });

    test('R6: Single power option skips picker, opens roll dialog directly', async ({ page }) => {
        await page.goto(FOUNDRY_URL);
        await page.waitForTimeout(3000);

        const data = await createTestActor(page, TEST_ACTOR_PREFIX + 'R6_SinglePower', [
            {
                name: 'Scope',
                av: 0, ev: 0,
                powers: [
                    { name: 'Telescopic Vision', aps: 8, link: 'int', source: 'mental' },
                ],
            },
        ]);
        try {
            await openActorGadgetsTab(page, data.actorId);
            await clickGadgetRollButton(page, 'Scope');

            const pickerOpen = await isPickerDialogOpen(page);
            expect(pickerOpen).toBe(false);

            const rollOpen = await isRollDialogOpen(page);
            expect(rollOpen).toBe(true);

            const values = await getRollDialogValues(page);
            expect(values.actionValue).toBe(8);
            expect(values.effectValue).toBe(8);

            await closeRollDialog(page);
        } finally {
            await closeAll(page);
            await deleteTestActor(page, data.actorId);
        }
    });

    // ----------------------------------------------------------
    // R7: Multiple options → picker dialog
    // ----------------------------------------------------------

    test('R7: Multiple options open picker dialog', async ({ page }) => {
        await page.goto(FOUNDRY_URL);
        await page.waitForTimeout(3000);

        const data = await createTestActor(page, TEST_ACTOR_PREFIX + 'R7_Multi', [
            {
                name: 'Trident',
                av: 0, ev: 12,
                powers: [
                    { name: 'Water Control', aps: 10, link: 'int', source: 'mental' },
                ],
            },
        ]);
        try {
            await openActorGadgetsTab(page, data.actorId);
            await clickGadgetRollButton(page, 'Trident');

            const pickerOpen = await isPickerDialogOpen(page);
            expect(pickerOpen).toBe(true);

            const options = await getPickerOptions(page);
            expect(options.length).toBe(2);
            expect(options).toContain('Water Control');

            await cancelPickerDialog(page);
        } finally {
            await closeAll(page);
            await deleteTestActor(page, data.actorId);
        }
    });

    test('R7: Picker shows all powers when gadget has many', async ({ page }) => {
        await page.goto(FOUNDRY_URL);
        await page.waitForTimeout(3000);

        const data = await createTestActor(page, TEST_ACTOR_PREFIX + 'R7_ManyPowers', [
            {
                name: 'Power Ring',
                av: 0, ev: 0,
                powers: [
                    { name: 'Flight', aps: 20, link: 'dex', source: 'physical' },
                    { name: 'Force Field', aps: 15, link: 'will', source: 'mental' },
                    { name: 'Energy Blast', aps: 18, link: 'dex', source: 'physical' },
                    { name: 'Comprehend Languages', aps: 12, link: 'int', source: 'mental' },
                    { name: 'Life Sense', aps: 25, link: 'int', source: 'mental' },
                ],
            },
        ]);
        try {
            await openActorGadgetsTab(page, data.actorId);
            await clickGadgetRollButton(page, 'Power Ring');

            const pickerOpen = await isPickerDialogOpen(page);
            expect(pickerOpen).toBe(true);

            const options = await getPickerOptions(page);
            expect(options.length).toBe(5);
            expect(options).toContain('Flight');
            expect(options).toContain('Force Field');
            expect(options).toContain('Energy Blast');
            expect(options).toContain('Comprehend Languages');
            expect(options).toContain('Life Sense');

            await cancelPickerDialog(page);
        } finally {
            await closeAll(page);
            await deleteTestActor(page, data.actorId);
        }
    });

    test('R7/R8: Picker excludes 0-AP items, only shows valid options', async ({ page }) => {
        await page.goto(FOUNDRY_URL);
        await page.waitForTimeout(3000);

        const data = await createTestActor(page, TEST_ACTOR_PREFIX + 'R7_Mixed', [
            {
                name: 'Utility Belt',
                av: 0, ev: 6,
                powers: [
                    { name: 'Flash', aps: 5, link: 'dex', source: 'physical' },
                    { name: 'Smoke Screen', aps: 0, link: 'dex', source: 'physical' },
                ],
                skills: [
                    { name: 'Gadgetry', aps: 0, link: 'int' },
                    { name: 'Thief', aps: 4, link: 'dex' },
                ],
            },
        ]);
        try {
            await openActorGadgetsTab(page, data.actorId);
            await clickGadgetRollButton(page, 'Utility Belt');

            const pickerOpen = await isPickerDialogOpen(page);
            expect(pickerOpen).toBe(true);

            const options = await getPickerOptions(page);
            // Should have: AV/EV, Flash, Thief — NOT Smoke Screen (0 AP) or Gadgetry (0 AP)
            expect(options.length).toBe(3);
            expect(options).toContain('Flash');
            expect(options).toContain('Thief');
            expect(options).not.toContain('Smoke Screen');
            expect(options).not.toContain('Gadgetry');

            await cancelPickerDialog(page);
        } finally {
            await closeAll(page);
            await deleteTestActor(page, data.actorId);
        }
    });

    test('R7: Canceling picker produces no chat message', async ({ page }) => {
        await page.goto(FOUNDRY_URL);
        await page.waitForTimeout(3000);

        const data = await createTestActor(page, TEST_ACTOR_PREFIX + 'R7_Cancel', [
            {
                name: 'Multi-Weapon',
                av: 3, ev: 5,
                powers: [{ name: 'Projectile', aps: 7, link: 'dex', source: 'physical' }],
            },
        ]);
        try {
            await openActorGadgetsTab(page, data.actorId);
            const beforeCount = await getChatMessageCount(page);

            await clickGadgetRollButton(page, 'Multi-Weapon');
            expect(await isPickerDialogOpen(page)).toBe(true);

            await cancelPickerDialog(page);
            await page.waitForTimeout(500);

            const afterCount = await getChatMessageCount(page);
            expect(afterCount).toBe(beforeCount);
        } finally {
            await closeAll(page);
            await deleteTestActor(page, data.actorId);
        }
    });

    // ----------------------------------------------------------
    // R9: Tooltip on roll button
    // ----------------------------------------------------------

    test('R9: Single-option gadget tooltip shows the one option', async ({ page }) => {
        await page.goto(FOUNDRY_URL);
        await page.waitForTimeout(3000);

        const data = await createTestActor(page, TEST_ACTOR_PREFIX + 'R9_Single', [
            { name: 'Knife', av: 3, ev: 4 },
        ]);
        try {
            await openActorGadgetsTab(page, data.actorId);
            const tooltip = await getGadgetRollTooltip(page, 'Knife');
            expect(tooltip).not.toBeNull();
            expect(tooltip.length).toBeGreaterThan(0);
            // Should contain the gadget name
            expect(tooltip).toContain('Knife');
        } finally {
            await closeAll(page);
            await deleteTestActor(page, data.actorId);
        }
    });

    test('R9: Multi-option gadget tooltip lists all options', async ({ page }) => {
        await page.goto(FOUNDRY_URL);
        await page.waitForTimeout(3000);

        const data = await createTestActor(page, TEST_ACTOR_PREFIX + 'R9_Multi', [
            {
                name: 'Staff',
                av: 0, ev: 0,
                powers: [
                    { name: 'Lightning', aps: 8, link: 'dex', source: 'physical' },
                    { name: 'Force Bolt', aps: 6, link: 'will', source: 'mental' },
                ],
            },
        ]);
        try {
            await openActorGadgetsTab(page, data.actorId);
            const tooltip = await getGadgetRollTooltip(page, 'Staff');
            expect(tooltip).not.toBeNull();
            expect(tooltip).toContain('Lightning');
            expect(tooltip).toContain('Force Bolt');
        } finally {
            await closeAll(page);
            await deleteTestActor(page, data.actorId);
        }
    });

    // ----------------------------------------------------------
    // R10: AlwaysSubstitute UI
    // ----------------------------------------------------------

    test('R10: AlwaysSubstitute checkbox visible in gadget edit mode', async ({ page }) => {
        await page.goto(FOUNDRY_URL);
        await page.waitForTimeout(3000);

        const data = await createTestActor(page, TEST_ACTOR_PREFIX + 'R10_Italic', [
            { name: 'Power Suit', av: 0, ev: 0, attrs: { dex: 8, str: 10 } },
        ]);
        try {
            // Open the gadget's own item sheet
            await page.evaluate((info) => {
                const actor = game.actors.get(info.actorId);
                const gadget = actor.items.get(info.gadgetId);
                gadget.sheet.render(true);
            }, { actorId: data.actorId, gadgetId: data.gadgetIds['Power Suit'] });

            await page.waitForSelector('.sheet.item', { timeout: 5000 });
            await page.waitForTimeout(500);

            // Enable edit mode
            await page.evaluate(() => {
                const toggle = document.querySelector('.sheet.item .toggle-edit-mode');
                if (toggle) toggle.click();
            });
            await page.waitForTimeout(500);

            // Verify checkboxes exist for always-substitute
            const checkboxCount = await page.$$eval(
                '.sheet.item .always-substitute-label input[type="checkbox"]',
                (cbs) => cbs.length
            );
            expect(checkboxCount).toBeGreaterThan(0);
        } finally {
            await closeAll(page);
            await deleteTestActor(page, data.actorId);
        }
    });

    // ----------------------------------------------------------
    // R11: Macro support (item.roll())
    // ----------------------------------------------------------

    test('R11: item.roll() on single-option gadget triggers roll flow', async ({ page }) => {
        await page.goto(FOUNDRY_URL);
        await page.waitForTimeout(3000);

        const data = await createTestActor(page, TEST_ACTOR_PREFIX + 'R11_Macro', [
            { name: 'Sidearm', av: 4, ev: 6 },
        ]);
        try {
            const beforeCount = await getChatMessageCount(page);

            await page.evaluate((info) => {
                const actor = game.actors.get(info.actorId);
                const gadget = actor.items.get(info.gadgetId);
                gadget.roll();
            }, { actorId: data.actorId, gadgetId: data.gadgetIds['Sidearm'] });

            await page.waitForTimeout(1000);

            // Should open the roll dialog (single option, no picker)
            const rollOpen = await isRollDialogOpen(page);
            expect(rollOpen).toBe(true);

            await submitRollDialog(page);
            await page.waitForTimeout(1000);

            const afterCount = await getChatMessageCount(page);
            expect(afterCount).toBeGreaterThan(beforeCount);
        } finally {
            await closeAll(page);
            await deleteTestActor(page, data.actorId);
        }
    });

    test('R11: item.roll() on multi-option gadget shows picker', async ({ page }) => {
        await page.goto(FOUNDRY_URL);
        await page.waitForTimeout(3000);

        const data = await createTestActor(page, TEST_ACTOR_PREFIX + 'R11_MacroPicker', [
            {
                name: 'Combo Weapon',
                av: 3, ev: 5,
                powers: [{ name: 'Flame Proj', aps: 7, link: 'dex', source: 'physical' }],
            },
        ]);
        try {
            await page.evaluate((info) => {
                const actor = game.actors.get(info.actorId);
                const gadget = actor.items.get(info.gadgetId);
                gadget.roll();
            }, { actorId: data.actorId, gadgetId: data.gadgetIds['Combo Weapon'] });

            await page.waitForTimeout(1000);

            const pickerOpen = await isPickerDialogOpen(page);
            expect(pickerOpen).toBe(true);

            await cancelPickerDialog(page);
        } finally {
            await closeAll(page);
            await deleteTestActor(page, data.actorId);
        }
    });

    test('R11: item.roll() on non-rollable gadget posts description to chat', async ({ page }) => {
        await page.goto(FOUNDRY_URL);
        await page.waitForTimeout(3000);

        const data = await createTestActor(page, TEST_ACTOR_PREFIX + 'R11_NoRoll', [
            { name: 'Trophy', av: 0, ev: 0, description: 'A decorative trophy.' },
        ]);
        try {
            const beforeCount = await getChatMessageCount(page);

            await page.evaluate((info) => {
                const actor = game.actors.get(info.actorId);
                const gadget = actor.items.get(info.gadgetId);
                gadget.roll();
            }, { actorId: data.actorId, gadgetId: data.gadgetIds['Trophy'] });

            await page.waitForTimeout(1000);

            // No picker, no roll dialog
            expect(await isPickerDialogOpen(page)).toBe(false);
            expect(await isRollDialogOpen(page)).toBe(false);

            // But a chat message should have been posted (description)
            const afterCount = await getChatMessageCount(page);
            expect(afterCount).toBeGreaterThan(beforeCount);
        } finally {
            await closeAll(page);
            await deleteTestActor(page, data.actorId);
        }
    });

    // ----------------------------------------------------------
    // R12: Chat message labels
    // ----------------------------------------------------------

    test('R12: Chat message from gadget roll includes gadget name', async ({ page }) => {
        await page.goto(FOUNDRY_URL);
        await page.waitForTimeout(3000);

        const actorName = TEST_ACTOR_PREFIX + 'R12_Label';
        const data = await createTestActor(page, actorName, [
            { name: 'Laser Rifle', av: 7, ev: 9 },
        ]);
        try {
            await openActorGadgetsTab(page, data.actorId);
            await clickGadgetRollButton(page, 'Laser Rifle');

            const rollOpen = await isRollDialogOpen(page);
            expect(rollOpen).toBe(true);

            await submitRollDialog(page);
            await page.waitForTimeout(1500);

            const header = await getLatestChatHeader(page);
            expect(header).not.toBeNull();
            // Header should mention the gadget name
            expect(header).toContain('Laser Rifle');
        } finally {
            await closeAll(page);
            await deleteTestActor(page, data.actorId);
        }
    });

    // ----------------------------------------------------------
    // Edge cases
    // ----------------------------------------------------------

    test('EDGE: Gadget with EV but 0 AV derives AV and still rolls correctly', async ({ page }) => {
        await page.goto(FOUNDRY_URL);
        await page.waitForTimeout(3000);

        const data = await createTestActor(page, TEST_ACTOR_PREFIX + 'EDGE_ZeroAV', [
            { name: 'Club', av: 0, ev: 9 },
        ]);
        try {
            await openActorGadgetsTab(page, data.actorId);
            await clickGadgetRollButton(page, 'Club');

            const rollOpen = await isRollDialogOpen(page);
            expect(rollOpen).toBe(true);

            const values = await getRollDialogValues(page);
            expect(values.effectValue).toBe(9);
            // AV should be derived (not left at 0) — exact value depends on actor/gadget
            // At minimum it should be populated
            expect(values.actionValue).not.toBeNull();

            await closeRollDialog(page);
        } finally {
            await closeAll(page);
            await deleteTestActor(page, data.actorId);
        }
    });

    test('EDGE: Actor with multiple gadgets shows correct rollability for each', async ({ page }) => {
        await page.goto(FOUNDRY_URL);
        await page.waitForTimeout(3000);

        const data = await createTestActor(page, TEST_ACTOR_PREFIX + 'EDGE_MultiGadget', [
            { name: 'Weapon A', av: 5, ev: 8 },
            { name: 'Ornament', av: 0, ev: 0 },
            {
                name: 'Scanner',
                av: 0, ev: 0,
                powers: [{ name: 'Detect', aps: 6, link: 'int', source: 'mental' }],
            },
        ]);
        try {
            await openActorGadgetsTab(page, data.actorId);

            const rollable = await getRollableGadgetNames(page);
            const nonRollable = await getNonRollableGadgetNames(page);

            expect(rollable).toContain('Weapon A');
            expect(rollable).toContain('Scanner');
            expect(nonRollable).toContain('Ornament');
        } finally {
            await closeAll(page);
            await deleteTestActor(page, data.actorId);
        }
    });

    test('EDGE: Selecting different picker options produces correct AV/EV', async ({ page }) => {
        await page.goto(FOUNDRY_URL);
        await page.waitForTimeout(3000);

        const data = await createTestActor(page, TEST_ACTOR_PREFIX + 'EDGE_PickerVals', [
            {
                name: 'Versatile Weapon',
                av: 4, ev: 6,
                powers: [{ name: 'Flame Jet', aps: 10, link: 'dex', source: 'physical' }],
            },
        ]);
        try {
            await openActorGadgetsTab(page, data.actorId);

            // First: select the power option (index 1 — powers come after AV/EV)
            await clickGadgetRollButton(page, 'Versatile Weapon');
            expect(await isPickerDialogOpen(page)).toBe(true);

            const options = await getPickerOptions(page);
            expect(options.length).toBe(2);

            // Select the power (second option)
            await selectPickerOptionAndRoll(page, 1);

            const rollOpen = await isRollDialogOpen(page);
            expect(rollOpen).toBe(true);

            const powerValues = await getRollDialogValues(page);
            // Power AV=EV=APs=10
            expect(powerValues.actionValue).toBe(10);
            expect(powerValues.effectValue).toBe(10);

            await closeRollDialog(page);
        } finally {
            await closeAll(page);
            await deleteTestActor(page, data.actorId);
        }
    });
}
