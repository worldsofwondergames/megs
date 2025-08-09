/*
TODO Test skill roll from actor sheet
*/

import { MEGSActorSheet } from '../sheets/actor-sheet.mjs';

const actor = { isOwner: true, _stats: { compendiumSource: false }, setFlag: () => {} };
const actorSheet = new MEGSActorSheet(actor);

test('getData()', () => {
    // TODO
});

test('_prepareCharacterData', () => {
    const actorSheet = new MEGSActorSheet();
    // TODO
});

test('_calculateInitiativeBonus', () => {
    // TODO
});

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
