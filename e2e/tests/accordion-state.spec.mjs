import { test, expect } from '../fixtures/foundry-test.mjs';
import {
    prefixName,
    createHeroActor,
    addSkillToActor,
    addPowerToActor,
    deleteActor,
    openActorSheet,
    closeAllWindows,
} from '../fixtures/test-data.mjs';

test.describe('Accordion State Persistence (#67)', () => {
    test('Expanded skill row stays expanded after re-render', async ({ page }) => {
        // KNOWN BUG #242: accordion state is lost on re-renders that don't go
        // through the instrumented handlers. Remove this once #242 is fixed.
        test.fail();
        let actorId;
        try {
            actorId = await createHeroActor(page, prefixName('Accordion_Expand'));
            await addSkillToActor(page, actorId, {
                name: 'Acrobatics',
                aps: 4,
                link: 'dex',
            });

            await openActorSheet(page, actorId, 'skills');

            // Find the skill row and click the toggle icon to expand it
            await page.evaluate((actorId) => {
                const sheet = document.querySelector('.sheet.actor');
                const skillRows = sheet.querySelectorAll('.tab.skills .skill-row');
                for (const row of skillRows) {
                    const icon = row.querySelector('.toggle-icon');
                    if (icon) {
                        icon.click();
                        break;
                    }
                }
            }, actorId);

            // Wait a moment for the toggle animation
            await page.waitForTimeout(300);

            // Verify it is expanded (icon should be chevron-down)
            const expandedBefore = await page.evaluate(() => {
                const row = document.querySelector('.sheet.actor .tab.skills .skill-row');
                const icon = row?.querySelector('.toggle-icon');
                return icon?.classList.contains('fa-chevron-down') || false;
            });
            expect(expandedBefore).toBe(true);

            // Trigger a re-render via the actor sheet
            await page.evaluate((actorId) => {
                const actor = game.actors.get(actorId);
                actor.sheet.render(true);
            }, actorId);

            // Wait for the sheet to re-render
            await page.waitForSelector('.sheet.actor .tab.skills .skill-row', { timeout: 5000 });
            await page.waitForTimeout(300);

            // Verify the expanded state was restored
            const expandedAfter = await page.evaluate(() => {
                const row = document.querySelector('.sheet.actor .tab.skills .skill-row');
                const icon = row?.querySelector('.toggle-icon');
                return icon?.classList.contains('fa-chevron-down') || false;
            });
            expect(expandedAfter).toBe(true);
        } finally {
            await closeAllWindows(page);
            if (actorId) await deleteActor(page, actorId);
        }
    });

    test('Collapsed skill row stays collapsed after re-render', async ({ page }) => {
        let actorId;
        try {
            actorId = await createHeroActor(page, prefixName('Accordion_Collapse'));
            await addSkillToActor(page, actorId, {
                name: 'Detective',
                aps: 5,
                link: 'int',
            });

            await openActorSheet(page, actorId, 'skills');

            // The default state is collapsed (data-expanded='false', fa-chevron-right)
            // Verify it starts collapsed
            const collapsedBefore = await page.evaluate(() => {
                const row = document.querySelector('.sheet.actor .tab.skills .skill-row');
                const icon = row?.querySelector('.toggle-icon');
                return icon?.classList.contains('fa-chevron-right') || false;
            });
            expect(collapsedBefore).toBe(true);

            // Trigger re-render
            await page.evaluate((actorId) => {
                const actor = game.actors.get(actorId);
                actor.sheet.render(true);
            }, actorId);

            await page.waitForSelector('.sheet.actor .tab.skills .skill-row', { timeout: 5000 });
            await page.waitForTimeout(300);

            // Verify it remains collapsed after re-render
            const collapsedAfter = await page.evaluate(() => {
                const row = document.querySelector('.sheet.actor .tab.skills .skill-row');
                const icon = row?.querySelector('.toggle-icon');
                return icon?.classList.contains('fa-chevron-right') || false;
            });
            expect(collapsedAfter).toBe(true);
        } finally {
            await closeAllWindows(page);
            if (actorId) await deleteActor(page, actorId);
        }
    });

    test('Mixed accordion states survive re-render independently', async ({ page }) => {
        // KNOWN BUG #242: accordion state is lost on re-renders that don't go
        // through the instrumented handlers. Remove this once #242 is fixed.
        test.fail();
        let actorId;
        try {
            actorId = await createHeroActor(page, prefixName('Accordion_Mixed'));
            const skillId1 = await addSkillToActor(page, actorId, {
                name: 'Acrobatics',
                aps: 4,
                link: 'dex',
            });
            const skillId2 = await addSkillToActor(page, actorId, {
                name: 'Thief',
                aps: 3,
                link: 'dex',
            });

            await openActorSheet(page, actorId, 'skills');

            // Expand only the first skill row (Acrobatics comes first alphabetically)
            await page.evaluate((id1) => {
                const sheet = document.querySelector('.sheet.actor');
                const rows = sheet.querySelectorAll('.tab.skills .skill-row');
                for (const row of rows) {
                    if (row.dataset.itemId === id1) {
                        const icon = row.querySelector('.toggle-icon');
                        if (icon) icon.click();
                        break;
                    }
                }
            }, skillId1);

            await page.waitForTimeout(300);

            // Verify: first expanded, second collapsed
            const statesBefore = await page.evaluate(({ id1, id2 }) => {
                const sheet = document.querySelector('.sheet.actor');
                const rows = sheet.querySelectorAll('.tab.skills .skill-row');
                const result = {};
                for (const row of rows) {
                    const icon = row.querySelector('.toggle-icon');
                    if (row.dataset.itemId === id1) {
                        result.first = icon?.classList.contains('fa-chevron-down') || false;
                    }
                    if (row.dataset.itemId === id2) {
                        result.second = icon?.classList.contains('fa-chevron-right') || false;
                    }
                }
                return result;
            }, { id1: skillId1, id2: skillId2 });

            expect(statesBefore.first).toBe(true);
            expect(statesBefore.second).toBe(true);

            // Trigger re-render
            await page.evaluate((actorId) => {
                const actor = game.actors.get(actorId);
                actor.sheet.render(true);
            }, actorId);

            await page.waitForSelector('.sheet.actor .tab.skills .skill-row', { timeout: 5000 });
            await page.waitForTimeout(300);

            // Verify: first still expanded, second still collapsed
            const statesAfter = await page.evaluate(({ id1, id2 }) => {
                const sheet = document.querySelector('.sheet.actor');
                const rows = sheet.querySelectorAll('.tab.skills .skill-row');
                const result = {};
                for (const row of rows) {
                    const icon = row.querySelector('.toggle-icon');
                    if (row.dataset.itemId === id1) {
                        result.first = icon?.classList.contains('fa-chevron-down') || false;
                    }
                    if (row.dataset.itemId === id2) {
                        result.second = icon?.classList.contains('fa-chevron-right') || false;
                    }
                }
                return result;
            }, { id1: skillId1, id2: skillId2 });

            expect(statesAfter.first).toBe(true);
            expect(statesAfter.second).toBe(true);
        } finally {
            await closeAllWindows(page);
            if (actorId) await deleteActor(page, actorId);
        }
    });
});
