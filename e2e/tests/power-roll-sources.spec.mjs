import { test, expect } from '../fixtures/foundry-test.mjs';
import { prefixName, createHeroActor, createTargetActor, addPowerToActor, deleteActor, closeAllWindows } from '../fixtures/test-data.mjs';

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

test.describe('Power Roll Sources (#56)', () => {
    let actorId, targetId;

    test.beforeAll(async ({ workerPage }) => {
        actorId = await createHeroActor(workerPage, prefixName('PowerSrc_Actor'), {
            dex: 7, str: 5, body: 4, int: 6, will: 3, mind: 3, infl: 4, aura: 2, spirit: 2
        });
        targetId = await createTargetActor(workerPage, prefixName('PowerSrc_Target'), {
            dex: 8, str: 6, body: 9, int: 5, will: 4, mind: 7, infl: 3, aura: 3, spirit: 5
        });
    });

    test.afterAll(async ({ workerPage }) => {
        if (actorId) await deleteActor(workerPage, actorId);
        if (targetId) await deleteActor(workerPage, targetId);
    });

    test('R1: Default power uses APs for AV/EV', async ({ page }) => {
        const powerId = await addPowerToActor(page, actorId, {
            name: 'DefaultPower', aps: 10, link: 'str', source: 'physical'
        });
        const hasOverrides = await hasPowerSourceOverrides(page, actorId, powerId);
        const resolved = await resolveRollValues(page, actorId, powerId, targetId);
        expect(hasOverrides).toBe(false);
        expect(resolved.av).toBe(10);
        expect(resolved.ev).toBe(10);
    });

    test('R2: avSource=char:dex uses character DEX as AV', async ({ page }) => {
        const powerId = await addPowerToActor(page, actorId, {
            name: 'ClawsPower', aps: 8, link: 'str', source: 'physical',
            avSource: 'char:dex'
        });
        const resolved = await resolveRollValues(page, actorId, powerId, targetId);
        expect(resolved.av).toBe(7);
        expect(resolved.ev).toBe(8);
    });

    test('R3: evSource=char:str uses character STR as EV', async ({ page }) => {
        const powerId = await addPowerToActor(page, actorId, {
            name: 'PunchPower', aps: 6, link: 'str', source: 'physical',
            evSource: 'char:str'
        });
        const resolved = await resolveRollValues(page, actorId, powerId, targetId);
        expect(resolved.av).toBe(6);
        expect(resolved.ev).toBe(5);
    });

    test('R4: ovSource=target:int uses target INT as OV', async ({ page }) => {
        const powerId = await addPowerToActor(page, actorId, {
            name: 'MindBlast', aps: 9, link: 'int', source: 'mental',
            ovSource: 'target:int'
        });
        const resolved = await resolveRollValues(page, actorId, powerId, targetId);
        expect(resolved.ov).toBe(5);
    });

    test('R5: rvSource=target:mind uses target MIND as RV', async ({ page }) => {
        const powerId = await addPowerToActor(page, actorId, {
            name: 'Telepathy', aps: 7, link: 'int', source: 'mental',
            rvSource: 'target:mind'
        });
        const resolved = await resolveRollValues(page, actorId, powerId, targetId);
        expect(resolved.rv).toBe(7);
    });

    test('R6: All four sources overridden', async ({ page }) => {
        const powerId = await addPowerToActor(page, actorId, {
            name: 'FullOverride', aps: 12, link: 'str', source: 'physical',
            avSource: 'char:dex', evSource: 'char:str',
            ovSource: 'target:dex', rvSource: 'target:body'
        });
        const resolved = await resolveRollValues(page, actorId, powerId, targetId);
        expect(resolved.av).toBe(7);
        expect(resolved.ev).toBe(5);
        expect(resolved.ov).toBe(8);
        expect(resolved.rv).toBe(9);
    });

    test('R7: OV/RV with aps source uses power APs', async ({ page }) => {
        const powerId = await addPowerToActor(page, actorId, {
            name: 'ApsOvRv', aps: 11, link: 'str', source: 'physical',
            ovSource: 'aps', rvSource: 'aps'
        });
        const resolved = await resolveRollValues(page, actorId, powerId, targetId);
        expect(resolved.ov).toBe(11);
        expect(resolved.rv).toBe(11);
    });

    test('R8: Target sources with no target default to 0', async ({ page }) => {
        const powerId = await addPowerToActor(page, actorId, {
            name: 'NoTargetPower', aps: 8, link: 'str', source: 'physical',
            ovSource: 'target:dex', rvSource: 'target:body'
        });
        const resolved = await resolveRollValues(page, actorId, powerId, null);
        expect(resolved.ov).toBe(0);
        expect(resolved.rv).toBe(0);
    });

    test('R9: hasPowerSourceOverrides detects overrides correctly', async ({ page }) => {
        const defaultPowerId = await addPowerToActor(page, actorId, {
            name: 'PlainPower', aps: 5, link: 'str', source: 'physical'
        });
        const overridePowerId = await addPowerToActor(page, actorId, {
            name: 'OverridePower', aps: 5, link: 'str', source: 'physical',
            avSource: 'char:dex'
        });
        const noOverrides = await hasPowerSourceOverrides(page, actorId, defaultPowerId);
        const hasOverrides = await hasPowerSourceOverrides(page, actorId, overridePowerId);
        expect(noOverrides).toBe(false);
        expect(hasOverrides).toBe(true);
    });
});
