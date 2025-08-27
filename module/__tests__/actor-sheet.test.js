/*
TODO Test skill roll from actor sheet
*/

import { MEGSActorSheet } from '../sheets/actor-sheet.mjs';

const actor = { isOwner: true, _stats: { compendiumSource: false }, setFlag: () => {} };
const actorSheet = new MEGSActorSheet(actor);

test('_hasAbility', () => {
    const powers = [
        { name: 'Superspeed' },
        { name: 'Some other power' },
        { name: 'A third power' },
    ];
    expect(actorSheet._hasAbility(powers, 'Power not had')).toBe(false);
    expect(actorSheet._hasAbility(powers, 'Superspeed')).toBe(true);
});

test('_getAbilityAPs', () => {
    const powers = [
        { name: 'Superspeed', system: { aps: 10 } },
        { name: 'Some other power', system: { aps: 0 } },
        { name: 'A third power', system: {} },
        { name: 'A fourth power' },
    ];
    expect(actorSheet._getAbilityAPs(powers, 'Power not had')).toStrictEqual(0);
    expect(actorSheet._getAbilityAPs(powers, 'Some other power')).toStrictEqual(0);
    expect(actorSheet._getAbilityAPs(powers, 'A third power')).toStrictEqual(0);
    expect(actorSheet._getAbilityAPs(powers, 'A fourth power')).toStrictEqual(0);
    expect(actorSheet._getAbilityAPs(powers, 'Superspeed')).toStrictEqual(10);
});

test('_hasAbility returns true if power is present', () => {
    const powers = [{ name: 'Superspeed' }, { name: 'Flight' }];
    expect(actorSheet._hasAbility(powers, 'Superspeed')).toBe(true);
    expect(actorSheet._hasAbility(powers, 'Flight')).toBe(true);
    expect(actorSheet._hasAbility(powers, 'Invisibility')).toBe(false);
});

test('_getAbilityAPs returns correct APs for power', () => {
    const powers = [
        { name: 'Superspeed', system: { aps: 7 } },
        { name: 'Flight', system: { aps: 3 } },
    ];
    expect(actorSheet._getAbilityAPs(powers, 'Superspeed')).toBe(7);
    expect(actorSheet._getAbilityAPs(powers, 'Flight')).toBe(3);
    expect(actorSheet._getAbilityAPs(powers, 'Invisibility')).toBe(0);
});
