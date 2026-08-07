import { readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { MegsTableRolls, RollValues } from '../dice.mjs';

// Resolved from this file rather than process.cwd(), so the tests scan the repo
// they live in no matter where jest is invoked from.
const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');

/**
 * Issue #156: the Token Action HUD integration ships as a separate Foundry
 * module and reaches the system only through `game.megs`. These tests pin the
 * two halves of that arrangement:
 *
 *  1. The classes an outside integration needs are exported and usable.
 *  2. The system itself carries no knowledge of Token Action HUD, so not having
 *     it installed cannot affect anything (requirement R1).
 */

describe('game.megs public API (#156)', () => {
    test('megs.mjs puts RollValues and MegsTableRolls on game.megs', () => {
        const source = readFileSync(join(REPO_ROOT, 'module', 'megs.mjs'), 'utf8');
        const assignment = /game\.megs\s*=\s*\{([^}]*)\}/.exec(source);
        expect(assignment).not.toBeNull();

        const body = assignment[1];
        expect(body).toMatch(/\bRollValues\b/);
        expect(body).toMatch(/\bMegsTableRolls\b/);
        // The pre-existing surface must not be dropped while adding to it.
        expect(body).toMatch(/\bMEGSActor\b/);
        expect(body).toMatch(/\bMEGSItem\b/);
        expect(body).toMatch(/\brollItemMacro\b/);
    });

    test('RollValues and MegsTableRolls are constructible classes', () => {
        expect(typeof RollValues).toBe('function');
        expect(typeof MegsTableRolls).toBe('function');
    });

    test('an integration can build a roll from attribute data alone', () => {
        // Mirrors what actor-sheet._onRoll() does, which is the path a Token
        // Action HUD attribute button has to reproduce.
        const values = new RollValues(
            'Hero - Dexterity', 'attribute', 8, 8, 0, 4, 0, '1d10 + 1d10', false
        );
        const rolls = new MegsTableRolls(values);

        expect(rolls.actionValue).toBe(8);
        expect(rolls.effectValue).toBe(4);
        expect(rolls.valueOrAps).toBe(8);
        expect(rolls.type).toBe('attribute');
        expect(rolls.rollFormula).toBe('1d10 + 1d10');
        expect(typeof rolls.roll).toBe('function');
    });

    test('MegsTableRolls accepts an optional speaker without altering roll values', () => {
        const values = new RollValues('X', 'skill', 3, 3, 0, 0, 0, '1d10 + 1d10', true);
        const speaker = { alias: 'Token Action HUD' };
        const rolls = new MegsTableRolls(values, speaker);

        expect(rolls.speaker).toBe(speaker);
        expect(rolls.isUnskilled).toBe(true);
        expect(rolls.actionValue).toBe(3);
    });
});

describe('no Token Action HUD coupling in the system (#156 R1)', () => {
    const SEARCH_DIRS = ['module', 'templates', 'src', 'lang'];
    const SEARCH_FILES = ['system.json', 'template.json'];

    function collectFiles(dir) {
        const out = [];
        let entries;
        try {
            entries = readdirSync(dir);
        } catch {
            return out;
        }
        for (const entry of entries) {
            const full = join(dir, entry);
            if (statSync(full).isDirectory()) out.push(...collectFiles(full));
            else out.push(full);
        }
        return out;
    }

    test('nothing in the system references Token Action HUD', () => {
        const files = [
            ...SEARCH_DIRS.flatMap(d => collectFiles(join(REPO_ROOT, d))),
            ...SEARCH_FILES.map(f => join(REPO_ROOT, f)),
        ];
        // Guard against the search silently covering nothing.
        expect(files.length).toBeGreaterThan(50);

        const offenders = files.filter((file) => {
            let text;
            try {
                text = readFileSync(file, 'utf8');
            } catch {
                return false;
            }
            return /token-?action-?hud/i.test(text);
        });

        expect(offenders).toEqual([]);
    });
});
