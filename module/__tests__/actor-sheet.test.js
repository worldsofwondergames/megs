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

// --- sub-gadget collection in _prepareItems (#78) ----------------------------

describe('_prepareItems sub-gadget nesting', () => {
    function buildSheet(items = []) {
        const doc = mockDocument();
        const sheet = new MEGSActorSheet(doc, {});
        sheet.object = {
            _id: 'actor-1',
            system: {
                attributes: {
                    dex: { value: 5 }, str: { value: 4 }, body: { value: 4 },
                    int: { value: 6 }, will: { value: 5 }, mind: { value: 5 },
                    infl: { value: 3 }, aura: { value: 3 }, spirit: { value: 3 },
                },
            },
            items: items,
        };
        sheet.actor = sheet.object;
        return sheet;
    }

    function makeItem(overrides) {
        return {
            _id: overrides._id || 'item-' + Math.random().toString(36).slice(2, 8),
            type: overrides.type || 'gadget',
            name: overrides.name || 'Test',
            img: '',
            system: { parent: '', ...overrides.system },
        };
    }

    test('top-level gadgets get an empty subGadgets array', () => {
        const sheet = buildSheet();
        const context = {
            items: [
                makeItem({ _id: 'g1', name: 'Batsuit', type: 'gadget' }),
            ],
            system: {},
        };
        sheet._prepareItems(context);
        expect(context.gadgets).toHaveLength(1);
        expect(context.gadgets[0].subGadgets).toEqual([]);
    });

    test('sub-gadgets are nested under their parent gadget', () => {
        const sheet = buildSheet();
        const context = {
            items: [
                makeItem({ _id: 'g1', name: 'Batsuit', type: 'gadget' }),
                makeItem({ _id: 'g2', name: 'Grapple Gun', type: 'gadget', system: { parent: 'g1' } }),
            ],
            system: {},
        };
        sheet._prepareItems(context);
        expect(context.gadgets).toHaveLength(1);
        expect(context.gadgets[0].name).toBe('Batsuit');
        expect(context.gadgets[0].subGadgets).toHaveLength(1);
        expect(context.gadgets[0].subGadgets[0].name).toBe('Grapple Gun');
    });

    test('multiple sub-gadgets are sorted alphabetically under parent', () => {
        const sheet = buildSheet();
        const context = {
            items: [
                makeItem({ _id: 'g1', name: 'Batsuit', type: 'gadget' }),
                makeItem({ _id: 'g3', name: 'Smoke Pellet', type: 'gadget', system: { parent: 'g1' } }),
                makeItem({ _id: 'g2', name: 'Grapple Gun', type: 'gadget', system: { parent: 'g1' } }),
            ],
            system: {},
        };
        sheet._prepareItems(context);
        expect(context.gadgets[0].subGadgets).toHaveLength(2);
        expect(context.gadgets[0].subGadgets[0].name).toBe('Grapple Gun');
        expect(context.gadgets[0].subGadgets[1].name).toBe('Smoke Pellet');
    });

    test('sub-gadgets do not appear as top-level gadgets', () => {
        const sheet = buildSheet();
        const context = {
            items: [
                makeItem({ _id: 'g1', name: 'Batsuit', type: 'gadget' }),
                makeItem({ _id: 'g2', name: 'Grapple Gun', type: 'gadget', system: { parent: 'g1' } }),
                makeItem({ _id: 'g3', name: 'Utility Belt', type: 'gadget' }),
            ],
            system: {},
        };
        sheet._prepareItems(context);
        expect(context.gadgets).toHaveLength(2);
        const topLevelNames = context.gadgets.map(g => g.name);
        expect(topLevelNames).toContain('Batsuit');
        expect(topLevelNames).toContain('Utility Belt');
        expect(topLevelNames).not.toContain('Grapple Gun');
    });

    test('nested sub-gadgets appear under their parent sub-gadget', () => {
        const sheet = buildSheet();
        const context = {
            items: [
                makeItem({ _id: 'g1', name: 'Batsuit', type: 'gadget' }),
                makeItem({ _id: 'g2', name: 'Grapple Gun', type: 'gadget', system: { parent: 'g1' } }),
                makeItem({ _id: 'g3', name: 'Grapple Hook', type: 'gadget', system: { parent: 'g2' } }),
            ],
            system: {},
        };
        sheet._prepareItems(context);
        expect(context.gadgets).toHaveLength(1);
        expect(context.gadgets[0].subGadgets).toHaveLength(1);
        expect(context.gadgets[0].subGadgets[0].name).toBe('Grapple Gun');
        expect(context.gadgets[0].subGadgets[0].subGadgets).toHaveLength(1);
        expect(context.gadgets[0].subGadgets[0].subGadgets[0].name).toBe('Grapple Hook');
    });

    test('orphaned sub-gadgets (parent not found) are not shown', () => {
        const sheet = buildSheet();
        const context = {
            items: [
                makeItem({ _id: 'g1', name: 'Batsuit', type: 'gadget' }),
                makeItem({ _id: 'g2', name: 'Orphan', type: 'gadget', system: { parent: 'nonexistent' } }),
            ],
            system: {},
        };
        sheet._prepareItems(context);
        expect(context.gadgets).toHaveLength(1);
        expect(context.gadgets[0].subGadgets).toHaveLength(0);
    });
});
