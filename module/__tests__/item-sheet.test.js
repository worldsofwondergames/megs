import { MEGSItemSheet } from '../sheets/item-sheet.mjs';

/*
Test rolls:

From skill sheet - skill
From skill sheet - subskills
From subskill sheet - subskill

*/
const itemSheet = new MEGSItemSheet();

test('_getOpposingValueForPower returns the correct opposing attribute for an effect attribute', () => {
    const targetActor = {
        system: {
            attributes: {
                dex: { value: 'dex' },
                str: { value: 'str' },
                int: { value: 'int' },
                will: { value: 'will' },
                infl: { value: 'infl' },
                aura: { value: 'aura' },
            },
        },
    };
    expect(itemSheet._getOpposingValueForPower('str', targetActor)).toBe('dex');
    expect(itemSheet._getOpposingValueForPower('will', targetActor)).toBe('int');
    expect(itemSheet._getOpposingValueForPower('aura', targetActor)).toBe('infl');
});
