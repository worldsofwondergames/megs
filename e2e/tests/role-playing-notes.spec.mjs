import { test, expect } from '../fixtures/foundry-test.mjs';
import {
    prefixName,
    deleteActor,
    openActorSheet,
    closeAllWindows,
} from '../fixtures/test-data.mjs';

/**
 * Issue #285: Role Playing Notes rich-text field below Biography on the
 * Description tab of hero, villain and NPC sheets.
 */
test.describe('Role Playing Notes (#285)', () => {
    async function createActor(page, name, type, system = {}) {
        return page.evaluate(async ({ name, type, system }) => {
            const actor = await Actor.create({ name, type, system });
            return actor.id;
        }, { name, type, system });
    }

    async function setEditMode(page, actorId, on) {
        await page.evaluate(async ({ actorId, on }) => {
            await game.actors.get(actorId).setFlag('megs', 'edit-mode', on);
        }, { actorId, on });
    }

    /** The Description tab's class is "biography", so open it by data-tab. */
    async function openDescriptionTab(page, actorId) {
        await openActorSheet(page, actorId);
        await page.click('.sheet.actor nav.sheet-tabs .item[data-tab="description"]');
        await page.waitForFunction(
            () => document.querySelector('.sheet.actor .tab[data-tab="description"]')?.classList.contains('active'),
            null,
            { timeout: 5000 }
        );
    }

    /** Labels of the Description tab's sections, in page order, with their text. */
    async function readDescriptionTab(page) {
        return page.evaluate(() => {
            const tab = document.querySelector('.sheet.actor .tab[data-tab="description"]');
            if (!tab) return null;
            return [...tab.querySelectorAll('section.description-item')].map(section => ({
                label: section.querySelector('label')?.textContent.trim(),
                html: section.querySelector('.indentLeft')?.innerHTML.trim(),
                text: section.querySelector('.indentLeft')?.textContent.trim(),
            }));
        });
    }

    const labels = (page) => page.evaluate(() => ({
        notes: game.i18n.localize('MEGS.RolePlayingNotes'),
        biography: game.i18n.localize('MEGS.Biography'),
        none: game.i18n.localize('MEGS.None'),
    }));

    for (const type of ['hero', 'villain', 'npc']) {
        test(`${type} sheet shows the notes below Biography in view mode`, async ({ page }) => {
            let actorId;
            try {
                actorId = await createActor(page, prefixName(`RPNotes_${type}`), type, {
                    biography: '<p>Bio text</p>',
                    rolePlayingNotes: '<p>Plays it <strong>cool</strong></p>',
                });
                await setEditMode(page, actorId, false);
                await openDescriptionTab(page, actorId);
                const { notes, biography } = await labels(page);

                const sections = await readDescriptionTab(page);
                const order = sections.map(s => s.label);
                expect(order).toContain(notes);
                expect(order.indexOf(notes)).toBe(order.indexOf(biography) + 1);

                const section = sections.find(s => s.label === notes);
                expect(section.text).toBe('Plays it cool');
                expect(section.html).toContain('<strong>cool</strong>');
            } finally {
                await closeAllWindows(page);
                if (actorId) await deleteActor(page, actorId);
            }
        });
    }

    test('empty notes show (None) in view mode', async ({ page }) => {
        let actorId;
        try {
            actorId = await createActor(page, prefixName('RPNotes_Empty'), 'hero');
            await setEditMode(page, actorId, false);
            await openDescriptionTab(page, actorId);
            const { notes, none } = await labels(page);

            const section = (await readDescriptionTab(page)).find(s => s.label === notes);
            expect(section).toBeTruthy();
            expect(section.text).toBe(`(${none})`);
        } finally {
            await closeAllWindows(page);
            if (actorId) await deleteActor(page, actorId);
        }
    });

    test('edit mode shows an editor bound to system.rolePlayingNotes with its content', async ({ page }) => {
        let actorId;
        try {
            actorId = await createActor(page, prefixName('RPNotes_Edit'), 'hero', {
                rolePlayingNotes: '<p>Edit me</p>',
            });
            await setEditMode(page, actorId, true);
            await openDescriptionTab(page, actorId);
            const { notes } = await labels(page);

            const editor = await page.evaluate(() => {
                const tab = document.querySelector('.sheet.actor .tab[data-tab="description"]');
                const label = tab.querySelector('label.role-playing-notes-label');
                const target = tab.querySelector('[data-edit="system.rolePlayingNotes"]');
                const biographyTarget = tab.querySelector('[data-edit="system.biography"]');
                return {
                    label: label?.textContent.trim(),
                    content: target?.textContent.trim(),
                    // The notes editor comes after the biography editor
                    afterBiography: !!(biographyTarget && target
                        && (biographyTarget.compareDocumentPosition(target) & Node.DOCUMENT_POSITION_FOLLOWING)),
                };
            });
            expect(editor.label).toBe(notes);
            expect(editor.content).toBe('Edit me');
            expect(editor.afterBiography).toBe(true);
        } finally {
            await closeAllWindows(page);
            if (actorId) await deleteActor(page, actorId);
        }
    });

    test('text saved in the notes editor persists to the actor and leaves Biography alone', async ({ page }) => {
        let actorId;
        try {
            actorId = await createActor(page, prefixName('RPNotes_Save'), 'hero', {
                biography: '<p>Bio stays</p>',
                rolePlayingNotes: '<p>Old notes</p>',
            });
            await setEditMode(page, actorId, true);
            await openDescriptionTab(page, actorId);

            const notesEditor = page.locator('.sheet.actor .tab[data-tab="description"] .editor')
                .filter({ has: page.locator('[data-edit="system.rolePlayingNotes"]') });
            await notesEditor.locator('.editor-edit').click();
            const prose = page.locator('.sheet.actor .tab[data-tab="description"] .ProseMirror');
            await expect(prose).toHaveCount(1);
            await prose.click();
            await page.keyboard.press('Control+A');
            await page.keyboard.type('New notes');
            await page.locator('.sheet.actor .tab[data-tab="description"] .editor-menu [data-action="save"]').click();

            await page.waitForFunction(
                (id) => game.actors.get(id).system.rolePlayingNotes.includes('New notes'),
                actorId,
                { timeout: 5000 }
            );
            const saved = await page.evaluate((id) => {
                const system = game.actors.get(id).system;
                return { notes: system.rolePlayingNotes, biography: system.biography };
            }, actorId);
            expect(saved.notes).toBe('<p>New notes</p>');
            expect(saved.biography).toBe('<p>Bio stays</p>');
        } finally {
            await closeAllWindows(page);
            if (actorId) await deleteActor(page, actorId);
        }
    });

    test('location sheet has no Role Playing Notes', async ({ page }) => {
        let actorId;
        try {
            actorId = await createActor(page, prefixName('RPNotes_Location'), 'location');
            await setEditMode(page, actorId, false);
            await openDescriptionTab(page, actorId);
            const { notes, biography } = await labels(page);

            const order = (await readDescriptionTab(page)).map(s => s.label);
            // Presence first: the tab rendered its Biography section
            expect(order).toContain(biography);
            expect(order).not.toContain(notes);
            const hasField = await page.evaluate((id) => 'rolePlayingNotes' in game.actors.get(id).system, actorId);
            expect(hasField).toBe(false);
        } finally {
            await closeAllWindows(page);
            if (actorId) await deleteActor(page, actorId);
        }
    });
});
