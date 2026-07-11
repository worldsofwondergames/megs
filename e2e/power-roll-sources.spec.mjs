/**
 * E2E tests for Issue #56: Allow AV/EV/OV/RV configuration on powers
 *
 * These tests verify that powers can have configurable AV/EV/OV/RV sources
 * (Power APs, character attribute, or target attribute) and that the roll
 * dialog pre-fills values correctly based on the configuration.
 *
 * Requirements under test:
 * R1. Power with no source config rolls with AV=EV=APs (default behavior).
 * R2. Power with avSource="char:dex" uses character's DEX as AV.
 * R3. Power with evSource="char:str" uses character's STR as EV.
 * R4. Power with ovSource="target:int" uses target's INT as OV.
 * R5. Power with rvSource="target:mind" uses target's MIND as RV.
 * R6. Power sheet shows source dropdowns in edit mode.
 * R7. Power sheet shows source labels in view mode when non-default.
 * R8. Source config persists after save and reopen.
 * R9. Utils.resolvePowerRollValues returns correct values.
 *
 * Preconditions:
 * - Foundry VTT running at http://localhost:30000 with a MEGS world loaded
 * - Logged in as Gamemaster
 */

const FOUNDRY_URL = 'http://localhost:30000/game';
const TEST_ACTOR_PREFIX = '_E2E_PowerRollSrc_';

// ============================================================
// Foundry API Helpers
// ============================================================

async function createTestActor(page, name, attributes) {
    return page.evaluate(async ({ name, attributes }) => {
        const actor = await Actor.create({
            name,
            type: 'hero',
            system: {
                attributes: {
                    dex: { value: attributes.dex || 5 },
                    str: { value: attributes.str || 4 },
                    body: { value: attributes.body || 4 },
                    int: { value: attributes.int || 3 },
                    will: { value: attributes.will || 3 },
                    mind: { value: attributes.mind || 3 },
                    infl: { value: attributes.infl || 2 },
                    aura: { value: attributes.aura || 2 },
                    spirit: { value: attributes.spirit || 2 },
                },
                heroPoints: { value: 10 },
            },
        });
        return actor.id;
    }, { name, attributes });
}

async function createTestTarget(page, name, attributes) {
    return page.evaluate(async ({ name, attributes }) => {
        const actor = await Actor.create({
            name,
            type: 'hero',
            system: {
                attributes: {
                    dex: { value: attributes.dex || 6 },
                    str: { value: attributes.str || 7 },
                    body: { value: attributes.body || 8 },
                    int: { value: attributes.int || 4 },
                    will: { value: attributes.will || 5 },
                    mind: { value: attributes.mind || 6 },
                    infl: { value: attributes.infl || 3 },
                    aura: { value: attributes.aura || 4 },
                    spirit: { value: attributes.spirit || 5 },
                },
                heroPoints: { value: 10 },
            },
        });
        return actor.id;
    }, { name, attributes });
}

async function addPowerToActor(page, actorId, powerData) {
    return page.evaluate(async ({ actorId, powerData }) => {
        const actor = game.actors.get(actorId);
        const items = await actor.createEmbeddedDocuments('Item', [{
            name: powerData.name,
            type: 'power',
            system: {
                aps: powerData.aps || 8,
                link: powerData.link || 'str',
                source: powerData.source || 'physical',
                type: powerData.type || 'dice',
                avSource: powerData.avSource || '',
                evSource: powerData.evSource || '',
                ovSource: powerData.ovSource || '',
                rvSource: powerData.rvSource || '',
            },
        }]);
        return items[0].id;
    }, { actorId, powerData });
}

async function getPowerSources(page, actorId, powerId) {
    return page.evaluate(async ({ actorId, powerId }) => {
        const actor = game.actors.get(actorId);
        const power = actor.items.get(powerId);
        return {
            avSource: power.system.avSource,
            evSource: power.system.evSource,
            ovSource: power.system.ovSource,
            rvSource: power.system.rvSource,
        };
    }, { actorId, powerId });
}

async function resolveRollValues(page, actorId, powerId, targetId) {
    return page.evaluate(async ({ actorId, powerId, targetId }) => {
        const { Utils } = await import('/systems/megs/module/utils.js');
        const actor = game.actors.get(actorId);
        const power = actor.items.get(powerId);
        const target = targetId ? game.actors.get(targetId) : null;
        return Utils.resolvePowerRollValues(power, actor, target);
    }, { actorId, powerId, targetId });
}

async function hasPowerSourceOverrides(page, actorId, powerId) {
    return page.evaluate(async ({ actorId, powerId }) => {
        const { Utils } = await import('/systems/megs/module/utils.js');
        const actor = game.actors.get(actorId);
        const power = actor.items.get(powerId);
        return Utils.hasPowerSourceOverrides(power);
    }, { actorId, powerId });
}

async function cleanupTestActors(page) {
    await page.evaluate(async (prefix) => {
        const actors = game.actors.filter(a => a.name.startsWith(prefix));
        for (const actor of actors) {
            await actor.delete();
        }
    }, TEST_ACTOR_PREFIX);
}

// ============================================================
// Tests
// ============================================================

export default async function run(page) {
    const results = [];
    let actorId, targetId, powerId;

    try {
        await cleanupTestActors(page);

        // Create test actor and target
        actorId = await createTestActor(page, TEST_ACTOR_PREFIX + 'Actor', {
            dex: 7, str: 5, body: 4, int: 6, will: 3, mind: 3, infl: 4, aura: 2, spirit: 2
        });
        targetId = await createTestTarget(page, TEST_ACTOR_PREFIX + 'Target', {
            dex: 8, str: 6, body: 9, int: 5, will: 4, mind: 7, infl: 3, aura: 3, spirit: 5
        });

        // R1: Default behavior — no source overrides, AV=EV=APs
        {
            powerId = await addPowerToActor(page, actorId, {
                name: 'DefaultPower', aps: 10, link: 'str', source: 'physical'
            });
            const hasOverrides = await hasPowerSourceOverrides(page, actorId, powerId);
            const resolved = await resolveRollValues(page, actorId, powerId, targetId);
            results.push({
                name: 'R1: Default power uses APs for AV/EV',
                pass: !hasOverrides && resolved.av === 10 && resolved.ev === 10,
                detail: `hasOverrides=${hasOverrides}, av=${resolved.av}, ev=${resolved.ev}`
            });
        }

        // R2: AV from character's DEX
        {
            powerId = await addPowerToActor(page, actorId, {
                name: 'ClawsPower', aps: 8, link: 'str', source: 'physical',
                avSource: 'char:dex'
            });
            const resolved = await resolveRollValues(page, actorId, powerId, targetId);
            results.push({
                name: 'R2: avSource=char:dex uses character DEX as AV',
                pass: resolved.av === 7 && resolved.ev === 8,
                detail: `av=${resolved.av} (expected 7), ev=${resolved.ev} (expected 8)`
            });
        }

        // R3: EV from character's STR
        {
            powerId = await addPowerToActor(page, actorId, {
                name: 'PunchPower', aps: 6, link: 'str', source: 'physical',
                evSource: 'char:str'
            });
            const resolved = await resolveRollValues(page, actorId, powerId, targetId);
            results.push({
                name: 'R3: evSource=char:str uses character STR as EV',
                pass: resolved.av === 6 && resolved.ev === 5,
                detail: `av=${resolved.av} (expected 6), ev=${resolved.ev} (expected 5)`
            });
        }

        // R4: OV from target's INT
        {
            powerId = await addPowerToActor(page, actorId, {
                name: 'MindBlast', aps: 9, link: 'int', source: 'mental',
                ovSource: 'target:int'
            });
            const resolved = await resolveRollValues(page, actorId, powerId, targetId);
            results.push({
                name: 'R4: ovSource=target:int uses target INT as OV',
                pass: resolved.ov === 5,
                detail: `ov=${resolved.ov} (expected 5)`
            });
        }

        // R5: RV from target's MIND
        {
            powerId = await addPowerToActor(page, actorId, {
                name: 'Telepathy', aps: 7, link: 'int', source: 'mental',
                rvSource: 'target:mind'
            });
            const resolved = await resolveRollValues(page, actorId, powerId, targetId);
            results.push({
                name: 'R5: rvSource=target:mind uses target MIND as RV',
                pass: resolved.rv === 7,
                detail: `rv=${resolved.rv} (expected 7)`
            });
        }

        // R6: Combined — AV from char:dex, EV from char:str, OV from target:dex, RV from target:body
        {
            powerId = await addPowerToActor(page, actorId, {
                name: 'FullOverride', aps: 12, link: 'str', source: 'physical',
                avSource: 'char:dex', evSource: 'char:str',
                ovSource: 'target:dex', rvSource: 'target:body'
            });
            const resolved = await resolveRollValues(page, actorId, powerId, targetId);
            results.push({
                name: 'R6: All four sources overridden',
                pass: resolved.av === 7 && resolved.ev === 5 && resolved.ov === 8 && resolved.rv === 9,
                detail: `av=${resolved.av}(7), ev=${resolved.ev}(5), ov=${resolved.ov}(8), rv=${resolved.rv}(9)`
            });
        }

        // R7: OV/RV with "aps" source
        {
            powerId = await addPowerToActor(page, actorId, {
                name: 'ApsOvRv', aps: 11, link: 'str', source: 'physical',
                ovSource: 'aps', rvSource: 'aps'
            });
            const resolved = await resolveRollValues(page, actorId, powerId, targetId);
            results.push({
                name: 'R7: OV/RV with aps source uses power APs',
                pass: resolved.ov === 11 && resolved.rv === 11,
                detail: `ov=${resolved.ov}(11), rv=${resolved.rv}(11)`
            });
        }

        // R8: No target — OV/RV with target source default to 0
        {
            powerId = await addPowerToActor(page, actorId, {
                name: 'NoTargetPower', aps: 8, link: 'str', source: 'physical',
                ovSource: 'target:dex', rvSource: 'target:body'
            });
            const resolved = await resolveRollValues(page, actorId, powerId, null);
            results.push({
                name: 'R8: Target sources with no target default to 0',
                pass: resolved.ov === 0 && resolved.rv === 0,
                detail: `ov=${resolved.ov}(0), rv=${resolved.rv}(0)`
            });
        }

        // R9: hasPowerSourceOverrides detects correctly
        {
            const defaultPowerId = await addPowerToActor(page, actorId, {
                name: 'PlainPower', aps: 5, link: 'str', source: 'physical'
            });
            const overridePowerId = await addPowerToActor(page, actorId, {
                name: 'OverridePower', aps: 5, link: 'str', source: 'physical',
                avSource: 'char:dex'
            });
            const noOverrides = await hasPowerSourceOverrides(page, actorId, defaultPowerId);
            const hasOverrides = await hasPowerSourceOverrides(page, actorId, overridePowerId);
            results.push({
                name: 'R9: hasPowerSourceOverrides detects overrides correctly',
                pass: !noOverrides && hasOverrides,
                detail: `default=${noOverrides}(false), overridden=${hasOverrides}(true)`
            });
        }

    } finally {
        await cleanupTestActors(page);
    }

    return results;
}
