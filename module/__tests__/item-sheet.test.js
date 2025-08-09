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
