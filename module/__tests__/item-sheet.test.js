import { jest } from '@jest/globals';
import { MEGSItemSheet } from '../sheets/item-sheet.mjs';

/*
Test rolls:

From skill sheet - skill
From skill sheet - subskills
From subskill sheet - subskill

*/

/** Build an item document stand-in with a controllable stored edit-mode flag. */
function mockDocument({ isOwner = true, compendiumSource = null, storedFlag } = {}) {
    return {
        isOwner,
        _stats: { compendiumSource },
        getFlag: jest.fn(() => storedFlag),
        setFlag: jest.fn(),
    };
}
const itemSheet = new MEGSItemSheet();
// Provide a mock item with isOwner and setFlag for tests that require it
itemSheet.item = { isOwner: true, setFlag: () => {} };

test('_canDragDrop returns true when isEditable is true', () => {
    const mockItem = { isOwner: true, setFlag: () => {} };
    const itemSheet = new MEGSItemSheet(mockItem, {});
    itemSheet.isEditable = true;
    expect(itemSheet._canDragDrop()).toBe(true);
});

test('_canDragDrop returns false when isEditable is false', () => {
    const mockItem = { isOwner: true, setFlag: () => {} };
    const itemSheet = new MEGSItemSheet(mockItem, {});
    itemSheet.isEditable = false;
    expect(itemSheet._canDragDrop()).toBe(false);
});

test('get template returns correct path', () => {
    const mockItem = { type: 'power', isOwner: true, setFlag: () => {}, parent: {} };
    // Pass mockItem as first argument to ensure this.item is set
    const itemSheet = new MEGSItemSheet(mockItem, {});
    // Defensive: assign mockItem to itemSheet.item in case constructor doesn't
    itemSheet.item = mockItem;
    expect(itemSheet.template).toContain('item-power-sheet.hbs');
});

test('_isRollable returns false if no parent', () => {
    const mockItem = {
        parent: null,
        type: 'skill',
        system: { type: 'dice' },
        isOwner: true,
        setFlag: () => {},
    };
    // Pass mockItem as first argument to ensure this.item is set
    const itemSheet = new MEGSItemSheet(mockItem, {});
    // Defensive: assign mockItem to itemSheet.item in case constructor doesn't
    itemSheet.item = mockItem;
    expect(itemSheet._isRollable(mockItem)).toBe(false);
});

// _prepareModifiers, _prepareSubskills, _prepareGadgetData are internal and require complex context, so skip direct unit tests unless you want to mock deeply.

// --- edit-mode (issue #243) ---------------------------------------------------

test('constructor does not write the edit-mode flag', () => {
    const doc = mockDocument();
    new MEGSItemSheet(doc, {});
    // Writing a flag from the constructor races the first render: the render
    // reads the old value, then the un-awaited write triggers a second render.
    expect(doc.setFlag).not.toHaveBeenCalled();
});

test('isEditMode defaults to unlocked for an owner with no stored flag', () => {
    const sheet = new MEGSItemSheet(mockDocument({ storedFlag: undefined }), {});
    expect(sheet.isEditMode).toBe(true);
});

test('isEditMode honours a stored false flag for an owner', () => {
    const sheet = new MEGSItemSheet(mockDocument({ storedFlag: false }), {});
    expect(sheet.isEditMode).toBe(false);
});

test('isEditMode defaults to locked for a non-owner', () => {
    const sheet = new MEGSItemSheet(mockDocument({ isOwner: false }), {});
    expect(sheet.isEditMode).toBe(false);
});

test('isEditMode defaults to locked for a compendium item', () => {
    const doc = mockDocument({ compendiumSource: 'Compendium.megs.powers.Item.abc' });
    const sheet = new MEGSItemSheet(doc, {});
    expect(sheet.isEditMode).toBe(false);
});

test('_toggleEditMode locks a sheet that is unlocked by default', async () => {
    const doc = mockDocument({ storedFlag: undefined });
    const sheet = new MEGSItemSheet(doc, {});
    sheet.render = () => {};

    await sheet._toggleEditMode();

    // Toggling must negate the *effective* state. Negating the raw flag would
    // give !undefined === true, leaving an already-unlocked sheet unlocked.
    expect(doc.setFlag).toHaveBeenCalledWith('megs', 'edit-mode', false);
});

test('_toggleEditMode unlocks a sheet with a stored false flag', async () => {
    const doc = mockDocument({ storedFlag: false });
    const sheet = new MEGSItemSheet(doc, {});
    sheet.render = () => {};

    await sheet._toggleEditMode();

    expect(doc.setFlag).toHaveBeenCalledWith('megs', 'edit-mode', true);
});
