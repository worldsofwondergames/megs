/*
TODO Test skill roll from actor sheet
*/

import { jest } from '@jest/globals';
import { MEGSActorSheet } from '../sheets/actor-sheet.mjs';

const actor = { isOwner: true, _stats: { compendiumSource: false }, setFlag: () => {} };
const actorSheet = new MEGSActorSheet(actor);

/** Build an actor document stand-in with a controllable stored edit-mode flag. */
function mockDocument({ isOwner = true, compendiumSource = null, storedFlag } = {}) {
    return {
        isOwner,
        _stats: { compendiumSource },
        getFlag: jest.fn(() => storedFlag),
        setFlag: jest.fn(),
    };
}

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

// --- edit-mode (issue #243) ---------------------------------------------------

test('constructor does not write the edit-mode flag', () => {
    const doc = mockDocument();
    new MEGSActorSheet(doc, {});
    // Writing a flag from the constructor races the first render: the render
    // reads the old value, then the un-awaited write triggers a second render.
    expect(doc.setFlag).not.toHaveBeenCalled();
});

test('isEditMode defaults to unlocked for an owner with no stored flag', () => {
    const sheet = new MEGSActorSheet(mockDocument({ storedFlag: undefined }), {});
    expect(sheet.isEditMode).toBe(true);
});

test('isEditMode honours a stored false flag for an owner', () => {
    const sheet = new MEGSActorSheet(mockDocument({ storedFlag: false }), {});
    expect(sheet.isEditMode).toBe(false);
});

test('isEditMode defaults to locked for a non-owner', () => {
    const sheet = new MEGSActorSheet(mockDocument({ isOwner: false }), {});
    expect(sheet.isEditMode).toBe(false);
});

test('_toggleEditMode locks a sheet that is unlocked by default', async () => {
    const doc = mockDocument({ storedFlag: undefined });
    const sheet = new MEGSActorSheet(doc, {});
    sheet.render = () => {};

    await sheet._toggleEditMode();

    // Toggling must negate the *effective* state. Negating the raw flag would
    // give !undefined === true, leaving an already-unlocked sheet unlocked.
    expect(doc.setFlag).toHaveBeenCalledWith('megs', 'edit-mode', false);
});
