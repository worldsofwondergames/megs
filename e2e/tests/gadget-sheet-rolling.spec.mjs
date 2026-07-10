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

import { test, expect } from '../fixtures/foundry-test.mjs';
import {
    createHeroActor,
    addGadgetToActor,
    addPowerToActor,
    addSkillToActor,
    deleteActor,
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
    getChatMessageCount,
    getLatestChatMessage,
} from '../fixtures/roll-helpers.mjs';

// ============================================================
// Gadget-sheet-specific helpers (local to this file)
// ============================================================

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
 * Update gadget settings (hasAVAndEV, hasPowers, hasSkills, etc.) after creation.
 * The addGadgetToActor helper does not set these, so they must be patched separately.
 */
async function updateGadgetSettings(page, actorId, gadgetId, settings) {
    await page.evaluate(async ({ actorId, gadgetId, settings }) => {
        const actor = game.actors.get(actorId);
        const gadget = actor.items.get(gadgetId);
        const current = gadget.system.settings ?? {};
        await gadget.update({ 'system.settings': { ...current, ...settings } });
    }, { actorId, gadgetId, settings });
}

// ============================================================
// TEST SUITE
// ============================================================

test.describe('Gadget Sheet Rolling (#13)', () => {

    // ----------------------------------------------------------
    // R1: Roll button on gadget sheet with AV/EV
    // ----------------------------------------------------------
    test('R1: Gadget sheet with AV/EV shows roll button', async ({ page }) => {
        const actorName = prefixName('GdgSheet_R1');
        const actorId = await createHeroActor(page, actorName);
        try {
            const gadgetId = await addGadgetToActor(page, actorId, {
                name: 'TestWeapon', av: 6, ev: 8,
            });
            await updateGadgetSettings(page, actorId, gadgetId, {
                hasAVAndEV: 'true',
            });

            await openGadgetSheet(page, actorId, gadgetId);
            const hasBtn = await hasGadgetSheetRollButton(page);
            expect(hasBtn).toBe(true);
        } finally {
            await closeAllWindows(page);
            await deleteActor(page, actorId);
        }
    });

    // ----------------------------------------------------------
    // R2: Roll button on gadget sheet with child powers
    // ----------------------------------------------------------
    test('R2: Gadget sheet with child power shows roll button', async ({ page }) => {
        const actorName = prefixName('GdgSheet_R2');
        const actorId = await createHeroActor(page, actorName);
        try {
            const gadgetId = await addGadgetToActor(page, actorId, {
                name: 'TestDevice',
            });
            await addPowerToActor(page, actorId, {
                name: 'EnergyBlast', aps: 8, link: 'dex', source: 'physical',
                parent: gadgetId,
            });
            await updateGadgetSettings(page, actorId, gadgetId, {
                hasPowers: 'true',
            });

            await openGadgetSheet(page, actorId, gadgetId);
            const hasBtn = await hasGadgetSheetRollButton(page);
            expect(hasBtn).toBe(true);
        } finally {
            await closeAllWindows(page);
            await deleteActor(page, actorId);
        }
    });

    // ----------------------------------------------------------
    // R3: Roll button on gadget sheet with attributes
    // ----------------------------------------------------------
    test('R3: Gadget sheet with DEX/STR attributes shows roll button', async ({ page }) => {
        const actorName = prefixName('GdgSheet_R3');
        const actorId = await createHeroActor(page, actorName);
        try {
            const gadgetId = await addGadgetToActor(page, actorId, {
                name: 'TestSuit',
                attrs: { dex: 7, str: 9 },
                hasAttributes: { physical: 'true', mental: 'false', mystical: 'false' },
            });

            await openGadgetSheet(page, actorId, gadgetId);
            const hasBtn = await hasGadgetSheetRollButton(page);
            expect(hasBtn).toBe(true);
        } finally {
            await closeAllWindows(page);
            await deleteActor(page, actorId);
        }
    });

    // ----------------------------------------------------------
    // R4: No roll button when no rollable options
    // ----------------------------------------------------------
    test('R4: Gadget sheet with no rollable options hides roll button', async ({ page }) => {
        const actorName = prefixName('GdgSheet_R4');
        const actorId = await createHeroActor(page, actorName);
        try {
            const gadgetId = await addGadgetToActor(page, actorId, {
                name: 'TestContainer',
                attrs: { body: 5 },
                hasAttributes: { physical: 'true', mental: 'false', mystical: 'false' },
            });

            await openGadgetSheet(page, actorId, gadgetId);
            const hasBtn = await hasGadgetSheetRollButton(page);
            expect(hasBtn).toBe(false);
        } finally {
            await closeAllWindows(page);
            await deleteActor(page, actorId);
        }
    });

    // ----------------------------------------------------------
    // R5: Single option goes directly to roll dialog
    // ----------------------------------------------------------
    test('R5: Single roll option opens roll dialog directly', async ({ page }) => {
        const actorName = prefixName('GdgSheet_R5');
        const actorId = await createHeroActor(page, actorName);
        try {
            const gadgetId = await addGadgetToActor(page, actorId, {
                name: 'TestGun', av: 4, ev: 7,
            });
            await updateGadgetSettings(page, actorId, gadgetId, {
                hasAVAndEV: 'true',
            });

            await openGadgetSheet(page, actorId, gadgetId);
            await clickGadgetSheetRollButton(page);
            await waitForRollDialog(page);

            const isRoll = await isRollDialogOpen(page);
            expect(isRoll).toBe(true);

            const values = await getRollDialogValues(page);
            expect(values.actionValue).toBe(4);
            expect(values.effectValue).toBe(7);

            await closeRollDialog(page);
        } finally {
            await closeAllWindows(page);
            await deleteActor(page, actorId);
        }
    });

    // ----------------------------------------------------------
    // R6: Multiple options open picker dialog
    // ----------------------------------------------------------
    test('R6: Multiple roll options opens picker dialog', async ({ page }) => {
        const actorName = prefixName('GdgSheet_R6');
        const actorId = await createHeroActor(page, actorName);
        try {
            const gadgetId = await addGadgetToActor(page, actorId, {
                name: 'TestMulti', av: 5, ev: 5,
            });
            await addPowerToActor(page, actorId, {
                name: 'HeatVision', aps: 10, link: 'dex', source: 'physical',
                parent: gadgetId,
            });
            await updateGadgetSettings(page, actorId, gadgetId, {
                hasAVAndEV: 'true',
                hasPowers: 'true',
            });

            await openGadgetSheet(page, actorId, gadgetId);
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
            await closeAllWindows(page);
            await deleteActor(page, actorId);
        }
    });

    // ----------------------------------------------------------
    // R7: Roll button tooltip shows option info
    // ----------------------------------------------------------
    test('R7: Roll button tooltip indicates rollable options', async ({ page }) => {
        const actorName = prefixName('GdgSheet_R7');
        const actorId = await createHeroActor(page, actorName);
        try {
            const gadgetId = await addGadgetToActor(page, actorId, {
                name: 'TestBlaster', av: 6, ev: 8,
            });
            await updateGadgetSettings(page, actorId, gadgetId, {
                hasAVAndEV: 'true',
            });

            await openGadgetSheet(page, actorId, gadgetId);
            const tooltip = await getGadgetSheetRollTooltip(page);
            expect(tooltip).not.toBeNull();
            expect(tooltip).toContain('TestBlaster');
        } finally {
            await closeAllWindows(page);
            await deleteActor(page, actorId);
        }
    });

    // ----------------------------------------------------------
    // R8: Roll from gadget sheet produces chat message
    // ----------------------------------------------------------
    test('R8: Rolling from gadget sheet produces chat message with gadget name', async ({ page }) => {
        const actorName = prefixName('GdgSheet_R8');
        const actorId = await createHeroActor(page, actorName);
        try {
            const gadgetId = await addGadgetToActor(page, actorId, {
                name: 'TestRifle', av: 5, ev: 6,
            });
            await updateGadgetSettings(page, actorId, gadgetId, {
                hasAVAndEV: 'true',
            });

            await openGadgetSheet(page, actorId, gadgetId);
            const beforeCount = await getChatMessageCount(page);

            await clickGadgetSheetRollButton(page);
            await waitForRollDialog(page);
            await submitRollDialog(page, beforeCount);

            const msg = await getLatestChatMessage(page);
            expect(msg).not.toBeNull();
            expect(msg.header).toContain('TestRifle');
        } finally {
            await closeAllWindows(page);
            await deleteActor(page, actorId);
        }
    });

    // ----------------------------------------------------------
    // R9: Picker options match available gadget abilities
    // ----------------------------------------------------------
    test('R9: Picker dialog lists all rollable options from gadget', async ({ page }) => {
        const actorName = prefixName('GdgSheet_R9');
        const actorId = await createHeroActor(page, actorName);
        try {
            const gadgetId = await addGadgetToActor(page, actorId, {
                name: 'TestMultiAbility', av: 3, ev: 3,
                attrs: { dex: 6, str: 8 },
                hasAttributes: { physical: 'true', mental: 'false', mystical: 'false' },
            });
            await addPowerToActor(page, actorId, {
                name: 'Flame', aps: 7, link: 'dex', source: 'physical',
                parent: gadgetId,
            });
            await updateGadgetSettings(page, actorId, gadgetId, {
                hasAVAndEV: 'true',
                hasPowers: 'true',
            });

            await openGadgetSheet(page, actorId, gadgetId);
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
            await closeAllWindows(page);
            await deleteActor(page, actorId);
        }
    });

});
