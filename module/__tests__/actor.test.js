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
