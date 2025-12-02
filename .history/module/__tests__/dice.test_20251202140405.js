import { MegsTableRolls, RollValues } from '../dice.mjs'

test("_handleRoll", () => {
  // TODO
})

test("_handleTargetedRolls", () => {
  // TODO
})

test("_handleRolls", () => {
  // TODO
})

// TODO test for APs beyond A - ex: av = 7, ov = 4, 10 + 10 + 9 + 8 = 8 column shifts, ev = 4, rv = 4, pretty sure should be 10
// _handleRolls -> refactor out of this
/*
test("_rollDice should return if dice do not match", () => {
  const values = new RollValues("Test",0,0,0,0,0,'1d10 + 1d10');
  const dice = new MegsTableRolls(values);

  global.rollIndex = 0;
  const data = {
      "result": "Double 1s: Automatic failure!",
      "actionValue": 0,
      "opposingValue": 0,
      "difficulty": 0,
      "columnShifts": 0,
      "effectValue": 0,
      "resistanceValue": 0,
      "success": false,
      "evResult": ""
  };

  const dataset = {
     roll: [2, 3]
  };
  dice._rollDice(dataset , {}).then((response) => {
      expect(response).toStrictEqual([2, 3]);
  });
});

test("_rollDice should roll again if have matching dice on first roll and elect to roll again", () => {
  const values = new RollValues("Test",0,0,0,0,0,'1d10 + 1d10');
  const dice = new MegsTableRolls(values);

  global.rollIndex = 0;
  global.Dialog = YesDialog
  const data = {
       "result": "",
       "actionValue": 0,
       "opposingValue": 0,
       "difficulty": 0,
       "columnShifts": 0,
       "effectValue": 0,
       "resistanceValue": 0,
       "success": false,
       "evResult": ""
  };

  const dataset = {
    roll: [2, 2, 3, 4]
  };
  dice._rollDice(dataset , {}).then((response) => {
    expect(response).toStrictEqual([2, 2, 3, 4]);
  });
});


test("_rollDice should roll again if have matching dice on first and second rolls and user elects to roll again both times", () => {
  const values = new RollValues("Test",0,0,0,0,0,'1d10 + 1d10');
  const dice = new MegsTableRolls(values);

  global.rollIndex = 0;
  global.Dialog = YesDialog
   const data = {
       "result": "",
       "actionValue": 0,
       "opposingValue": 0,
       "difficulty": 0,
       "columnShifts": 0,
       "effectValue": 0,
       "resistanceValue": 0,
       "success": false,
       "evResult": ""
   };

   const dataset = {
      roll: [2, 2, 3, 3, 4, 5]
   };
   dice._rollDice(dataset , {}).then((response) => {
       expect(response).toStrictEqual([2, 2, 3, 3, 4, 5]);
   });
});

test("_rollDice should not roll again if have matching dice on first roll and user elects not to roll again", () => {
  const values = new RollValues("Test",0,0,0,0,0,'1d10 + 1d10');
  const dice = new MegsTableRolls(values);

  global.rollIndex = 0;
  global.Dialog = NoDialog
  const data = {
       "result": "",
       "actionValue": 0,
       "opposingValue": 0,
       "difficulty": 0,
       "columnShifts": 0,
       "effectValue": 0,
       "resistanceValue": 0,
       "success": false,
       "evResult": ""
  };

  const dataset = {
    roll: [2, 2, 3, 4]
  };
  dice._rollDice(dataset , {}).then((response) => {
    expect(response).toStrictEqual([2, 2, 3, 4]);
  });
});

test("_rollDice should fail on double 1s on first roll", () => {
  const values = new RollValues("Test",0,0,0,0,0,'1d10');
  const dice = new MegsTableRolls(values);

  global.rollIndex = 0;
  const data = {
      "result": "Double 1s: Automatic failure!",
      "actionValue": 0,
      "opposingValue": 0,
      "difficulty": 0,
      "columnShifts": 0,
      "effectValue": 0,
      "resistanceValue": 0,
      "success": false,
      "evResult": ""
  };

  const dataset = {
      roll: [1, 1]
  };
  dice._rollDice(dataset, {}).then((response) => {
      // TODO not really failing
      expect(response).toStrictEqual([1, 1]);
  });
});
*/

test("_getActionTableDifficulty returns the correct difficulty number", () => {
  // TODO
})

test("_getColumnShifts returns the correct number of column shifts", () => {
  const values = new RollValues("Test",0,0,0,0,0,'1d10 + 1d10');
  const dice = new MegsTableRolls(values);

  const actionTable = CONFIG.tables.actionTable;

  expect(dice._getColumnShifts(18, dice._getRangeIndex(14),  dice._getRangeIndex(0), actionTable)).toBe(3);

  // Automatic Failure (1 & 1) → CS = 0
  expect(dice._getColumnShifts(2, dice._getRangeIndex(15), dice._getRangeIndex(1), actionTable)).toBe(0);

  // Large Disadvantage, Not Automatic Success → CS = 0
  expect(dice._getColumnShifts(25, dice._getRangeIndex(1), dice._getRangeIndex(15), actionTable)).toBe(0);

  // Minimal Dice Result That Yields +0 CS
  expect(dice._getColumnShifts(11, dice._getRangeIndex(5), dice._getRangeIndex(5), actionTable)).toBe(0);

  // Minimal Dice Result That Yields +0 CS because SN == CST == 11
  expect(dice._getColumnShifts(12, dice._getRangeIndex(5), dice._getRangeIndex(5), actionTable)).toBe(0);

  // Minimal Dice Result That Yields +0 CS because SN == CST == 11 and the roll is not >= 13
  expect(dice._getColumnShifts(13, dice._getRangeIndex(5), dice._getRangeIndex(5), actionTable)).toBe(0);

  // Minimal Dice Result That Yields +1 CS because SN == CST == 11 and the roll is >= 13
  expect(dice._getColumnShifts(14, dice._getRangeIndex(5), dice._getRangeIndex(5), actionTable)).toBe(1);

  // Moderate Advantage, Very Low Roll → Should Fail
  expect(dice._getColumnShifts(5, dice._getRangeIndex(8), dice._getRangeIndex(6), actionTable)).toBe(0);

  expect(dice._getColumnShifts(14, dice._getRangeIndex(7), dice._getRangeIndex(7), actionTable)).toBe(1);
  
  expect(dice._getColumnShifts(20, dice._getRangeIndex(10), dice._getRangeIndex(8), actionTable)).toBe(4);

  expect(dice._getColumnShifts(23, dice._getRangeIndex(10), dice._getRangeIndex(8), actionTable)).toBe(5);
  expect(dice._getColumnShifts(27, dice._getRangeIndex(10), dice._getRangeIndex(8), actionTable)).toBe(6);
  expect(dice._getColumnShifts(31, dice._getRangeIndex(10), dice._getRangeIndex(8), actionTable)).toBe(7);
  expect(dice._getColumnShifts(35, dice._getRangeIndex(10), dice._getRangeIndex(8), actionTable)).toBe(8);
  expect(dice._getColumnShifts(39, dice._getRangeIndex(10), dice._getRangeIndex(8), actionTable)).toBe(9);

  expect(dice._getColumnShifts(23, dice._getRangeIndex(10), dice._getRangeIndex(9), actionTable)).toBe(4);
  expect(dice._getColumnShifts(27, dice._getRangeIndex(10), dice._getRangeIndex(9), actionTable)).toBe(5);
  expect(dice._getColumnShifts(31, dice._getRangeIndex(10), dice._getRangeIndex(9), actionTable)).toBe(6);
  expect(dice._getColumnShifts(35, dice._getRangeIndex(10), dice._getRangeIndex(9), actionTable)).toBe(7);
  expect(dice._getColumnShifts(39, dice._getRangeIndex(10), dice._getRangeIndex(9), actionTable)).toBe(8);
});

test('_getRangeIndex returns the correct index values', () => {
  const values = new RollValues("Test",0,0,0,0,0,'1d10 + 1d10');
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