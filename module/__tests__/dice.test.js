import { HandleRollDialog, NoDialog, YesDialog } from '../__mocks__/foundry.mjs';
import { MegsTableRolls, RollValues } from '../dice.mjs';
import { log, error } from 'console'; // jest overrides console; use these instead
import { jest } from '@jest/globals';

CONFIG.combatManeuvers = {
    'Critical Blow': {
        ovShifts: -2,
        rvShifts: -3,
    },
    'Devastating Attack': {
        ovShifts: -4,
        rvShifts: -6,
    },
    'Flailing Attack': {
        ovShifts: 2,
        rvShifts: 3,
    },
    'Grappling Attack': {
        ovShifts: 0,
        rvShifts: 0,
    },
    'Multi-Attack vs 2': {
        ovShifts: -1,
        rvShifts: 1,
    },
    'Multi-Attack vs 3-4': {
        ovShifts: -2,
        rvShifts: 2,
    },
};

beforeAll(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
});

test('_handleRoll', () => {
    // TODO
});

test('_handleTargetedRolls', () => {
    // TODO
});

test('_handleRolls should return 0 result APs for simplest fail path', () => {
    global.Dialog = HandleRollDialog;

    const values = {
        label: 'Test',
        type: 'attribute',
        valueOrAps: 0,
        actionValue: 4,
        opposingValue: 4,
        effectValue: 4,
        resistanceValue: 4,
        rollFormula: '7 + 3',
        unskilled: false,
    };
    global.rollIndex = 0;

    const dice = new MegsTableRolls(values);
    (0,
        (dice._rollDice = async function () {
            return [7, 3];
        }));

    dice._showRollResultInChat = async function (data, roll, callingPoint) {
        expect(data.result).toEqual('ActionFailed');
        expect(data.success).toBe(false);
        expect(data.evResult).toEqual('');
    };

    dice._handleRolls(0, 0, 0, 0, 0, 0, '', 0, false).then((response) => {
        expect(response).toStrictEqual([7, 3]);
    });
});

// test('_handleRolls should return 1 result APs for simplest happy path', () => {
//     global.Dialog = HandleRollDialog;

//     const values = {
//         label: 'Test',
//         type: 'attribute',
//         valueOrAps: 0,
//         actionValue: 4,
//         opposingValue: 4,
//         effectValue: 4,
//         resistanceValue: 4,
//         rollFormula: '7 + 4',
//         unskilled: false,
//     };
//     global.rollIndex = 0;

//     const dice = new MegsTableRolls(values);
//     (0,
//         (dice._rollDice = async function () {
//             return [7, 4];
//         }));

//     dice._showRollResultInChat = async function (data, roll, callingPoint) {
//         expect(data.result).toEqual('Success: 1 RAPs!');
//         expect(data.success).toBe(true);
//         expect(data.evResult).toEqual(1);
//     };

//     //  async _handleRolls(currentHeroPoints, maxHpToSpend, hpSpentAV, hpSpentEV, hpSpentOV, hpSpentRV,
//     // combatManeuverKey, resultColumnShifts, isUnskilled) {
//     dice._handleRolls(0, 0, 0, 0, 0, 0, '', 0, false).then((response) => {
//         expect(response).toEqual(1);
//     });
// });

test('_handleRolls should return correct result for Critical Blow', () => {
    global.Dialog = HandleRollDialog;
    global.rollIndex = 0;
    const values = {
        label: 'Critical Blow',
        type: 'attribute',
        valueOrAps: 0,
        // actionValue: 10,
        // opposingValue: 7,
        effectValue: 0,
        resistanceValue: 0,
        //    rollFormula: "7 + 8",
        unskilled: false,
    };

    /*Whenever a Player declares that his Character is attempting
    a Criticul Blow, his adversary receives +2 Column Shifts to the
    Opposing Value.
    
    If the attack succeeds, however, the defender receives -3 Column Shifts to his Resistance Value.
    
    Example: A character with 11 DEX and 8 STR attacks a character with 7 DEX and 8 BODY with a Critical Blow.
  */

    let av = 1;
    let ov = 1;

    // test action table
    //  for (let av = 1; av < 61; av++){
    //    for (let ov = 0; ov < 61; ov++) {
    for (let dice1 = 1; dice1 < 11; dice1++) {
        for (let dice2 = 1; dice2 < 11; dice2++) {
            values.actionValue = av;
            values.opposingValue = ov;
            values.rollFormula = dice1 + ' + ' + dice2;
            const dice = new MegsTableRolls(values);

            dice._rollDice = async function () {
                return [dice1, dice2];
            };

            dice._showRollResultInChat = async function (data, roll, callingPoint) {
                // expect(data.result).toEqual("Success: 1 RAPs!");
                // expect(data.success).toBe(true);
                // expect(data.evResult).toEqual(1);
                error(
                    'av = ' +
                        av +
                        ' | ov = ' +
                        ov +
                        'dice 1 = ' +
                        dice1 +
                        ' | dice 2 = ' +
                        dice2 +
                        ' | result = ' +
                        JSON.stringify(data)
                );
            };

            // async _handleRolls(currentHeroPoints, maxHpToSpend, hpSpentAV, hpSpentEV, hpSpentOV, hpSpentRV,
            //      combatManeuverKey, resultColumnShifts, isUnskilled) {
            dice._handleRolls(0, 0, 0, 0, 0, 0, 'Critical Blow', 0, false).then((response) => {
                //expect(response).toEqual(1);
                // just returns dice or NaN
            });
        }
    }

    //    }
    //  }
});

// test('_handleRolls should return 1 result APs for CM Multi-Attack vs 2', () => {
//     global.Dialog = HandleRollDialog;
//     global.rollIndex = 0;
//     const values = {
//         label: 'Test',
//         type: 'attribute',
//         valueOrAps: 0,
//         actionValue: 10,
//         opposingValue: 7,
//         effectValue: 4,
//         resistanceValue: 8,
//         rollFormula: '7 + 8',
//         unskilled: false,
//     };

//     const dice = new MegsTableRolls(values);
//     (0,
//         (dice._rollDice = async function () {
//             return [7, 4];
//         }));

//     dice._showRollResultInChat = async function (data, roll, callingPoint) {
//         expect(data.result).toEqual('Success: 1 RAPs!');
//         expect(data.success).toBe(true);
//         expect(data.evResult).toEqual(1);
//     };

//     //  async _handleRolls(currentHeroPoints, maxHpToSpend, hpSpentAV, hpSpentEV, hpSpentOV, hpSpentRV,
//     // combatManeuverKey, resultColumnShifts, isUnskilled) {
//     dice._handleRolls(0, 0, 0, 0, 0, 0, 'Multi-Attack vs 2', 0, false).then((response) => {
//         expect(response).toEqual(1);
//     });
// });

// TODO test for APs beyond A - ex: av = 7, ov = 4, 10 + 10 + 9 + 8 = 8 column shifts, ev = 4, rv = 4, pretty sure should be 10
// _handleRolls -> refactor out of this

test('_rollDice should return if dice do not match', () => {
    const values = {
        label: 'Test',
        type: 'attribute',
        valueOrAps: 0,
        actionValue: 0,
        opposingValue: 0,
        effectValue: 0,
        resistanceValue: 0,
        rollFormula: '2 + 3',
        unskilled: false,
    };
    global.rollIndex = 0;

    const dice = new MegsTableRolls(values);

    let resultData = {
        result: '',
        actionValue: 0,
        opposingValue: 0,
        difficulty: 0,
        dice: [2, 3],
        columnShifts: 0,
        effectValue: 0,
        resistanceValue: 0,
        success: true,
        evResult: '',
        rvColumnShifts: 0,
    };

    dice._rollDice(resultData, {}).then((response) => {
        expect(response).toStrictEqual([2, 3]);
    });
});

test('_rollDice should roll again if have matching dice on first roll and elect to roll again', () => {
    global.Dialog = YesDialog;
    const values = {
        label: 'Test',
        type: 'attribute',
        valueOrAps: 0,
        actionValue: 0,
        opposingValue: 0,
        effectValue: 0,
        resistanceValue: 0,
        rollFormula: '2 + 2 + 3 + 4',
        unskilled: false,
    };
    global.rollIndex = 0;

    const dice = new MegsTableRolls(values);

    let resultData = {
        result: '',
        actionValue: 0,
        opposingValue: 0,
        difficulty: 0,
        dice: [2, 2, 3, 4],
        columnShifts: 0,
        effectValue: 0,
        resistanceValue: 0,
        success: true,
        evResult: '',
        rvColumnShifts: 0,
    };

    dice._rollDice(resultData, {}).then((response) => {
        expect(response).toStrictEqual([2, 2, 3, 4]);
    });
});

test('_rollDice should roll again if have matching dice on first and second rolls and user elects to roll again both times', () => {
    global.Dialog = YesDialog;
    const values = {
        label: 'Test',
        type: 'attribute',
        valueOrAps: 0,
        actionValue: 0,
        opposingValue: 0,
        effectValue: 0,
        resistanceValue: 0,
        rollFormula: '2 + 2 + 3 + 3 + 4 + 5',
        unskilled: false,
    };
    global.rollIndex = 0;

    const dice = new MegsTableRolls(values);

    let resultData = {
        result: '',
        actionValue: 0,
        opposingValue: 0,
        difficulty: 0,
        dice: [2, 2, 3, 4],
        columnShifts: 0,
        effectValue: 0,
        resistanceValue: 0,
        success: true,
        evResult: '',
        rvColumnShifts: 0,
    };

    dice._rollDice(resultData, {}).then((response) => {
        expect(response).toStrictEqual([2, 2, 3, 3, 4, 5]);
    });
});

test('_rollDice should not roll again if have matching dice on first roll and user elects not to roll again', () => {
    global.Dialog = NoDialog;
    const values = {
        label: 'Test',
        type: 'attribute',
        valueOrAps: 0,
        actionValue: 0,
        opposingValue: 0,
        effectValue: 0,
        resistanceValue: 0,
        rollFormula: '2 + 2',
        unskilled: false,
    };
    global.rollIndex = 0;

    const dice = new MegsTableRolls(values);

    let resultData = {
        result: '',
        actionValue: 0,
        opposingValue: 0,
        difficulty: 0,
        dice: [2, 2, 3, 4],
        columnShifts: 0,
        effectValue: 0,
        resistanceValue: 0,
        success: true,
        evResult: '',
        rvColumnShifts: 0,
    };

    dice._rollDice(resultData, {}).then((response) => {
        expect(response).toStrictEqual([2, 2]);
    });
});

/* 
TODO fix
test('_rollDice should not roll again if have matching dice on first roll and user elects not to roll again', () => {
    global.Dialog = NoDialog;
    const values = {
        label: 'Test',
        type: 'attribute',
        valueOrAps: 0,
        actionValue: 0,
        opposingValue: 0,
        effectValue: 0,
        resistanceValue: 0,
        rollFormula: '1 + 1',
        unskilled: false,
    };
    global.rollIndex = 0;

    const dice = new MegsTableRolls(values);

    let resultData = {
        result: '',
        actionValue: 0,
        opposingValue: 0,
        difficulty: 0,
        dice: [1, 1],
        columnShifts: 0,
        effectValue: 0,
        resistanceValue: 0,
        success: true,
        evResult: '',
        rvColumnShifts: 0,
    };

    dice._rollDice(resultData, {}).then((response) => {
        expect(response).toStrictEqual([1, 1]);
        expect(resultData.result).toEqual('Double 1s: Automatic failure!');
        // TODO not really failing -> success === false
    });
});
*/

test('_getActionTableDifficulty returns the correct difficulty number', () => {
    // TODO
});

test('_getColumnShifts returns the correct number of column shifts', () => {
    const values = new RollValues('Test', 0, 0, 0, 0, 0, '1d10 + 1d10');
    const dice = new MegsTableRolls(values);

    const actionTable = CONFIG.tables.actionTable;

    expect(
        dice._getColumnShifts(18, dice._getRangeIndex(14), dice._getRangeIndex(0), actionTable)
    ).toBe(3);

    // Automatic Failure (1 & 1) → CS = 0
    expect(
        dice._getColumnShifts(2, dice._getRangeIndex(15), dice._getRangeIndex(1), actionTable)
    ).toBe(0);

    // Large Disadvantage, Not Automatic Success → CS = 0
    expect(
        dice._getColumnShifts(25, dice._getRangeIndex(1), dice._getRangeIndex(15), actionTable)
    ).toBe(0);

    // Minimal Dice Result That Yields +0 CS
    expect(
        dice._getColumnShifts(11, dice._getRangeIndex(5), dice._getRangeIndex(5), actionTable)
    ).toBe(0);

    // Minimal Dice Result That Yields +0 CS because SN == CST == 11
    expect(
        dice._getColumnShifts(12, dice._getRangeIndex(5), dice._getRangeIndex(5), actionTable)
    ).toBe(0);

    // Minimal Dice Result That Yields +0 CS because SN == CST == 11 and the roll is not >= 13
    expect(
        dice._getColumnShifts(13, dice._getRangeIndex(5), dice._getRangeIndex(5), actionTable)
    ).toBe(0);

    // Minimal Dice Result That Yields +1 CS because SN == CST == 11 and the roll is >= 13
    expect(
        dice._getColumnShifts(14, dice._getRangeIndex(5), dice._getRangeIndex(5), actionTable)
    ).toBe(1);

    // Moderate Advantage, Very Low Roll → Should Fail
    expect(
        dice._getColumnShifts(5, dice._getRangeIndex(8), dice._getRangeIndex(6), actionTable)
    ).toBe(0);

    expect(
        dice._getColumnShifts(14, dice._getRangeIndex(7), dice._getRangeIndex(7), actionTable)
    ).toBe(1);

    expect(
        dice._getColumnShifts(20, dice._getRangeIndex(10), dice._getRangeIndex(8), actionTable)
    ).toBe(4);

    expect(
        dice._getColumnShifts(23, dice._getRangeIndex(10), dice._getRangeIndex(8), actionTable)
    ).toBe(5);
    expect(
        dice._getColumnShifts(27, dice._getRangeIndex(10), dice._getRangeIndex(8), actionTable)
    ).toBe(6);
    expect(
        dice._getColumnShifts(31, dice._getRangeIndex(10), dice._getRangeIndex(8), actionTable)
    ).toBe(7);
    expect(
        dice._getColumnShifts(35, dice._getRangeIndex(10), dice._getRangeIndex(8), actionTable)
    ).toBe(8);
    expect(
        dice._getColumnShifts(39, dice._getRangeIndex(10), dice._getRangeIndex(8), actionTable)
    ).toBe(9);

    expect(
        dice._getColumnShifts(23, dice._getRangeIndex(10), dice._getRangeIndex(9), actionTable)
    ).toBe(4);
    expect(
        dice._getColumnShifts(27, dice._getRangeIndex(10), dice._getRangeIndex(9), actionTable)
    ).toBe(5);
    expect(
        dice._getColumnShifts(31, dice._getRangeIndex(10), dice._getRangeIndex(9), actionTable)
    ).toBe(6);
    expect(
        dice._getColumnShifts(35, dice._getRangeIndex(10), dice._getRangeIndex(9), actionTable)
    ).toBe(7);
    expect(
        dice._getColumnShifts(39, dice._getRangeIndex(10), dice._getRangeIndex(9), actionTable)
    ).toBe(8);

    expect(
        dice._getColumnShifts(15, dice._getRangeIndex(6), dice._getRangeIndex(10), actionTable)
    ).toBe(0);
    expect(
        dice._getColumnShifts(18, dice._getRangeIndex(14), dice._getRangeIndex(0), actionTable)
    ).toBe(3);
});

test('_getRangeIndex returns the correct index values', () => {
    const values = new RollValues('Test', 0, 0, 0, 0, 0, '1d10 + 1d10');
    const dice = new MegsTableRolls(values);

    expect(dice._getRangeIndex(0)).toBe(0);
    expect(dice._getRangeIndex(60)).toBe(18);
});

// Comprehensive test suite for _getColumnShifts
describe('_getColumnShifts comprehensive tests', () => {
    const values = new RollValues('Test', 0, 0, 0, 0, 0, '1d10 + 1d10');
    const dice = new MegsTableRolls(values);
    const actionTable = CONFIG.tables.actionTable;
    const threshold = dice.COLUMN_SHIFT_THRESHOLD || 11;

    test('No column shifts if roll < Success Number', () => {
        const avIndex = dice._getRangeIndex(14);
        const ovIndex = dice._getRangeIndex(0);
        const successNumber = actionTable[avIndex][ovIndex];
        expect(dice._getColumnShifts(successNumber - 1, avIndex, ovIndex, actionTable)).toBe(0);
    });

    test('No column shifts if roll < threshold', () => {
        const avIndex = dice._getRangeIndex(14);
        const ovIndex = dice._getRangeIndex(0);
        expect(dice._getColumnShifts(10, avIndex, ovIndex, actionTable)).toBe(0);
    });

    test('No column shifts if roll == Success Number', () => {
        const avIndex = dice._getRangeIndex(14);
        const ovIndex = dice._getRangeIndex(0);
        const successNumber = actionTable[avIndex][ovIndex];
        expect(dice._getColumnShifts(successNumber, avIndex, ovIndex, actionTable)).toBe(0);
    });

    test('Correct column shifts for AV=14, OV=0, roll=18', () => {
        const avIndex = dice._getRangeIndex(14);
        const ovIndex = dice._getRangeIndex(0);
        // Should count 11, 13, 15 (3 shifts)
        expect(dice._getColumnShifts(18, avIndex, ovIndex, actionTable)).toBe(3);
    });

    test('Correct column shifts for AV=10, OV=8, roll=23', () => {
        const avIndex = dice._getRangeIndex(10);
        const ovIndex = dice._getRangeIndex(8);
        // Should count 11, 13, 15, 18, 21 (5 shifts)
        expect(dice._getColumnShifts(23, avIndex, ovIndex, actionTable)).toBe(5);
    });

    test('Correct column shifts for AV=10, OV=8, roll=20', () => {
        const avIndex = dice._getRangeIndex(10);
        const ovIndex = dice._getRangeIndex(8);
        // Should count 11, 13, 15, 18 (4 shifts)
        expect(dice._getColumnShifts(20, avIndex, ovIndex, actionTable)).toBe(4);
    });

    test('Correct column shifts for AV=10, OV=8, roll=27', () => {
        const avIndex = dice._getRangeIndex(10);
        const ovIndex = dice._getRangeIndex(8);
        // Should count 11, 13, 15, 18, 21, 25 (6 shifts)
        expect(dice._getColumnShifts(27, avIndex, ovIndex, actionTable)).toBe(6);
    });

    test('Correct column shifts for AV=10, OV=8, roll=39', () => {
        const avIndex = dice._getRangeIndex(10);
        const ovIndex = dice._getRangeIndex(8);
        // Should count 11, 13, 15, 18, 21, 25, 29, 33, 37 (9 shifts)
        expect(dice._getColumnShifts(39, avIndex, ovIndex, actionTable)).toBe(9);
    });

    test('No column shifts for large disadvantage', () => {
        const avIndex = dice._getRangeIndex(1);
        const ovIndex = dice._getRangeIndex(15);
        expect(dice._getColumnShifts(25, avIndex, ovIndex, actionTable)).toBe(0);
    });

    test('Minimal dice result that yields +1 CS', () => {
        const avIndex = dice._getRangeIndex(5);
        const ovIndex = dice._getRangeIndex(5);
        expect(dice._getColumnShifts(14, avIndex, ovIndex, actionTable)).toBe(1);
    });

    test('Moderate advantage, very low roll should fail', () => {
        const avIndex = dice._getRangeIndex(8);
        const ovIndex = dice._getRangeIndex(6);
        expect(dice._getColumnShifts(5, avIndex, ovIndex, actionTable)).toBe(0);
    });

    test('Edge case: roll just above threshold and SN', () => {
        const avIndex = dice._getRangeIndex(5);
        const ovIndex = dice._getRangeIndex(5);
        expect(dice._getColumnShifts(12, avIndex, ovIndex, actionTable)).toBe(0);
        expect(dice._getColumnShifts(13, avIndex, ovIndex, actionTable)).toBe(0);
        expect(dice._getColumnShifts(14, avIndex, ovIndex, actionTable)).toBe(1);
    });
});
