import { test, expect } from '../fixtures/foundry-test.mjs';

/**
 * Category 1 of #226: System Initialization.
 * Verifies the world is running the MEGS system with its data files,
 * settings, compendium packs, and templates loaded.
 */
test.describe('System Initialization (#226 cat 1)', () => {
    test('World is ready and running the MEGS system', async ({ page }) => {
        const info = await page.evaluate(() => ({
            ready: game.ready,
            systemId: game.system.id,
            userIsGM: game.user.isGM,
        }));
        expect(info.ready).toBe(true);
        expect(info.systemId).toBe('megs');
        expect(info.userIsGM).toBe(true);
    });

    test('System data files are loaded into CONFIG', async ({ page }) => {
        const config = await page.evaluate(() => ({
            actionTableRows: CONFIG.tables?.actionTable?.length ?? 0,
            resultTableRows: CONFIG.tables?.resultTable?.length ?? 0,
            rangeCount: CONFIG.tables?.ranges?.length ?? 0,
            maneuvers: CONFIG.combatManeuvers ? Object.keys(CONFIG.combatManeuvers) : [],
            hasApCostChart: !!CONFIG.apCostChart?.chart,
        }));
        expect(config.actionTableRows).toBeGreaterThan(0);
        expect(config.resultTableRows).toBeGreaterThan(0);
        expect(config.rangeCount).toBeGreaterThan(0);
        expect(config.maneuvers).toContain('Critical Blow');
        expect(config.hasApCostChart).toBe(true);
    });

    test('System settings are registered and accessible', async ({ page }) => {
        const settings = await page.evaluate(() => {
            const keys = [
                'showHeroPointCosts',
                'showActiveEffects',
                'debugLogging',
                'allowSkillDeletion',
            ];
            const out = {};
            for (const key of keys) {
                out[key] = {
                    registered: game.settings.settings.has(`megs.${key}`),
                    value: game.settings.settings.has(`megs.${key}`)
                        ? typeof game.settings.get('megs', key)
                        : null,
                };
            }
            return out;
        });
        for (const [key, info] of Object.entries(settings)) {
            expect(info.registered, `setting megs.${key} registered`).toBe(true);
            expect(info.value, `setting megs.${key} readable`).toBe('boolean');
        }
    });

    test('System compendium packs load correctly', async ({ page }) => {
        const packs = await page.evaluate(async () => {
            const names = ['megs.powers', 'megs.advantages', 'megs.drawbacks', 'megs.bonuses', 'megs.limitations'];
            const out = {};
            for (const name of names) {
                const pack = game.packs.get(name);
                if (!pack) {
                    out[name] = { exists: false, size: 0 };
                    continue;
                }
                const index = await pack.getIndex();
                out[name] = { exists: true, size: index.size };
            }
            return out;
        });
        for (const [name, info] of Object.entries(packs)) {
            expect(info.exists, `pack ${name} exists`).toBe(true);
            expect(info.size, `pack ${name} has entries`).toBeGreaterThan(0);
        }
    });

    test('Handlebars templates are compiled and registered', async ({ page }) => {
        const partials = await page.evaluate(() => {
            const expected = [
                'systems/megs/templates/actor/parts/actor-attributes.hbs',
                'systems/megs/templates/actor/parts/actor-header.hbs',
                'systems/megs/templates/actor/parts/actor-powers.hbs',
                'systems/megs/templates/actor/parts/actor-skills.hbs',
                'systems/megs/templates/actor/parts/actor-traits.hbs',
                'systems/megs/templates/actor/parts/actor-gadgets.hbs',
            ];
            return expected.map(path => ({ path, registered: path in Handlebars.partials }));
        });
        for (const { path, registered } of partials) {
            expect(registered, `partial ${path}`).toBe(true);
        }
    });

    test('World reloads without MEGS console errors', async ({ page }) => {
        const errors = [];
        const onConsole = (msg) => {
            if (msg.type() === 'error') {
                errors.push(msg.text());
            }
        };
        const onPageError = (err) => errors.push(String(err.message ?? err));
        page.on('console', onConsole);
        page.on('pageerror', onPageError);
        try {
            await page.reload({ timeout: 60_000 });
            await page.waitForFunction(
                () => typeof game !== 'undefined' && game.ready === true,
                null,
                { timeout: 60_000 }
            );
        } finally {
            page.off('console', onConsole);
            page.off('pageerror', onPageError);
        }

        // Only fail on errors attributable to the MEGS system, not to
        // unrelated modules installed in the test world.
        const megsErrors = errors.filter(text =>
            /systems\/megs|\[MEGS\]|megs\.mjs|Handlebars/i.test(text) &&
            !/modules\//.test(text)
        );
        expect(megsErrors).toEqual([]);
    });
});
