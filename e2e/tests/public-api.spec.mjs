import { test, expect } from '../fixtures/foundry-test.mjs';
import {
    prefixName,
    createHeroActor,
    deleteActor,
    closeAllWindows,
} from '../fixtures/test-data.mjs';
import {
    waitForRollDialog,
    submitRollDialog,
    queueDice,
    restoreDice,
    getChatMessageCount,
    parseLatestRollMessage,
} from '../fixtures/roll-helpers.mjs';

/**
 * Issue #156: the Token Action HUD integration is a separate Foundry module that
 * reaches the system only through `game.megs`.
 *
 * These tests run with Token Action HUD absent, which is the point: they show
 * the system initialises and the integration surface works without it, so not
 * having the module installed cannot affect anything (requirement R1).
 */
test.describe('game.megs public API (#156)', () => {
    test('the world is running without Token Action HUD', async ({ page }) => {
        const state = await page.evaluate(() => ({
            ready: game.ready,
            tahActive: game.modules.get('token-action-hud-core')?.active ?? false,
        }));
        // If this ever runs in a world with TAH enabled, the rest of the file is
        // no longer testing the "not installed" case and should not quietly pass.
        expect(state.tahActive).toBe(false);
        expect(state.ready).toBe(true);
    });

    test('game.megs exposes the documented surface', async ({ page }) => {
        const api = await page.evaluate(() => ({
            keys: Object.keys(game.megs ?? {}).sort(),
            types: Object.fromEntries(
                Object.entries(game.megs ?? {}).map(([k, v]) => [k, typeof v])
            ),
        }));

        expect(api.keys).toEqual([
            'MEGSActor',
            'MEGSItem',
            'MegsTableRolls',
            'RollValues',
            'Utils',
            'rollItemMacro',
        ]);
        expect(api.types.RollValues).toBe('function');
        expect(api.types.MegsTableRolls).toBe('function');
        expect(api.types.Utils).toBe('function');
    });

    test('an outside caller can drive a full MEGS roll through game.megs', async ({ page }) => {
        let actorId;
        try {
            actorId = await createHeroActor(page, prefixName('API_Roll'), { dex: 8 });

            // Exactly what a Token Action HUD attribute button will do: build the
            // roll from game.megs and let the system open its own dialog.
            await page.evaluate((id) => {
                const actor = game.actors.get(id);
                const { RollValues, MegsTableRolls } = game.megs;
                const values = new RollValues(
                    `${actor.name} - Dexterity`, 'attribute', 8, 5, 0, 5, 0, '1d10 + 1d10', false
                );
                const speaker = ChatMessage.getSpeaker({ actor });
                new MegsTableRolls(values, speaker).roll(null, actor.system.heroPoints.value);
            }, actorId);

            // The system's own roll dialog must appear -- proof the integration
            // reuses the real roll path rather than a parallel one.
            await waitForRollDialog(page);

            await page.evaluate(() => {
                const d = document.querySelector('dialog.dialog[open] .megs-dialog');
                d.querySelector('#opposingValue').value = '5';
                d.querySelector('#resistanceValue').value = '3';
            });

            await queueDice(page, [6, 5]); // total 11
            const before = await getChatMessageCount(page);
            await submitRollDialog(page, before);

            const msg = await parseLatestRollMessage(page);
            expect(msg.difficulty).toBe(11);
        } finally {
            await restoreDice(page);
            await closeAllWindows(page);
            if (actorId) await deleteActor(page, actorId);
        }
    });
});
