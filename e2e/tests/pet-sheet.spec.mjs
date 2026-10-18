import { test, expect } from '../fixtures/foundry-test.mjs';
import {
    prefixName,
    createHeroActor,
    addPowerToActor,
    deleteActor,
    closeAllWindows,
} from '../fixtures/test-data.mjs';

async function createPetActor(page, name) {
    return page.evaluate(async (name) => {
        const actor = await Actor.create({
            name,
            type: 'pet',
            system: { attributes: { dex: { value: 6 }, str: { value: 2 }, body: { value: 2 } } },
        });
        return actor.id;
    }, name);
}

async function openSheet(page, actorId) {
    await page.evaluate(id => game.actors.get(id).sheet.render(true), actorId);
    await page.waitForFunction(
        id => game.actors.get(id).sheet.rendered,
        actorId,
        { timeout: 10_000 }
    );
    return page.locator(`.sheet.actor.pet`);
}

test.describe('Pet actor sheet (#248)', () => {
    test('Pet is offered as an actor type', async ({ page }) => {
        const offered = await page.evaluate(() => ({
            types: Actor.TYPES,
            label: CONFIG.Actor.typeLabels.pet,
        }));
        expect(offered.types).toContain('pet');
        expect(offered.label).toBe('TYPES.Actor.pet');
    });

    test('a pet sheet opens with its tabs, powers and attributes', async ({ page }) => {
        let petId;
        try {
            petId = await createPetActor(page, prefixName('Pet_Sheet'));
            await addPowerToActor(page, petId, { name: 'Tracking Scent', aps: 5, link: 'int', source: 'physical' });

            const sheet = await openSheet(page, petId);
            await expect(sheet).toBeVisible();

            // Pets have no gadgets or description, so those tabs are left out.
            const tabs = await sheet.locator('.sheet-tabs .item').evaluateAll(els => els.map(e => e.dataset.tab));
            expect(tabs).toEqual(['abilities', 'powers', 'skills', 'traits']);
            await expect(sheet.locator('.tab.gadgets')).toHaveCount(0);
            await expect(sheet.locator('.tab.description, .tab.biography')).toHaveCount(0);

            const dex = await page.evaluate(id => game.actors.get(id).system.attributes.dex.value, petId);
            await expect(sheet.locator('input[name="system.attributes.dex.value"]')).toHaveValue(String(dex));

            await sheet.locator('.sheet-tabs .item[data-tab="powers"]').click();
            await expect(sheet.locator('.tab.powers')).toContainText('Tracking Scent');
        } finally {
            await closeAllWindows(page);
            if (petId) await deleteActor(page, petId);
        }
    });

    test('the owner select lists characters and saves the chosen owner', async ({ page }) => {
        let petId;
        let heroId;
        let otherPetId;
        try {
            heroId = await createHeroActor(page, prefixName('Pet_Owner'));
            otherPetId = await createPetActor(page, prefixName('Pet_NotAnOwner'));
            petId = await createPetActor(page, prefixName('Pet_Owned'));

            const sheet = await openSheet(page, petId);
            const select = sheet.locator('select[name="system.ownerId"]');
            await expect(select).toBeVisible();

            const values = await select.locator('option').evaluateAll(els => els.map(e => e.value));
            expect(values).toContain(heroId);
            expect(values).not.toContain(otherPetId);
            expect(values).not.toContain(petId);

            await select.selectOption(heroId);
            await page.waitForFunction(
                ({ id, owner }) => game.actors.get(id).system.ownerId === owner,
                { id: petId, owner: heroId },
                { timeout: 5_000 }
            );

            // In view mode the owner is shown by name.
            await page.evaluate(id => game.actors.get(id).setFlag('megs', 'edit-mode', false), petId);
            const heroName = await page.evaluate(id => game.actors.get(id).name, heroId);
            await expect(sheet.locator('.pet-owner')).toContainText(heroName);
            await expect(sheet.locator('select[name="system.ownerId"]')).toHaveCount(0);
        } finally {
            await closeAllWindows(page);
            for (const id of [petId, otherPetId, heroId]) {
                if (id) await deleteActor(page, id);
            }
        }
    });
});
