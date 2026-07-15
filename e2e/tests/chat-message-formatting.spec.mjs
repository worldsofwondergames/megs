import { test, expect } from '../fixtures/foundry-test.mjs';
import {
    prefixName,
    createHeroActor,
    addPowerToActor,
    deleteActor,
    closeAllWindows,
} from '../fixtures/test-data.mjs';
import {
    getChatMessageCount,
    getLatestChatMessage,
    waitForRollDialog,
    submitRollDialog,
    queueDice,
    restoreDice,
} from '../fixtures/roll-helpers.mjs';

test.describe('Chat Message Formatting (#93)', () => {
    test('Chat message includes avatar image after a roll', async ({ page }) => {
        let actorId;
        try {
            actorId = await createHeroActor(page, prefixName('ChatFmt_Avatar'));
            await addPowerToActor(page, actorId, {
                name: 'Flame Project',
                aps: 8,
                link: 'str',
                source: 'physical',
            });

            await queueDice(page, [5, 3]);

            await page.evaluate((id) => {
                const actor = game.actors.get(id);
                const power = actor.items.find(i => i.type === 'power' && i.name === 'Flame Project');
                power.roll();
            }, actorId);

            await waitForRollDialog(page);

            const beforeCount = await getChatMessageCount(page);
            await submitRollDialog(page, beforeCount);

            const msg = await getLatestChatMessage(page);
            expect(msg).not.toBeNull();
            expect(msg.html).toContain('megs-chat-avatar');
        } finally {
            await restoreDice(page);
            await closeAllWindows(page);
            if (actorId) await deleteActor(page, actorId);
        }
    });

    test('Chat message contains collapsible <details> element', async ({ page }) => {
        let actorId;
        try {
            actorId = await createHeroActor(page, prefixName('ChatFmt_Details'));
            await addPowerToActor(page, actorId, {
                name: 'Heat Vision',
                aps: 10,
                link: 'str',
                source: 'physical',
            });

            await queueDice(page, [6, 4]);

            await page.evaluate((id) => {
                const actor = game.actors.get(id);
                const power = actor.items.find(i => i.type === 'power' && i.name === 'Heat Vision');
                power.roll();
            }, actorId);

            await waitForRollDialog(page);

            const beforeCount = await getChatMessageCount(page);
            await submitRollDialog(page, beforeCount);

            const msg = await getLatestChatMessage(page);
            expect(msg).not.toBeNull();
            expect(msg.html).toContain('<details');
        } finally {
            await restoreDice(page);
            await closeAllWindows(page);
            if (actorId) await deleteActor(page, actorId);
        }
    });

    test('Chat message has success or failure styling class', async ({ page }) => {
        let actorId;
        try {
            actorId = await createHeroActor(page, prefixName('ChatFmt_Style'));
            await addPowerToActor(page, actorId, {
                name: 'Super Breath',
                aps: 6,
                link: 'str',
                source: 'physical',
            });

            await queueDice(page, [7, 2]);

            await page.evaluate((id) => {
                const actor = game.actors.get(id);
                const power = actor.items.find(i => i.type === 'power' && i.name === 'Super Breath');
                power.roll();
            }, actorId);

            await waitForRollDialog(page);

            const beforeCount = await getChatMessageCount(page);
            await submitRollDialog(page, beforeCount);

            const msg = await getLatestChatMessage(page);
            expect(msg).not.toBeNull();

            const hasResultStyling = msg.html.includes('success') || msg.html.includes('failure');
            expect(hasResultStyling).toBe(true);
        } finally {
            await restoreDice(page);
            await closeAllWindows(page);
            if (actorId) await deleteActor(page, actorId);
        }
    });

    test('Chat message contains expected roll structure elements', async ({ page }) => {
        let actorId;
        try {
            actorId = await createHeroActor(page, prefixName('ChatFmt_Struct'));
            await addPowerToActor(page, actorId, {
                name: 'Lightning',
                aps: 9,
                link: 'str',
                source: 'physical',
            });

            await queueDice(page, [4, 8]);

            await page.evaluate((id) => {
                const actor = game.actors.get(id);
                const power = actor.items.find(i => i.type === 'power' && i.name === 'Lightning');
                power.roll();
            }, actorId);

            await waitForRollDialog(page);

            const beforeCount = await getChatMessageCount(page);
            await submitRollDialog(page, beforeCount);

            const msg = await getLatestChatMessage(page);
            expect(msg).not.toBeNull();

            expect(msg.html).toContain('megs-chat-roll');
            expect(msg.html).toContain('d10');
            expect(msg.html).toContain('chat-result');
        } finally {
            await restoreDice(page);
            await closeAllWindows(page);
            if (actorId) await deleteActor(page, actorId);
        }
    });
});
