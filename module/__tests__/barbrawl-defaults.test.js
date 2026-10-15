import { jest } from '@jest/globals';
import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { applyBarBrawlDefaults, getMegsBarBrawlDefaults } from '../helpers/barbrawl-defaults.mjs';

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const ACTOR_TYPES = JSON.parse(readFileSync(join(REPO_ROOT, 'template.json'), 'utf8')).Actor.types;

/**
 * Builds the slice of `game` that applyBarBrawlDefaults reads.
 * @param {object} opts
 * @param {boolean|null} opts.barbrawl - true/false for enabled/disabled, null for not installed.
 * @param {boolean} opts.isActiveGM - Whether this client is the active GM.
 * @param {object} opts.stored - The current barbrawl.defaultTypeResources value.
 */
function mockGame({ barbrawl = true, isActiveGM = true, stored = {} } = {}) {
    const set = jest.fn(async () => {});
    return {
        set,
        game: {
            modules: { get: id => (id === 'barbrawl' && barbrawl !== null ? { active: barbrawl } : undefined) },
            users: { activeGM: { isSelf: isActiveGM } },
            settings: {
                get: (module, key) => (module === 'barbrawl' && key === 'defaultTypeResources' ? stored : undefined),
                set,
            },
        },
    };
}

describe('Bar Brawl defaults (#290)', () => {
    test('writes MEGS bars when Bar Brawl is enabled and has no defaults', async () => {
        const { game, set } = mockGame();
        await expect(applyBarBrawlDefaults(game)).resolves.toBe(true);
        expect(set).toHaveBeenCalledTimes(1);
        expect(set).toHaveBeenCalledWith('barbrawl', 'defaultTypeResources', getMegsBarBrawlDefaults());
    });

    test('does nothing when Bar Brawl is installed but disabled', async () => {
        const { game, set } = mockGame({ barbrawl: false });
        await expect(applyBarBrawlDefaults(game)).resolves.toBe(false);
        expect(set).not.toHaveBeenCalled();
    });

    test('does nothing when Bar Brawl is not installed', async () => {
        const { game, set } = mockGame({ barbrawl: null });
        await expect(applyBarBrawlDefaults(game)).resolves.toBe(false);
        expect(set).not.toHaveBeenCalled();
    });

    test('keeps defaults a world already has', async () => {
        const { game, set } = mockGame({ stored: { hero: { bar1: { attribute: 'currentBody' } } } });
        await expect(applyBarBrawlDefaults(game)).resolves.toBe(false);
        expect(set).not.toHaveBeenCalled();
    });

    test('only the active GM writes', async () => {
        const { game, set } = mockGame({ isActiveGM: false });
        await expect(applyBarBrawlDefaults(game)).resolves.toBe(false);
        expect(set).not.toHaveBeenCalled();
    });

    test('every bar points at a field its actor type has in template.json', () => {
        const template = JSON.parse(readFileSync(join(REPO_ROOT, 'template.json'), 'utf8')).Actor;
        for (const [type, bars] of Object.entries(getMegsBarBrawlDefaults())) {
            expect(ACTOR_TYPES).toContain(type);
            const fields = Object.assign({}, ...template[type].templates.map(t => template.templates[t]));
            for (const bar of Object.values(bars)) {
                expect(fields).toHaveProperty(bar.attribute);
            }
        }
    });

    test('other players see hero bars but not villain or NPC bars; owners see all', () => {
        const defaults = getMegsBarBrawlDefaults();
        const others = type => Object.values(defaults[type]).map(bar => bar.otherVisibility);
        expect(others('hero')).toEqual([50, 50, 50]);
        expect(others('villain')).toEqual([0, 0, 0]);
        expect(others('npc')).toEqual([0, 0, 0]);
        for (const bars of Object.values(defaults)) {
            for (const bar of Object.values(bars)) expect(bar.ownerVisibility).toBe(50);
        }
    });
});
