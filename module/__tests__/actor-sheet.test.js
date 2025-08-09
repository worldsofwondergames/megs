/*
TODO Test skill roll from actor sheet
*/

import { MEGSActorSheet } from '../sheets/actor-sheet.mjs';
import { YesDialog, NoDialog } from '../__mocks__/foundry.mjs';

const actorSheet = new MEGSActorSheet();

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

test('_getEffectValueForAttribute returns the correct effect attribute for an an acting/opposing attribute', () => {
    actorSheet.actor = {
        system: {
            attributes: {
                str: { value: 'str' },
                will: { value: 'will' },
                aura: { value: 'aura' },
            },
        },
    };
    expect(actorSheet._getEffectValueForAttribute('dex')).toBe('str');
    expect(actorSheet._getEffectValueForAttribute('int')).toBe('will');
    expect(actorSheet._getEffectValueForAttribute('infl')).toBe('aura');
});

test('_getResistanceValueForAttribute returns the correct resistance attribute for an acting/opposing attribute', () => {
    const targetActor = {
        system: {
            attributes: {
                body: { value: 'body' },
                mind: { value: 'mind' },
                spirit: { value: 'spirit' },
            },
        },
    };
    expect(actorSheet._getResistanceValueForAttribute('dex', targetActor)).toBe('body');
    expect(actorSheet._getResistanceValueForAttribute('int', targetActor)).toBe('mind');
    expect(actorSheet._getResistanceValueForAttribute('infl', targetActor)).toBe('spirit');
});
