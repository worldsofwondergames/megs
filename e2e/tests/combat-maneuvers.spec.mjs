import { test, expect } from '../fixtures/foundry-test.mjs';
import {
    prefixName,
    createHeroActor,
    deleteActor,
    openActorSheet,
    closeAllWindows,
} from '../fixtures/test-data.mjs';
import {
    waitForRollDialog,
    fillRollDialog,
    submitRollDialog,
    queueDice,
    restoreDice,
    getChatMessageCount,
    parseLatestRollMessage,
} from '../fixtures/roll-helpers.mjs';

/**
 * Category 7 of #226: Combat Maneuvers (3E Rules Ch. 2).
 *
 * Maneuver OV/RV shifts come from assets/data/combatManeuvers.json and are
 * applied in dice.mjs _handleRolls: ovShifts move the OV column used for the
 * Action Table difficulty lookup (negative ovShifts = higher difficulty),
 * and rvShifts feed into the Result Table column shifts.
 *
 * Expected difficulties are hardcoded from actionTable[3] (AV 5-6):
 *   [4, 7, 9, 11, 13, 15, 18, 21] for OV columns 0..7.
 * Base case AV 5 vs OV 5 is column 3 => difficulty 11.
 */
test.describe('Combat Maneuvers (#226 cat 7)', () => {
    async function openDexRollDialog(page, actorId) {
        await page.evaluate(() => {
            for (const t of [...game.user.targets]) {
                t.setTarget(false, { user: game.user, releaseOthers: false });
            }
        });
        await openActorSheet(page, actorId, 'abilities');
        await page.click('.sheet.actor .tab.abilities .resource-label.rollable[data-key="dex"]');
        await waitForRollDialog(page);
    }

    /** Roll AV 5 / EV 5 / OV 5 / RV 5 with the given maneuver and dice. */
    async function rollWithManeuver(page, actorId, maneuver, dice) {
        await openDexRollDialog(page, actorId);
        await fillRollDialog(page, { av: 5, ev: 5, ov: 5, rv: 5, maneuver });
        await queueDice(page, dice);
        const before = await getChatMessageCount(page);
        await submitRollDialog(page, before);
        return parseLatestRollMessage(page);
    }

    test('Roll dialog maneuver select lists the combat maneuvers', async ({ page }) => {
        let actorId;
        try {
            actorId = await createHeroActor(page, prefixName('CM_Select'));
            await openDexRollDialog(page, actorId);

            const options = await page.evaluate(() => {
                const select = document.querySelector('.dialog .megs-dialog select[name="combatManeuver"]');
                return select ? [...select.options].map(o => o.value) : null;
            });

            expect(options).not.toBeNull();
            expect(options[0]).toBe(''); // "None" default
            for (const maneuver of [
                'Critical Blow',
                'Devastating Attack',
                'Flailing Attack',
                'Grappling Attack',
                'Multi-Attack vs 2',
                'Multi-Attack vs 3-4',
                'Multi-Attack vs 5-8',
                'Pulling a Punch',
                'Pressing the Attack',
            ]) {
                expect(options).toContain(maneuver);
            }
        } finally {
            await closeAllWindows(page);
            if (actorId) await deleteActor(page, actorId);
        }
    });

    test('Critical Blow shifts OV 2 columns against the attacker (difficulty 11 -> 15)', async ({ page }) => {
        let actorId;
        try {
            actorId = await createHeroActor(page, prefixName('CM_CritBlow'));
            const msg = await rollWithManeuver(page, actorId, 'Critical Blow', [6, 5]);
            expect(msg.difficulty).toBe(15);
            expect(msg.rollTotal).toBe(11);
            expect(msg.resultText).toContain('Action failed!'); // 11 < 15
        } finally {
            await restoreDice(page);
            await closeAllWindows(page);
            if (actorId) await deleteActor(page, actorId);
        }
    });

    test('Devastating Attack shifts OV 4 columns (difficulty 11 -> 21)', async ({ page }) => {
        let actorId;
        try {
            actorId = await createHeroActor(page, prefixName('CM_Devastating'));
            const msg = await rollWithManeuver(page, actorId, 'Devastating Attack', [6, 5]);
            expect(msg.difficulty).toBe(21);
        } finally {
            await restoreDice(page);
            await closeAllWindows(page);
            if (actorId) await deleteActor(page, actorId);
        }
    });

    test('Flailing Attack shifts OV 2 columns in the attacker\'s favor (difficulty 11 -> 7)', async ({ page }) => {
        let actorId;
        try {
            actorId = await createHeroActor(page, prefixName('CM_Flailing'));
            const msg = await rollWithManeuver(page, actorId, 'Flailing Attack', [6, 5]);
            expect(msg.difficulty).toBe(7);
            expect(msg.isSuccess).toBe(true); // 11 >= 7
        } finally {
            await restoreDice(page);
            await closeAllWindows(page);
            if (actorId) await deleteActor(page, actorId);
        }
    });

    test('Grappling Attack applies no column shifts (difficulty stays 11)', async ({ page }) => {
        let actorId;
        try {
            actorId = await createHeroActor(page, prefixName('CM_Grapple'));
            const msg = await rollWithManeuver(page, actorId, 'Grappling Attack', [6, 5]);
            expect(msg.difficulty).toBe(11);
            expect(msg.isSuccess).toBe(true);
        } finally {
            await restoreDice(page);
            await closeAllWindows(page);
            if (actorId) await deleteActor(page, actorId);
        }
    });

    test('Multi-Attack vs 2 targets: OV shifted 1 column (difficulty 13), RV +1 shift', async ({ page }) => {
        let actorId;
        try {
            actorId = await createHeroActor(page, prefixName('CM_Multi2'));
            // Roll 13 exactly meets difficulty 13; no roll shifts.
            // RV index = rangeIndex(5) + ovShifts(-1) = 2, then rvShifts +1
            // moves it to column 1 => resultTable[3][1] = 3 RAPs.
            const msg = await rollWithManeuver(page, actorId, 'Multi-Attack vs 2', [7, 6]);
            expect(msg.difficulty).toBe(13);
            expect(msg.isSuccess).toBe(true);
            expect(msg.resultText).toContain('Success: 3 RAPs!');
        } finally {
            await restoreDice(page);
            await closeAllWindows(page);
            if (actorId) await deleteActor(page, actorId);
        }
    });

    test('Multi-Attack vs 3-4 targets: OV shifted 2 columns (difficulty 15)', async ({ page }) => {
        let actorId;
        try {
            actorId = await createHeroActor(page, prefixName('CM_Multi34'));
            const msg = await rollWithManeuver(page, actorId, 'Multi-Attack vs 3-4', [6, 5]);
            expect(msg.difficulty).toBe(15);
        } finally {
            await restoreDice(page);
            await closeAllWindows(page);
            if (actorId) await deleteActor(page, actorId);
        }
    });

    test('Multi-Attack vs 5-8 targets: OV shifted 3 columns (difficulty 18)', async ({ page }) => {
        let actorId;
        try {
            actorId = await createHeroActor(page, prefixName('CM_Multi58'));
            const msg = await rollWithManeuver(page, actorId, 'Multi-Attack vs 5-8', [6, 5]);
            expect(msg.difficulty).toBe(18);
        } finally {
            await restoreDice(page);
            await closeAllWindows(page);
            if (actorId) await deleteActor(page, actorId);
        }
    });

    test('Pressing the Attack shifts OV 1 column against the attacker (difficulty 13)', async ({ page }) => {
        let actorId;
        try {
            actorId = await createHeroActor(page, prefixName('CM_Pressing'));
            const msg = await rollWithManeuver(page, actorId, 'Pressing the Attack', [6, 5]);
            expect(msg.difficulty).toBe(13);
        } finally {
            await restoreDice(page);
            await closeAllWindows(page);
            if (actorId) await deleteActor(page, actorId);
        }
    });

    test('Pulling a Punch: manually reduced EV lowers the RAPs result', async ({ page }) => {
        let actorId;
        try {
            actorId = await createHeroActor(page, prefixName('CM_PullPunch'));
            await openDexRollDialog(page, actorId);
            // Pull the punch by dropping EV from 5 to 3.
            // EV 3 vs RV 3 => resultTable[2][2] = 1 RAP (EV 5 would give 2).
            await fillRollDialog(page, { av: 5, ev: 3, ov: 5, rv: 3 });
            await queueDice(page, [6, 5]);
            const before = await getChatMessageCount(page);
            await submitRollDialog(page, before);

            const msg = await parseLatestRollMessage(page);
            expect(msg.difficulty).toBe(11);
            expect(msg.isSuccess).toBe(true);
            expect(msg.raw).toMatch(/Effect Value\s*3/);
            expect(msg.resultText).toContain('Success: 1 RAPs!');
        } finally {
            await restoreDice(page);
            await closeAllWindows(page);
            if (actorId) await deleteActor(page, actorId);
        }
    });
});
