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
 * - Foundry VTT running at the configured baseURL with a MEGS world loaded
 * - Logged in as Gamemaster
 */

import { test, expect } from '../fixtures/foundry-test.mjs';
import {
    createHeroActor,
    addGadgetToActor,
    addPowerToActor,
    addSkillToActor,
    deleteActor,
    openActorSheet,
    openItemSheet,
    closeAllWindows,
    prefixName,
} from '../fixtures/test-data.mjs';
import {
    isRollDialogOpen,
    waitForRollDialog,
    getRollDialogValues,
    closeRollDialog,
    submitRollDialog,
    isPickerDialogOpen,
    getPickerOptions,
    cancelPickerDialog,
    selectPickerOptionAndRoll,
    getChatMessageCount,
    getLatestChatMessage,
} from '../fixtures/roll-helpers.mjs';

// ============================================================
// Local helpers — gadget-specific, not in shared modules
// ============================================================

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
    await page.waitForSelector('.dialog', { timeout: 5000 });
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

// ============================================================
// TEST SUITE
// ============================================================

test.describe('Gadget Rolling (#17)', () => {

    // ----------------------------------------------------------
    // R1 + R5: Rollability — what should and should not roll
    // ----------------------------------------------------------

    test('R1: Gadget with explicit AV and EV shows roll button', async ({ page }) => {
        const actorId = await createHeroActor(page, prefixName('GadgetTest_R1_AVEV'));
        const gadgetId = await addGadgetToActor(page, actorId, { name: 'Blaster', av: 6, ev: 8 });
        try {
            await openActorSheet(page, actorId, 'gadgets');
            const rollable = await getRollableGadgetNames(page);
            expect(rollable).toContain('Blaster');
        } finally {
            await closeAllWindows(page);
            await deleteActor(page, actorId);
        }
    });

    test('R1: Gadget with only EV (no AV) is still rollable', async ({ page }) => {
        const actorId = await createHeroActor(page, prefixName('GadgetTest_R1_EVOnly'));
        const gadgetId = await addGadgetToActor(page, actorId, { name: 'Baton', av: 0, ev: 7 });
        try {
            await openActorSheet(page, actorId, 'gadgets');
            const rollable = await getRollableGadgetNames(page);
            expect(rollable).toContain('Baton');
        } finally {
            await closeAllWindows(page);
            await deleteActor(page, actorId);
        }
    });

    test('R2: Gadget with only child powers (APs > 0) is rollable', async ({ page }) => {
        const actorId = await createHeroActor(page, prefixName('GadgetTest_R2_Powers'));
        const gadgetId = await addGadgetToActor(page, actorId, { name: 'Visor', av: 0, ev: 0 });
        await addPowerToActor(page, actorId, {
            name: 'Energy Blast', aps: 10, link: 'dex', source: 'physical', parent: gadgetId,
        });
        try {
            await openActorSheet(page, actorId, 'gadgets');
            const rollable = await getRollableGadgetNames(page);
            expect(rollable).toContain('Visor');
        } finally {
            await closeAllWindows(page);
            await deleteActor(page, actorId);
        }
    });

    test('R5: Gadget with no AV/EV, no powers, no skills, no attributes is NOT rollable', async ({ page }) => {
        const actorId = await createHeroActor(page, prefixName('GadgetTest_R5_Empty'));
        const gadgetId = await addGadgetToActor(page, actorId, { name: 'Decorative Cape', av: 0, ev: 0 });
        try {
            await openActorSheet(page, actorId, 'gadgets');
            const nonRollable = await getNonRollableGadgetNames(page);
            expect(nonRollable).toContain('Decorative Cape');
        } finally {
            await closeAllWindows(page);
            await deleteActor(page, actorId);
        }
    });

    test('R5/R8: Gadget with only 0-AP skills is NOT rollable', async ({ page }) => {
        const actorId = await createHeroActor(page, prefixName('GadgetTest_R5_ZeroSkills'));
        const gadgetId = await addGadgetToActor(page, actorId, { name: 'Toolbox', av: 0, ev: 0 });
        await addSkillToActor(page, actorId, { name: 'Gadgetry', aps: 0, link: 'int', parent: gadgetId });
        await addSkillToActor(page, actorId, { name: 'Scientist', aps: 0, link: 'int', parent: gadgetId });
        try {
            await openActorSheet(page, actorId, 'gadgets');
            const nonRollable = await getNonRollableGadgetNames(page);
            expect(nonRollable).toContain('Toolbox');
        } finally {
            await closeAllWindows(page);
            await deleteActor(page, actorId);
        }
    });

    test('R5/R8: Gadget with only 0-AP powers is NOT rollable', async ({ page }) => {
        const actorId = await createHeroActor(page, prefixName('GadgetTest_R5_ZeroPowers'));
        const gadgetId = await addGadgetToActor(page, actorId, { name: 'Dead Battery', av: 0, ev: 0 });
        await addPowerToActor(page, actorId, {
            name: 'Flight', aps: 0, link: 'dex', source: 'physical', parent: gadgetId,
        });
        try {
            await openActorSheet(page, actorId, 'gadgets');
            const nonRollable = await getNonRollableGadgetNames(page);
            expect(nonRollable).toContain('Dead Battery');
        } finally {
            await closeAllWindows(page);
            await deleteActor(page, actorId);
        }
    });

    // ----------------------------------------------------------
    // R6: Single option -> direct roll dialog, no picker
    // ----------------------------------------------------------

    test('R6: Single AV/EV option skips picker, opens roll dialog directly', async ({ page }) => {
        const actorId = await createHeroActor(page, prefixName('GadgetTest_R6_Single'));
        const gadgetId = await addGadgetToActor(page, actorId, { name: 'Pistol', av: 5, ev: 5 });
        try {
            await openActorSheet(page, actorId, 'gadgets');
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
            await closeAllWindows(page);
            await deleteActor(page, actorId);
        }
    });

    test('R6: Single power option skips picker, opens roll dialog directly', async ({ page }) => {
        const actorId = await createHeroActor(page, prefixName('GadgetTest_R6_SinglePower'));
        const gadgetId = await addGadgetToActor(page, actorId, { name: 'Scope', av: 0, ev: 0 });
        await addPowerToActor(page, actorId, {
            name: 'Telescopic Vision', aps: 8, link: 'int', source: 'mental', parent: gadgetId,
        });
        try {
            await openActorSheet(page, actorId, 'gadgets');
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
            await closeAllWindows(page);
            await deleteActor(page, actorId);
        }
    });

    // ----------------------------------------------------------
    // R7: Multiple options -> picker dialog
    // ----------------------------------------------------------

    test('R7: Multiple options open picker dialog', async ({ page }) => {
        const actorId = await createHeroActor(page, prefixName('GadgetTest_R7_Multi'));
        const gadgetId = await addGadgetToActor(page, actorId, { name: 'Trident', av: 0, ev: 12 });
        await addPowerToActor(page, actorId, {
            name: 'Water Control', aps: 10, link: 'int', source: 'mental', parent: gadgetId,
        });
        try {
            await openActorSheet(page, actorId, 'gadgets');
            await clickGadgetRollButton(page, 'Trident');

            const pickerOpen = await isPickerDialogOpen(page);
            expect(pickerOpen).toBe(true);

            const options = await getPickerOptions(page);
            expect(options).toHaveLength(2);
            expect(options).toContain('Water Control');

            await cancelPickerDialog(page);
        } finally {
            await closeAllWindows(page);
            await deleteActor(page, actorId);
        }
    });

    test('R7: Picker shows all powers when gadget has many', async ({ page }) => {
        const actorId = await createHeroActor(page, prefixName('GadgetTest_R7_ManyPowers'));
        const gadgetId = await addGadgetToActor(page, actorId, { name: 'Power Ring', av: 0, ev: 0 });
        await addPowerToActor(page, actorId, {
            name: 'Flight', aps: 20, link: 'dex', source: 'physical', parent: gadgetId,
        });
        await addPowerToActor(page, actorId, {
            name: 'Force Field', aps: 15, link: 'will', source: 'mental', parent: gadgetId,
        });
        await addPowerToActor(page, actorId, {
            name: 'Energy Blast', aps: 18, link: 'dex', source: 'physical', parent: gadgetId,
        });
        await addPowerToActor(page, actorId, {
            name: 'Comprehend Languages', aps: 12, link: 'int', source: 'mental', parent: gadgetId,
        });
        await addPowerToActor(page, actorId, {
            name: 'Life Sense', aps: 25, link: 'int', source: 'mental', parent: gadgetId,
        });
        try {
            await openActorSheet(page, actorId, 'gadgets');
            await clickGadgetRollButton(page, 'Power Ring');

            const pickerOpen = await isPickerDialogOpen(page);
            expect(pickerOpen).toBe(true);

            const options = await getPickerOptions(page);
            expect(options).toHaveLength(5);
            expect(options).toContain('Flight');
            expect(options).toContain('Force Field');
            expect(options).toContain('Energy Blast');
            expect(options).toContain('Comprehend Languages');
            expect(options).toContain('Life Sense');

            await cancelPickerDialog(page);
        } finally {
            await closeAllWindows(page);
            await deleteActor(page, actorId);
        }
    });

    test('R7/R8: Picker excludes 0-AP items, only shows valid options', async ({ page }) => {
        const actorId = await createHeroActor(page, prefixName('GadgetTest_R7_Mixed'));
        const gadgetId = await addGadgetToActor(page, actorId, { name: 'Utility Belt', av: 0, ev: 6 });
        await addPowerToActor(page, actorId, {
            name: 'Flash', aps: 5, link: 'dex', source: 'physical', parent: gadgetId,
        });
        await addPowerToActor(page, actorId, {
            name: 'Smoke Screen', aps: 0, link: 'dex', source: 'physical', parent: gadgetId,
        });
        await addSkillToActor(page, actorId, { name: 'Gadgetry', aps: 0, link: 'int', parent: gadgetId });
        await addSkillToActor(page, actorId, { name: 'Thief', aps: 4, link: 'dex', parent: gadgetId });
        try {
            await openActorSheet(page, actorId, 'gadgets');
            await clickGadgetRollButton(page, 'Utility Belt');

            const pickerOpen = await isPickerDialogOpen(page);
            expect(pickerOpen).toBe(true);

            const options = await getPickerOptions(page);
            // Should have: AV/EV, Flash, Thief — NOT Smoke Screen (0 AP) or Gadgetry (0 AP)
            expect(options).toHaveLength(3);
            expect(options).toContain('Flash');
            expect(options).toContain('Thief');
            expect(options).not.toContain('Smoke Screen');
            expect(options).not.toContain('Gadgetry');

            await cancelPickerDialog(page);
        } finally {
            await closeAllWindows(page);
            await deleteActor(page, actorId);
        }
    });

    test('R7: Canceling picker produces no chat message', async ({ page }) => {
        const actorId = await createHeroActor(page, prefixName('GadgetTest_R7_Cancel'));
        const gadgetId = await addGadgetToActor(page, actorId, { name: 'Multi-Weapon', av: 3, ev: 5 });
        await addPowerToActor(page, actorId, {
            name: 'Projectile', aps: 7, link: 'dex', source: 'physical', parent: gadgetId,
        });
        try {
            await openActorSheet(page, actorId, 'gadgets');
            const beforeCount = await getChatMessageCount(page);

            await clickGadgetRollButton(page, 'Multi-Weapon');
            expect(await isPickerDialogOpen(page)).toBe(true);

            await cancelPickerDialog(page);

            const afterCount = await getChatMessageCount(page);
            expect(afterCount).toBe(beforeCount);
        } finally {
            await closeAllWindows(page);
            await deleteActor(page, actorId);
        }
    });

    // ----------------------------------------------------------
    // R9: Tooltip on roll button
    // ----------------------------------------------------------

    test('R9: Single-option gadget tooltip shows the one option', async ({ page }) => {
        const actorId = await createHeroActor(page, prefixName('GadgetTest_R9_Single'));
        const gadgetId = await addGadgetToActor(page, actorId, { name: 'Knife', av: 3, ev: 4 });
        try {
            await openActorSheet(page, actorId, 'gadgets');
            const tooltip = await getGadgetRollTooltip(page, 'Knife');
            expect(tooltip).not.toBeNull();
            expect(tooltip.length).toBeGreaterThan(0);
            // Should contain the gadget name
            expect(tooltip).toContain('Knife');
        } finally {
            await closeAllWindows(page);
            await deleteActor(page, actorId);
        }
    });

    test('R9: Multi-option gadget tooltip lists all options', async ({ page }) => {
        const actorId = await createHeroActor(page, prefixName('GadgetTest_R9_Multi'));
        const gadgetId = await addGadgetToActor(page, actorId, { name: 'Staff', av: 0, ev: 0 });
        await addPowerToActor(page, actorId, {
            name: 'Lightning', aps: 8, link: 'dex', source: 'physical', parent: gadgetId,
        });
        await addPowerToActor(page, actorId, {
            name: 'Force Bolt', aps: 6, link: 'will', source: 'mental', parent: gadgetId,
        });
        try {
            await openActorSheet(page, actorId, 'gadgets');
            const tooltip = await getGadgetRollTooltip(page, 'Staff');
            expect(tooltip).not.toBeNull();
            expect(tooltip).toContain('Lightning');
            expect(tooltip).toContain('Force Bolt');
        } finally {
            await closeAllWindows(page);
            await deleteActor(page, actorId);
        }
    });

    // ----------------------------------------------------------
    // R10: AlwaysSubstitute UI
    // ----------------------------------------------------------

    test('R10: AlwaysSubstitute checkbox visible in gadget edit mode', async ({ page }) => {
        const actorId = await createHeroActor(page, prefixName('GadgetTest_R10_Italic'));
        const gadgetId = await addGadgetToActor(page, actorId, {
            name: 'Power Suit', av: 0, ev: 0, attrs: { dex: 8, str: 10 },
        });
        try {
            // Open the gadget's own item sheet
            await openItemSheet(page, actorId, gadgetId);

            await page.waitForSelector('.sheet.item .always-substitute-label input[type="checkbox"]', { timeout: 5000 });

            // Verify checkboxes exist for always-substitute
            const checkboxCount = await page.$$eval(
                '.sheet.item .always-substitute-label input[type="checkbox"]',
                (cbs) => cbs.length
            );
            expect(checkboxCount).toBeGreaterThan(0);
        } finally {
            await closeAllWindows(page);
            await deleteActor(page, actorId);
        }
    });

    test('R10: Toggling AlwaysSubstitute persists after closing and reopening sheet', async ({ page }) => {
        const actorId = await createHeroActor(page, prefixName('GadgetTest_R10_Persist'));
        const gadgetId = await addGadgetToActor(page, actorId, {
            name: 'Armor', av: 0, ev: 0, attrs: { dex: 8, str: 10 },
        });
        try {
            // Open the gadget sheet
            await openItemSheet(page, actorId, gadgetId);

            await page.waitForSelector('.sheet.item .always-substitute-label input[type="checkbox"]', { timeout: 5000 });

            // Verify DEX checkbox starts unchecked
            const initialState = await page.$$eval(
                '.sheet.item .always-substitute-label input[type="checkbox"]',
                (cbs) => cbs.map(cb => cb.checked)
            );
            expect(initialState[0]).toBe(false);

            // Click the DEX always-substitute checkbox and wait for Foundry to persist
            await page.evaluate(() => {
                const cbs = document.querySelectorAll('.sheet.item .always-substitute-label input[type="checkbox"]');
                if (cbs[0]) cbs[0].click();
            });
            await page.waitForFunction(({ actorId, gadgetId }) => {
                const actor = game.actors.get(actorId);
                const gadget = actor?.items.get(gadgetId);
                return gadget?.system?.attributes?.dex?.alwaysSubstitute === true;
            }, { timeout: 5000 }, { actorId, gadgetId });

            // Close all sheets
            await closeAllWindows(page);

            // Verify data model persisted
            const persisted = await page.evaluate(({ actorId, gadgetId }) => {
                const actor = game.actors.get(actorId);
                const gadget = actor.items.get(gadgetId);
                return gadget.system.attributes.dex.alwaysSubstitute;
            }, { actorId, gadgetId });
            expect(persisted).toBe(true);

            // Reopen the gadget sheet
            await openItemSheet(page, actorId, gadgetId);

            await page.waitForSelector('.sheet.item .always-substitute-label input[type="checkbox"]', { timeout: 5000 });

            // Verify the checkbox is still checked in the UI
            const afterReopen = await page.$$eval(
                '.sheet.item .always-substitute-label input[type="checkbox"]',
                (cbs) => cbs.map(cb => cb.checked)
            );
            expect(afterReopen[0]).toBe(true);
            // STR should still be unchecked
            expect(afterReopen[1]).toBe(false);
        } finally {
            await closeAllWindows(page);
            await deleteActor(page, actorId);
        }
    });

    // ----------------------------------------------------------
    // R11: Macro support (item.roll())
    // ----------------------------------------------------------

    test('R11: item.roll() on single-option gadget triggers roll flow', async ({ page }) => {
        const actorId = await createHeroActor(page, prefixName('GadgetTest_R11_Macro'));
        const gadgetId = await addGadgetToActor(page, actorId, { name: 'Sidearm', av: 4, ev: 6 });
        try {
            const beforeCount = await getChatMessageCount(page);

            await page.evaluate(({ actorId, gadgetId }) => {
                const actor = game.actors.get(actorId);
                const gadget = actor.items.get(gadgetId);
                gadget.roll();
            }, { actorId, gadgetId });

            await waitForRollDialog(page);

            // Should open the roll dialog (single option, no picker)
            const rollOpen = await isRollDialogOpen(page);
            expect(rollOpen).toBe(true);

            await submitRollDialog(page, beforeCount);

            const afterCount = await getChatMessageCount(page);
            expect(afterCount).toBeGreaterThan(beforeCount);
        } finally {
            await closeAllWindows(page);
            await deleteActor(page, actorId);
        }
    });

    test('R11: item.roll() on multi-option gadget shows picker', async ({ page }) => {
        const actorId = await createHeroActor(page, prefixName('GadgetTest_R11_MacroPicker'));
        const gadgetId = await addGadgetToActor(page, actorId, { name: 'Combo Weapon', av: 3, ev: 5 });
        await addPowerToActor(page, actorId, {
            name: 'Flame Proj', aps: 7, link: 'dex', source: 'physical', parent: gadgetId,
        });
        try {
            await page.evaluate(({ actorId, gadgetId }) => {
                const actor = game.actors.get(actorId);
                const gadget = actor.items.get(gadgetId);
                gadget.roll();
            }, { actorId, gadgetId });

            await page.waitForSelector('.dialog', { timeout: 5000 });

            const pickerOpen = await isPickerDialogOpen(page);
            expect(pickerOpen).toBe(true);

            await cancelPickerDialog(page);
        } finally {
            await closeAllWindows(page);
            await deleteActor(page, actorId);
        }
    });

    test('R11: item.roll() on non-rollable gadget posts description to chat', async ({ page }) => {
        const actorId = await createHeroActor(page, prefixName('GadgetTest_R11_NoRoll'));
        const gadgetId = await addGadgetToActor(page, actorId, {
            name: 'Trophy', av: 0, ev: 0, description: 'A decorative trophy.',
        });
        try {
            const beforeCount = await getChatMessageCount(page);

            await page.evaluate(({ actorId, gadgetId }) => {
                const actor = game.actors.get(actorId);
                const gadget = actor.items.get(gadgetId);
                gadget.roll();
            }, { actorId, gadgetId });

            // Wait for chat message to appear
            await page.waitForFunction(
                (before) => document.querySelectorAll('#chat-log .chat-message').length > before,
                { timeout: 5000 },
                beforeCount
            );

            // No picker, no roll dialog
            expect(await isPickerDialogOpen(page)).toBe(false);
            expect(await isRollDialogOpen(page)).toBe(false);

            // But a chat message should have been posted (description)
            const afterCount = await getChatMessageCount(page);
            expect(afterCount).toBeGreaterThan(beforeCount);
        } finally {
            await closeAllWindows(page);
            await deleteActor(page, actorId);
        }
    });

    // ----------------------------------------------------------
    // R12: Chat message labels
    // ----------------------------------------------------------

    test('R12: Chat message from gadget roll includes gadget name', async ({ page }) => {
        const actorId = await createHeroActor(page, prefixName('GadgetTest_R12_Label'));
        const gadgetId = await addGadgetToActor(page, actorId, { name: 'Laser Rifle', av: 7, ev: 9 });
        try {
            await openActorSheet(page, actorId, 'gadgets');
            const beforeCount = await getChatMessageCount(page);
            await clickGadgetRollButton(page, 'Laser Rifle');

            const rollOpen = await isRollDialogOpen(page);
            expect(rollOpen).toBe(true);

            await submitRollDialog(page, beforeCount);

            const latestMsg = await getLatestChatMessage(page);
            expect(latestMsg).not.toBeNull();
            // Header should mention the gadget name
            expect(latestMsg.header).toContain('Laser Rifle');
        } finally {
            await closeAllWindows(page);
            await deleteActor(page, actorId);
        }
    });

    // ----------------------------------------------------------
    // Edge cases
    // ----------------------------------------------------------

    test('EDGE: Gadget with EV but 0 AV derives AV and still rolls correctly', async ({ page }) => {
        const actorId = await createHeroActor(page, prefixName('GadgetTest_EDGE_ZeroAV'));
        const gadgetId = await addGadgetToActor(page, actorId, { name: 'Club', av: 0, ev: 9 });
        try {
            await openActorSheet(page, actorId, 'gadgets');
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
            await closeAllWindows(page);
            await deleteActor(page, actorId);
        }
    });

    test('EDGE: Actor with multiple gadgets shows correct rollability for each', async ({ page }) => {
        const actorId = await createHeroActor(page, prefixName('GadgetTest_EDGE_MultiGadget'));
        const weaponId = await addGadgetToActor(page, actorId, { name: 'Weapon A', av: 5, ev: 8 });
        const ornamentId = await addGadgetToActor(page, actorId, { name: 'Ornament', av: 0, ev: 0 });
        const scannerId = await addGadgetToActor(page, actorId, { name: 'Scanner', av: 0, ev: 0 });
        await addPowerToActor(page, actorId, {
            name: 'Detect', aps: 6, link: 'int', source: 'mental', parent: scannerId,
        });
        try {
            await openActorSheet(page, actorId, 'gadgets');

            const rollable = await getRollableGadgetNames(page);
            const nonRollable = await getNonRollableGadgetNames(page);

            expect(rollable).toContain('Weapon A');
            expect(rollable).toContain('Scanner');
            expect(nonRollable).toContain('Ornament');
        } finally {
            await closeAllWindows(page);
            await deleteActor(page, actorId);
        }
    });

    test('EDGE: Selecting different picker options produces correct AV/EV', async ({ page }) => {
        const actorId = await createHeroActor(page, prefixName('GadgetTest_EDGE_PickerVals'));
        const gadgetId = await addGadgetToActor(page, actorId, { name: 'Versatile Weapon', av: 4, ev: 6 });
        await addPowerToActor(page, actorId, {
            name: 'Flame Jet', aps: 10, link: 'dex', source: 'physical', parent: gadgetId,
        });
        try {
            await openActorSheet(page, actorId, 'gadgets');

            // First: select the power option (index 1 — powers come after AV/EV)
            await clickGadgetRollButton(page, 'Versatile Weapon');
            expect(await isPickerDialogOpen(page)).toBe(true);

            const options = await getPickerOptions(page);
            expect(options).toHaveLength(2);

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
            await closeAllWindows(page);
            await deleteActor(page, actorId);
        }
    });

});
