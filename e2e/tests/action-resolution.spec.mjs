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
    getRollDialogValues,
    fillRollDialog,
    clickRollDialogSubmit,
    submitRollDialog,
    answerDoublesPrompt,
    queueDice,
    restoreDice,
    getChatMessageCount,
    parseLatestRollMessage,
} from '../fixtures/roll-helpers.mjs';

/**
 * Category 6 of #226: Dice Rolling — Action Resolution (3E Rules Ch. 2).
 *
 * Expected values are hardcoded from assets/data/tables.json:
 *   ranges:            [0,0],[1,2],[3,4],[5,6],[7,8],[9,10],...
 *   actionTable[3]  (AV 5-6):  [4, 7, 9, 11, 13, 15, 18, 21]
 *   resultTable[3]  (EV 5-6):  [A,  3, 2, 1, 0, ...]
 *
 * Dice are made deterministic by overriding Die.prototype.randomFace
 * (see queueDice in roll-helpers.mjs).
 */
test.describe('Action Resolution (#226 cat 6)', () => {
    /** Create hero (dex 5 / str 4 defaults), open its sheet, click the DEX roll label. */
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

    test('Clicking a rollable attribute opens the roll dialog with AV/EV/OV/RV fields', async ({ page }) => {
        let actorId;
        try {
            actorId = await createHeroActor(page, prefixName('AR_DialogFields'));
            await openDexRollDialog(page, actorId);

            // AV = DEX (5); EV = paired STR (4); OV/RV empty with no target
            const values = await getRollDialogValues(page);
            expect(values.actionValue).toBe(5);
            expect(values.effectValue).toBe(4);

            const hasOvRv = await page.evaluate(() => {
                const d = document.querySelector('.dialog .megs-dialog');
                return !!(d.querySelector('#opposingValue') && d.querySelector('#resistanceValue'));
            });
            expect(hasOvRv).toBe(true);
        } finally {
            await closeAllWindows(page);
            if (actorId) await deleteActor(page, actorId);
        }
    });

    test('Action Table: AV 5 vs OV 5 produces difficulty 11; EV 5 vs RV 3 gives 2 RAPs', async ({ page }) => {
        let actorId;
        try {
            actorId = await createHeroActor(page, prefixName('AR_Difficulty'));
            await openDexRollDialog(page, actorId);
            await fillRollDialog(page, { av: 5, ev: 5, ov: 5, rv: 3 });

            await queueDice(page, [6, 5]); // total 11, exactly meets difficulty
            const before = await getChatMessageCount(page);
            await submitRollDialog(page, before);

            const msg = await parseLatestRollMessage(page);
            expect(msg.difficulty).toBe(11);
            expect(msg.rollTotal).toBe(11);
            expect(msg.dice).toEqual([6, 5]);
            expect(msg.isSuccess).toBe(true);
            expect(msg.resultText).toContain('Success: 2 RAPs!');
        } finally {
            await restoreDice(page);
            await closeAllWindows(page);
            if (actorId) await deleteActor(page, actorId);
        }
    });

    test('Roll below difficulty fails with failure styling', async ({ page }) => {
        let actorId;
        try {
            actorId = await createHeroActor(page, prefixName('AR_Failure'));
            await openDexRollDialog(page, actorId);
            await fillRollDialog(page, { av: 5, ev: 5, ov: 5, rv: 5 });

            await queueDice(page, [3, 4]); // total 7 < difficulty 11
            const before = await getChatMessageCount(page);
            await submitRollDialog(page, before);

            const msg = await parseLatestRollMessage(page);
            expect(msg.difficulty).toBe(11);
            expect(msg.rollTotal).toBe(7);
            expect(msg.resultText).toContain('Action failed!');
            expect(msg.isFailure).toBe(true);
        } finally {
            await restoreDice(page);
            await closeAllWindows(page);
            if (actorId) await deleteActor(page, actorId);
        }
    });

    test('Double 1s is automatic failure regardless of AV/OV', async ({ page }) => {
        let actorId;
        try {
            actorId = await createHeroActor(page, prefixName('AR_Double1s'), { dex: 20 });
            await openDexRollDialog(page, actorId);
            await fillRollDialog(page, { av: 20, ev: 5, ov: 1, rv: 1 });

            await queueDice(page, [1, 1]);
            const before = await getChatMessageCount(page);
            await submitRollDialog(page, before);

            const msg = await parseLatestRollMessage(page);
            expect(msg.resultText).toContain('Double 1s: Automatic failure!');
            expect(msg.isFailure).toBe(true);
        } finally {
            await restoreDice(page);
            await closeAllWindows(page);
            if (actorId) await deleteActor(page, actorId);
        }
    });

    test('Column shift earned by high roll increases RAPs (AV 5 vs OV 3, roll 13)', async ({ page }) => {
        let actorId;
        try {
            actorId = await createHeroActor(page, prefixName('AR_ColShift'));
            await openDexRollDialog(page, actorId);
            await fillRollDialog(page, { av: 5, ev: 5, ov: 3, rv: 5 });

            // Difficulty = actionTable[3][2] = 9. Roll 13 beats the 11 column
            // but not the 13 column => exactly 1 column shift.
            // EV 5 vs RV 5 is normally 1 RAP; shifted one column => 2 RAPs.
            await queueDice(page, [7, 6]);
            const before = await getChatMessageCount(page);
            await submitRollDialog(page, before);

            const msg = await parseLatestRollMessage(page);
            expect(msg.difficulty).toBe(9);
            expect(msg.rollTotal).toBe(13);
            expect(msg.raw).toMatch(/1\s+Column Shift/);
            expect(msg.resultText).toContain('Success: 2 RAPs!');
        } finally {
            await restoreDice(page);
            await closeAllWindows(page);
            if (actorId) await deleteActor(page, actorId);
        }
    });

    test('Positive Result Table shifts increase RAPs (+2 shifts: 1 RAP becomes 3)', async ({ page }) => {
        let actorId;
        try {
            actorId = await createHeroActor(page, prefixName('AR_PlusShifts'));
            await openDexRollDialog(page, actorId);
            await fillRollDialog(page, { av: 5, ev: 5, ov: 5, rv: 5, resultShifts: 2 });

            // Roll 11 earns no shifts of its own; +2 manual shifts move
            // EV 5 vs RV 5 from resultTable[3][3]=1 to resultTable[3][1]=3.
            await queueDice(page, [6, 5]);
            const before = await getChatMessageCount(page);
            await submitRollDialog(page, before);

            const msg = await parseLatestRollMessage(page);
            expect(msg.difficulty).toBe(11);
            expect(msg.resultText).toContain('Success: 3 RAPs!');
        } finally {
            await restoreDice(page);
            await closeAllWindows(page);
            if (actorId) await deleteActor(page, actorId);
        }
    });

    test('Negative Result Table shifts can reduce the result to No Effect', async ({ page }) => {
        let actorId;
        try {
            actorId = await createHeroActor(page, prefixName('AR_MinusShifts'));
            await openDexRollDialog(page, actorId);
            await fillRollDialog(page, { av: 5, ev: 5, ov: 5, rv: 5, resultShifts: -2 });

            // EV 5 vs RV 5 shifted -2 lands on resultTable[3][5] = 0 => No Effect.
            await queueDice(page, [6, 5]);
            const before = await getChatMessageCount(page);
            await submitRollDialog(page, before);

            const msg = await parseLatestRollMessage(page);
            expect(msg.resultText).toContain('No effect!');
        } finally {
            await restoreDice(page);
            await closeAllWindows(page);
            if (actorId) await deleteActor(page, actorId);
        }
    });

    test('RV 0 gives the "All" result: RAPs equal Effect Value', async ({ page }) => {
        let actorId;
        try {
            actorId = await createHeroActor(page, prefixName('AR_AllResult'));
            await openDexRollDialog(page, actorId);
            await fillRollDialog(page, { av: 5, ev: 5, ov: 5, rv: 0 });

            await queueDice(page, [6, 5]);
            const before = await getChatMessageCount(page);
            await submitRollDialog(page, before);

            const msg = await parseLatestRollMessage(page);
            expect(msg.resultText).toContain('Success: 5 RAPs!');
            expect(msg.evResult).toContain('A (5)');
        } finally {
            await restoreDice(page);
            await closeAllWindows(page);
            if (actorId) await deleteActor(page, actorId);
        }
    });

    test('Doubles prompt to roll again; accepted reroll adds to the total', async ({ page }) => {
        let actorId;
        try {
            actorId = await createHeroActor(page, prefixName('AR_Doubles'));
            await openDexRollDialog(page, actorId);
            await fillRollDialog(page, { av: 5, ev: 5, ov: 5, rv: 5 });

            // 4+4 doubles, then 5+3 => total 16.
            // Roll 16 earns 2 column shifts (beats 13 and 15 columns);
            // EV 5 vs RV 5 shifted 2 => resultTable[3][1] = 3 RAPs.
            await queueDice(page, [4, 4, 5, 3]);
            const before = await getChatMessageCount(page);
            await clickRollDialogSubmit(page);
            await answerDoublesPrompt(page, true);

            await page.waitForFunction(
                (b) => document.querySelectorAll('.chat-log .chat-message').length > b,
                before,
                { timeout: 15000 }
            );

            const msg = await parseLatestRollMessage(page);
            expect(msg.dice).toEqual([4, 4, 5, 3]);
            expect(msg.rollTotal).toBe(16);
            expect(msg.resultText).toContain('Success: 3 RAPs!');
        } finally {
            await restoreDice(page);
            await closeAllWindows(page);
            if (actorId) await deleteActor(page, actorId);
        }
    });

    test('Doubles declined keeps the original total', async ({ page }) => {
        let actorId;
        try {
            actorId = await createHeroActor(page, prefixName('AR_DoublesNo'));
            await openDexRollDialog(page, actorId);
            await fillRollDialog(page, { av: 5, ev: 5, ov: 5, rv: 5 });

            await queueDice(page, [4, 4]); // total 8 < difficulty 11
            const before = await getChatMessageCount(page);
            await clickRollDialogSubmit(page);
            await answerDoublesPrompt(page, false);

            await page.waitForFunction(
                (b) => document.querySelectorAll('.chat-log .chat-message').length > b,
                before,
                { timeout: 15000 }
            );

            const msg = await parseLatestRollMessage(page);
            expect(msg.dice).toEqual([4, 4]);
            expect(msg.rollTotal).toBe(8);
            expect(msg.resultText).toContain('Action failed!');
        } finally {
            await restoreDice(page);
            await closeAllWindows(page);
            if (actorId) await deleteActor(page, actorId);
        }
    });

    test('Consecutive doubles accumulate across multiple rerolls', async ({ page }) => {
        let actorId;
        try {
            actorId = await createHeroActor(page, prefixName('AR_ConsecDoubles'));
            await openDexRollDialog(page, actorId);
            await fillRollDialog(page, { av: 5, ev: 5, ov: 5, rv: 5 });

            // 2+2 doubles, 3+3 doubles, 6+4 => total 20 over 6 dice.
            // Roll 20 earns 3 shifts (beats 13, 15, 18); EV 5 vs RV 5
            // shifted 3 pushes past column 0 => All result = 5 RAPs.
            await queueDice(page, [2, 2, 3, 3, 6, 4]);
            const before = await getChatMessageCount(page);
            await clickRollDialogSubmit(page);
            await answerDoublesPrompt(page, true);
            await answerDoublesPrompt(page, true);

            await page.waitForFunction(
                (b) => document.querySelectorAll('.chat-log .chat-message').length > b,
                before,
                { timeout: 15000 }
            );

            const msg = await parseLatestRollMessage(page);
            expect(msg.dice).toEqual([2, 2, 3, 3, 6, 4]);
            expect(msg.rollTotal).toBe(20);
            expect(msg.resultText).toContain('Success: 5 RAPs!');
        } finally {
            await restoreDice(page);
            await closeAllWindows(page);
            if (actorId) await deleteActor(page, actorId);
        }
    });
});
