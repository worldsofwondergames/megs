/* eslint-env jest */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

/**
 * These tests read the shipped templates and modules rather than a fixture.
 * English written straight into a template renders the same way in every
 * language, and a screen reader on a Portuguese client reads it out in English,
 * so the checks below fail the build when such text reappears.
 */

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

const EN = JSON.parse(fs.readFileSync(path.join(ROOT, 'lang', 'en.json'), 'utf-8'));
const PT = JSON.parse(fs.readFileSync(path.join(ROOT, 'lang', 'pt.json'), 'utf-8'));

/** Attributes whose value a reader or a screen reader is shown. */
const LOCALIZABLE_ATTRIBUTES = ['aria-label', 'title', 'alt', 'placeholder'];

function collectFiles(dir, extension, skipDirectories = []) {
    const found = [];
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            if (skipDirectories.includes(entry.name)) continue;
            found.push(...collectFiles(full, extension, skipDirectories));
        } else if (entry.name.endsWith(extension)) {
            found.push(full);
        }
    }
    return found;
}

const templates = collectFiles(path.join(ROOT, 'templates'), '.hbs');
const modules = collectFiles(path.join(ROOT, 'module'), '.mjs', ['__mocks__', '__tests__']);

function relative(file) {
    return path.relative(ROOT, file).split(path.sep).join('/');
}

/**
 * What is left of a string once everything a translator does not write is gone:
 * Handlebars expressions, JS interpolations, and HTML tags. A letter still in
 * there is text that was typed in English and will stay English.
 */
function residualText(value) {
    return value
        .replace(/\{\{[^}]*\}\}/g, '')
        .replace(/\$\{[^}]*\}/g, '')
        .replace(/<[^>]*>/g, '');
}

function hasHardcodedText(value) {
    return /[A-Za-z]/.test(residualText(value));
}

/**
 * Index of the closing quote of the literal that opens at `start`. Commas and
 * braces inside a literal are text, not syntax: the CSS in a dialog body's
 * '<p style="font-family: Helvetica, Arial, sans-serif;">' would otherwise end
 * the expression at its first comma and hide the sentence spliced in after it.
 */
function endOfLiteral(contents, start) {
    const quote = contents[start];
    let index = start + 1;
    while (index < contents.length) {
        if (contents[index] === '\\') index += 1;
        else if (contents[index] === quote) return index;
        index += 1;
    }
    return contents.length;
}

/**
 * Read the value of one attribute out of a template.
 *
 * A plain regex cannot: a Handlebars expression inside the value carries its own
 * quotes ({{localize "DOCUMENT.Delete" type="Power"}}), and the first of those
 * would end the match early and hide whatever follows.
 */
function attributeValues(contents, attribute) {
    const values = [];
    const opener = new RegExp(String.raw`${attribute}\s*=\s*['"]`, 'g');
    for (const match of contents.matchAll(opener)) {
        const quote = match[0].at(-1);
        let index = match.index + match[0].length;
        const start = index;
        let depth = 0;
        while (index < contents.length) {
            if (contents.startsWith('{{', index)) {
                depth += 1;
                index += 2;
            } else if (contents.startsWith('}}', index)) {
                depth -= 1;
                index += 2;
            } else if (contents[index] === quote && depth === 0) {
                break;
            } else {
                index += 1;
            }
        }
        values.push(contents.slice(start, index));
    }
    return values;
}

/**
 * Read the whole expression assigned to one property. Taking only the first
 * string literal is not enough: a dialog body is assembled by concatenation, and
 * the opening '<p style="...">' fragment carries no English while the sentence
 * after it does.
 */
function propertyValues(contents, property) {
    const values = [];
    const opener = new RegExp(String.raw`\b${property}:\s*`, 'g');
    for (const match of contents.matchAll(opener)) {
        let index = match.index + match[0].length;
        const start = index;
        let depth = 0;
        while (index < contents.length) {
            const character = contents[index];
            if (character === "'" || character === '"' || character === '`') {
                index = endOfLiteral(contents, index);
            } else if ('([{'.includes(character)) {
                depth += 1;
            } else if (')]}'.includes(character)) {
                if (depth === 0) break;
                depth -= 1;
            } else if (character === ',' && depth === 0) {
                break;
            }
            index += 1;
        }
        values.push(contents.slice(start, index));
    }
    return values;
}

function stringLiterals(expression) {
    // A key handed to game.i18n is not display text, and reads as English on its
    // own ('MEGS.ConfirmDeleteWarning'), so drop those calls before looking.
    const withoutKeys = expression.replace(/game\.i18n\.\w+\([^)]*\)/g, '');
    return [...withoutKeys.matchAll(/'([^']*)'|"([^"]*)"|`([^`]*)`/g)].map((match) => {
        return match[1] ?? match[2] ?? match[3];
    });
}

function lookup(dictionary, key) {
    return key.split('.').reduce((node, part) => {
        return node && typeof node === 'object' ? node[part] : undefined;
    }, dictionary);
}

function flatten(node, prefix = '') {
    return Object.entries(node).flatMap(([key, value]) => {
        return typeof value === 'object' && value !== null
            ? flatten(value, `${prefix}${key}.`)
            : [`${prefix}${key}`];
    });
}

describe('templates localize the text they show', () => {
    test.each(LOCALIZABLE_ATTRIBUTES)('no hardcoded %s value', (attribute) => {
        const offenders = [];
        for (const file of templates) {
            for (const value of attributeValues(fs.readFileSync(file, 'utf-8'), attribute)) {
                if (hasHardcodedText(value)) {
                    offenders.push(`${relative(file)}: ${attribute}="${value}"`);
                }
            }
        }
        expect(offenders).toEqual([]);
    });
});

describe('modules localize the text they show', () => {
    test('no notification is raised with a literal message', () => {
        const offenders = [];
        for (const file of modules) {
            const contents = fs.readFileSync(file, 'utf-8');
            for (const match of contents.matchAll(/ui\.notifications\.\w+\(\s*['"`]/g)) {
                offenders.push(`${relative(file)}: ${match[0].trim()}`);
            }
        }
        expect(offenders).toEqual([]);
    });

    test.each(['title', 'content'])('no dialog %s is built from English text', (property) => {
        const offenders = [];
        for (const file of modules) {
            const contents = fs.readFileSync(file, 'utf-8');
            for (const expression of propertyValues(contents, property)) {
                for (const literal of stringLiterals(expression)) {
                    if (hasHardcodedText(literal)) {
                        offenders.push(`${relative(file)}: ${property}: ${literal}`);
                    }
                }
            }
        }
        expect(offenders).toEqual([]);
    });
});

describe('localization keys resolve', () => {
    const referenced = new Map();
    const record = (key, file) => {
        if (!referenced.has(key)) referenced.set(key, []);
        referenced.get(key).push(relative(file));
    };

    for (const file of templates) {
        const contents = fs.readFileSync(file, 'utf-8');
        for (const match of contents.matchAll(/\{\{localize\s+['"]([^'"]+)['"]/g)) {
            record(match[1], file);
        }
    }
    for (const file of modules) {
        const contents = fs.readFileSync(file, 'utf-8');
        for (const match of contents.matchAll(/game\.i18n\.(?:localize|format)\(\s*['"]([^'"]+)['"]/g)) {
            record(match[1], file);
        }
    }

    // Keys outside the MEGS namespace (DOCUMENT.Create, EFFECT.TabDuration, Yes)
    // come from Foundry's own dictionaries, which this system does not ship.
    const systemKeys = [...referenced.entries()].filter(([key]) => key.startsWith('MEGS.'));

    test('every MEGS key a template or module asks for is defined in English', () => {
        const missing = systemKeys
            .filter(([key]) => typeof lookup(EN, key) !== 'string')
            .map(([key, files]) => `${key} (${files.join(', ')})`);
        expect(missing).toEqual([]);
    });

    test('every MEGS key a template or module asks for is translated to Portuguese', () => {
        const missing = systemKeys
            .filter(([key]) => typeof lookup(PT, key) !== 'string')
            .map(([key, files]) => `${key} (${files.join(', ')})`);
        expect(missing).toEqual([]);
    });

    test('the two dictionaries define the same keys', () => {
        expect(flatten(PT).sort()).toEqual(flatten(EN).sort());
    });

    test('a key that takes a placeholder declares the same one in both dictionaries', () => {
        const placeholders = (text) => (text.match(/\{\w+\}/g) ?? []).sort();
        const mismatched = flatten(EN)
            .filter((key) => placeholders(lookup(EN, key)).length > 0)
            .filter((key) => {
                return placeholders(lookup(EN, key)).join() !== placeholders(lookup(PT, key) ?? '').join();
            });
        expect(mismatched).toEqual([]);
    });
});
