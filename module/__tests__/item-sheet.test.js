import { MEGSItemSheet } from '../sheets/item-sheet.mjs';

/*
Test rolls:

From skill sheet - skill
From skill sheet - subskills
From subskill sheet - subskill

*/
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
