import { jest } from '@jest/globals';
import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
    showWelcomeMessage,
    WELCOME_FLAG,
    WELCOME_LINKS,
    WELCOME_TEMPLATE,
} from '../helpers/welcome-message.mjs';

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');

/**
 * Builds the slice of `game` and the Foundry functions that showWelcomeMessage uses.
 * @param {object} opts
 * @param {boolean} opts.shown - The current value of the user's welcome flag.
 * @param {Function} opts.create - Stand-in for ChatMessage.create.
 */
function mockDeps({ shown = undefined, create = jest.fn(async (data) => data) } = {}) {
    const setFlag = jest.fn(async () => {});
    const renderTemplate = jest.fn(async () => '<div>card</div>');
    return {
        setFlag,
        renderTemplate,
        create,
        game: {
            user: {
                id: 'user1',
                getFlag: (scope, key) => (scope === 'megs' && key === WELCOME_FLAG ? shown : undefined),
                setFlag,
            },
            i18n: { localize: key => `localized:${key}` },
        },
        deps: { renderTemplate, ChatMessage: { create } },
    };
}

describe('welcome chat card (#309)', () => {
    test('posts the card to a user who has not seen it and sets the flag', async () => {
        const { game, deps, create, setFlag } = mockDeps();
        await expect(showWelcomeMessage(game, deps)).resolves.toBe(true);

        expect(create).toHaveBeenCalledTimes(1);
        const message = create.mock.calls[0][0];
        expect(message.content).toBe('<div>card</div>');
        expect(message.whisper).toEqual(['user1']);
        expect(message.author).toBe('user1');
        expect(message.speaker.alias).toBe('localized:MEGS.Welcome.Speaker');
        expect(setFlag).toHaveBeenCalledWith('megs', WELCOME_FLAG, true);
    });

    test('renders the welcome template with the link constants', async () => {
        const { game, deps, renderTemplate } = mockDeps();
        await showWelcomeMessage(game, deps);
        expect(renderTemplate).toHaveBeenCalledWith(WELCOME_TEMPLATE, { links: WELCOME_LINKS });
    });

    test('does nothing for a user who has already seen it', async () => {
        const { game, deps, create, setFlag, renderTemplate } = mockDeps({ shown: true });
        await expect(showWelcomeMessage(game, deps)).resolves.toBe(false);
        expect(renderTemplate).not.toHaveBeenCalled();
        expect(create).not.toHaveBeenCalled();
        expect(setFlag).not.toHaveBeenCalled();
    });

    test('leaves the flag unset when the card cannot be posted', async () => {
        const create = jest.fn(async () => { throw new Error('no permission'); });
        const { game, deps, setFlag } = mockDeps({ create });
        await expect(showWelcomeMessage(game, deps)).rejects.toThrow('no permission');
        expect(setFlag).not.toHaveBeenCalled();
    });

    test('the template sends each button to its link', () => {
        const relativePath = WELCOME_TEMPLATE.replace('systems/megs/', '');
        const template = readFileSync(join(REPO_ROOT, relativePath), 'utf8');
        for (const key of Object.keys(WELCOME_LINKS)) {
            expect(template).toMatch(new RegExp(`<a[^>]+href="\\{\\{links\\.${key}\\}\\}"[^>]+target="_blank"`));
        }
    });
});
