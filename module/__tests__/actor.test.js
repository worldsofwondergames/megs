import '../__mocks__/foundry.mjs';
import '../__mocks__/item.mjs';
/* global CONFIG, MEGSItem, actorUpdateMock, rollToMessageMock, collectionFindMock, dccRollCreateRollMock, dccItemRollSpellCheckMock, uiNotificationsWarnMock, itemTypesMock, game, test, expect */
/**
 * Tests for Actor.mjs using Foundry Mocks.
 * Mocks for Foundry Classes/Functions are found in __mocks__/foundry.mjs
 * Mocks for MEGSItem Class are found in __mocks__/item.mjs
 * eslint-env jest
 **/

import { MEGSActor } from '../documents/actor.mjs';

// Create Base Test Actor
const actor = new MEGSActor();

test('prepareData sets ability modifiers', () => {
    expect(actor.name).toBe('Anonymous Hero');

    const attributes = actor.system.attributes;
    expect(attributes.dex.value).toEqual(9);
    expect(attributes.str.value).toEqual(5);
    expect(attributes.body.value).toEqual(6);
    expect(attributes.int.value).toEqual(12);
    expect(attributes.will.value).toEqual(12);
    expect(attributes.mind.value).toEqual(10);
    expect(attributes.infl.value).toEqual(10);
    expect(attributes.aura.value).toEqual(8);
    expect(attributes.spirit.value).toEqual(10);
});

test('_hasAbility returns true if ability is present', () => {
    const actor = new MEGSActor();
    const abilities = [{ name: 'Superspeed' }, { name: 'Martial Artist' }];
    expect(actor._hasAbility(abilities, 'Superspeed')).toBe(true);
    expect(actor._hasAbility(abilities, 'Martial Artist')).toBe(true);
    expect(actor._hasAbility(abilities, 'Not Present')).toBe(false);
});

test('_getAbilityAPs returns correct APs for ability', () => {
    const actor = new MEGSActor();
    const abilities = [
        { name: 'Superspeed', system: { aps: 5 } },
        { name: 'Martial Artist', system: { aps: 2 } },
    ];
    expect(actor._getAbilityAPs(abilities, 'Superspeed')).toBe(5);
    expect(actor._getAbilityAPs(abilities, 'Martial Artist')).toBe(2);
    expect(actor._getAbilityAPs(abilities, 'Not Present')).toBe(0);
});

test('_calculateInitiativeBonus returns correct value', () => {
    const actor = new MEGSActor();
    actor.system = {
        attributes: {
            dex: { value: 2 },
            int: { value: 3 },
            infl: { value: 4 },
        },
    };
    actor.items = [
        { name: 'Superspeed', system: { aps: 5 } },
        { name: 'Martial Artist', system: { aps: 0 } },
        { name: 'Lightning Reflexes', system: { aps: 0 } },
    ];
    // Should be 2+3+4+5+2+2 = 18
    expect(actor._calculateInitiativeBonus()).toBe(18);
});
