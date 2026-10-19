import { test, expect } from '../fixtures/foundry-test.mjs';

const HELPER = '/systems/megs/module/helpers/welcome-message.mjs';

async function reloadWorld(page) {
    await page.reload({ timeout: 60_000 });
    await page.waitForFunction(
        () => typeof game !== 'undefined' && game.ready === true,
        null,
        { timeout: 60_000 }
    );
}

/** The current user's welcome cards, as stored and as rendered in the chat log. */
async function readWelcomeCards(page) {
    return page.evaluate(async (helperPath) => {
        const { WELCOME_FLAG } = await import(helperPath);
        const messages = game.messages.filter(m => m.getFlag('megs', 'welcome') && m.author?.id === game.user.id);
        return {
            flag: game.user.getFlag('megs', WELCOME_FLAG) ?? null,
            messages: messages.map(m => ({ id: m.id, whisper: [...m.whisper] })),
            rendered: messages.map((m) => {
                const element = document.querySelector(`.chat-log .chat-message[data-message-id="${m.id}"]`);
                if (!element) return null;
                const header = element.querySelector('.message-header');
                return {
                    headerDisplay: header ? getComputedStyle(header).display : 'missing',
                    buttons: [...element.querySelectorAll('a.megs-welcome-button')].map(a => ({
                        href: a.getAttribute('href'),
                        target: a.getAttribute('target'),
                        text: a.textContent.trim(),
                        underline: getComputedStyle(a).textDecorationLine,
                    })),
                };
            }),
        };
    }, HELPER);
}

test.describe('Welcome chat card (#309)', () => {
    test('a user without the flag gets one card with the issue tracker and Ko-fi links', async ({ page }) => {
        const original = await page.evaluate(async (helperPath) => {
            const { WELCOME_FLAG } = await import(helperPath);
            return game.user.getFlag('megs', WELCOME_FLAG) ?? null;
        }, HELPER);

        try {
            // Start from a user who has never seen the card.
            await page.evaluate(async (helperPath) => {
                const { WELCOME_FLAG } = await import(helperPath);
                const old = game.messages.filter(m => m.getFlag('megs', 'welcome') && m.author?.id === game.user.id);
                await ChatMessage.deleteDocuments(old.map(m => m.id));
                await game.user.unsetFlag('megs', WELCOME_FLAG);
            }, HELPER);
            expect((await readWelcomeCards(page)).flag).toBeNull();

            await reloadWorld(page);
            // game.ready is set before the async ready hook finishes posting the card.
            // The flag is set after the card is created, so wait for both.
            await page.waitForFunction(
                () => document.querySelector('.chat-log .chat-message .megs-welcome-message') !== null
                    && game.user.getFlag('megs', 'welcomeMessageShown') === true,
                null,
                { timeout: 15_000 }
            );

            const first = await readWelcomeCards(page);
            expect(first.flag).toBe(true);
            expect(first.messages).toHaveLength(1);
            const userId = await page.evaluate(() => game.user.id);
            expect(first.messages[0].whisper).toEqual([userId]);

            const expected = await page.evaluate(async (helperPath) => {
                const { WELCOME_LINKS } = await import(helperPath);
                return [
                    { href: WELCOME_LINKS.issues, target: '_blank', text: game.i18n.localize('MEGS.Welcome.IssuesButton'), underline: 'none' },
                    { href: WELCOME_LINKS.kofi, target: '_blank', text: game.i18n.localize('MEGS.Welcome.SupportButton'), underline: 'none' },
                ];
            }, HELPER);
            // The header (sender, recipient, time, delete icon) exists but is hidden.
            expect(first.rendered).toEqual([{ headerDisplay: 'none', buttons: expected }]);

            // A second load finds the flag and posts nothing more.
            await reloadWorld(page);
            // The ready hook registers its chatMessage listener after the welcome step, so once
            // that listener exists a second card would already have been created.
            await page.waitForFunction(
                () => (Hooks.events.chatMessage ?? []).some(h => String(h.fn).includes('interceptMegsRoll')),
                null,
                { timeout: 15_000 }
            );
            const second = await readWelcomeCards(page);
            expect(second.messages.map(m => m.id)).toEqual(first.messages.map(m => m.id));
        } finally {
            await page.evaluate(async ({ helperPath, flag }) => {
                const { WELCOME_FLAG } = await import(helperPath);
                const cards = game.messages.filter(m => m.getFlag('megs', 'welcome') && m.author?.id === game.user.id);
                await ChatMessage.deleteDocuments(cards.map(m => m.id));
                if (flag === null) await game.user.unsetFlag('megs', WELCOME_FLAG);
                else await game.user.setFlag('megs', WELCOME_FLAG, flag);
            }, { helperPath: HELPER, flag: original });
        }
    });
});
