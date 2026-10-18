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

// --- stackable gadget helpers (#179) -----------------------------------------

describe('_isStackable', () => {
    const sheet = new MEGSActorSheet(actor);

    test('returns true for boolean true', () => {
        expect(sheet._isStackable({ system: { isStackable: true } })).toBe(true);
    });

    test('returns true for string "true"', () => {
        expect(sheet._isStackable({ system: { isStackable: 'true' } })).toBe(true);
    });

    test('returns false for boolean false', () => {
        expect(sheet._isStackable({ system: { isStackable: false } })).toBe(false);
    });

    test('returns false for string "false"', () => {
        expect(sheet._isStackable({ system: { isStackable: 'false' } })).toBe(false);
    });

    test('returns false for undefined', () => {
        expect(sheet._isStackable({ system: {} })).toBe(false);
    });

    test('returns false for null item', () => {
        expect(sheet._isStackable(null)).toBe(false);
    });
});

describe('_findStackableMatch', () => {
    function buildSheetWithItems(items) {
        const doc = mockDocument();
        const sheet = new MEGSActorSheet(doc, {});
        sheet.actor = {
            items: {
                find: (fn) => items.find(fn),
            },
        };
        return sheet;
    }

    function gadgetItem({ id, name, parent = '', isStackable = 'true' }) {
        return {
            id,
            type: 'gadget',
            name,
            system: { parent, isStackable },
        };
    }

    test('finds a matching top-level stackable gadget', () => {
        const sheet = buildSheetWithItems([
            gadgetItem({ id: 'g1', name: 'Batarang' }),
        ]);
        const dropped = { name: 'Batarang', system: { isStackable: 'true' } };
        const match = sheet._findStackableMatch(dropped, '', null);
        expect(match).toBeTruthy();
        expect(match.id).toBe('g1');
    });

    test('does not match a gadget with a different name', () => {
        const sheet = buildSheetWithItems([
            gadgetItem({ id: 'g1', name: 'Grapple Gun' }),
        ]);
        const dropped = { name: 'Batarang', system: { isStackable: 'true' } };
        expect(sheet._findStackableMatch(dropped, '', null)).toBeUndefined();
    });

    test('does not match a non-stackable gadget', () => {
        const sheet = buildSheetWithItems([
            gadgetItem({ id: 'g1', name: 'Batarang', isStackable: 'false' }),
        ]);
        const dropped = { name: 'Batarang', system: { isStackable: 'true' } };
        expect(sheet._findStackableMatch(dropped, '', null)).toBeUndefined();
    });

    test('excludes a gadget by ID', () => {
        const sheet = buildSheetWithItems([
            gadgetItem({ id: 'g1', name: 'Batarang' }),
        ]);
        const dropped = { name: 'Batarang', system: { isStackable: 'true' } };
        expect(sheet._findStackableMatch(dropped, '', 'g1')).toBeUndefined();
    });

    test('finds a matching sub-gadget by parent ID', () => {
        const sheet = buildSheetWithItems([
            gadgetItem({ id: 'g2', name: 'Batarang', parent: 'g1' }),
        ]);
        const dropped = { name: 'Batarang', system: { isStackable: 'true' } };
        const match = sheet._findStackableMatch(dropped, 'g1', null);
        expect(match).toBeTruthy();
        expect(match.id).toBe('g2');
    });

    test('does not match sub-gadget when looking for top-level', () => {
        const sheet = buildSheetWithItems([
            gadgetItem({ id: 'g2', name: 'Batarang', parent: 'g1' }),
        ]);
        const dropped = { name: 'Batarang', system: { isStackable: 'true' } };
        expect(sheet._findStackableMatch(dropped, '', null)).toBeUndefined();
    });
});

describe('_prepareDescriptionText (issue #285)', () => {
    let enrichHTML;
    beforeEach(() => {
        enrichHTML = jest.fn(async (html) => `enriched:${html}`);
        foundry.applications.ux = { TextEditor: { enrichHTML } };
    });
    afterEach(() => {
        delete foundry.applications.ux;
    });

    const makeSheet = () => {
        const sheet = new MEGSActorSheet({ isOwner: true, _stats: { compendiumSource: false }, setFlag: () => {} });
        sheet.document = mockDocument({ isOwner: true });
        return sheet;
    };

    test('enriches Biography and Role Playing Notes with the actor as context', async () => {
        const sheet = makeSheet();
        const context = { system: { biography: '<p>Bio</p>', rolePlayingNotes: '<p>Notes</p>' } };
        await sheet._prepareDescriptionText(context);

        expect(context.enrichedBiography).toBe('enriched:<p>Bio</p>');
        expect(context.enrichedRolePlayingNotes).toBe('enriched:<p>Notes</p>');
        expect(context.hasRolePlayingNotes).toBe(true);
        expect(enrichHTML).toHaveBeenCalledWith('<p>Notes</p>', expect.objectContaining({ secrets: true, relativeTo: sheet.actor }));
    });

    test('empty fields stay empty and are not enriched', async () => {
        const sheet = makeSheet();
        const context = { system: { biography: '', rolePlayingNotes: '' } };
        await sheet._prepareDescriptionText(context);

        expect(context.enrichedBiography).toBe('');
        expect(context.enrichedRolePlayingNotes).toBe('');
        expect(context.hasRolePlayingNotes).toBe(true);
        expect(enrichHTML).not.toHaveBeenCalled();
    });

    test('an actor type without the field has no Role Playing Notes', async () => {
        const sheet = makeSheet();
        const context = { system: { biography: '<p>Bio</p>' } };
        await sheet._prepareDescriptionText(context);

        expect(context.hasRolePlayingNotes).toBe(false);
        expect(context.enrichedRolePlayingNotes).toBe('');
        expect(context.enrichedBiography).toBe('enriched:<p>Bio</p>');
    });
});

describe('_calculateInitiativeBonusWithText (issue #306)', () => {
    const buildContext = (attributeOverrides) => ({
        document: {
            system: {
                attributes: { dex: { value: 5 }, int: { value: 3 }, infl: { value: 2 } },
                effectiveAttributes: { dex: attributeOverrides.dex?.value ?? 5, int: 3, infl: 2 },
                attributeOverrides,
            },
        },
        powers: [],
        skills: [],
        advantages: [],
    });

    test('an equipped gadget\'s DEX sets the bonus and is named in the tooltip', () => {
        const sheet = new MEGSActorSheet(actor);
        const { bonus, text } = sheet._calculateInitiativeBonusWithText(
            buildContext({ dex: { value: 8, gadget: 'Battlesuit' } }),
        );
        expect(bonus).toBe(13);
        expect(text).toBe('DEX 8 (Battlesuit) + INT 3 + INFL 2');
    });

    test('without a gadget the bonus and tooltip use the character\'s own values', () => {
        const sheet = new MEGSActorSheet(actor);
        const { bonus, text } = sheet._calculateInitiativeBonusWithText(buildContext({}));
        expect(bonus).toBe(10);
        expect(text).toBe('DEX 5 + INT 3 + INFL 2');
    });
});

describe('_getPetOwnerChoices (#248)', () => {
    const originalGame = globalThis.game;
    afterEach(() => { globalThis.game = originalGame; });

    test('lists heroes, villains and NPCs by name, sorted, and leaves out other actor types', () => {
        const actors = [
            { _id: 'h1', name: 'Zeta Hero', type: 'hero' },
            { _id: 'v1', name: 'Beta Villain', type: 'villain' },
            { _id: 'n1', name: 'Alpha NPC', type: 'npc' },
            { _id: 'p1', name: 'Some Pet', type: 'pet' },
            { _id: 'c1', name: 'Some Car', type: 'vehicle' },
            { _id: 'l1', name: 'Some Base', type: 'location' },
        ];
        globalThis.game = { ...originalGame, actors };
        const sheet = new MEGSActorSheet(mockDocument(), {});

        const choices = sheet._getPetOwnerChoices();
        expect(Object.entries(choices)).toEqual([['n1', 'Alpha NPC'], ['v1', 'Beta Villain'], ['h1', 'Zeta Hero']]);
    });
});
