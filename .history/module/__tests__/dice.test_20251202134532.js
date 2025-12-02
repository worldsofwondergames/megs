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

test('_getColumnShifts exhaustive AV/OV/roll test for <100', () => {
  const values = new RollValues('Test', 0, 0, 0, 0, 0, '1d10 + 1d10');
  const dice = new MegsTableRolls(values);
  const actionTable = CONFIG.tables.actionTable;
  const maxAV = 99;
  const maxOV = 99;
  const maxRoll = 99;

  for (let av = 0; av <= maxAV; av++) {
    for (let ov = 0; ov <= maxOV; ov++) {
      const avIndex = dice._getRangeIndex(av);
      const ovIndex = dice._getRangeIndex(ov);
      const successNumber = actionTable[avIndex][ovIndex];
      for (let roll = 0; roll <= maxRoll; roll++) {
        // Only test if roll > successNumber and roll >= COLUMN_SHIFT_THRESHOLD
        if (roll > successNumber && roll >= dice.COLUMN_SHIFT_THRESHOLD) {
          // Calculate expected column shifts
          let expectedCS = 0;
          for (let i = ovIndex + 1; i < actionTable[avIndex].length; i++) {
            const colValue = actionTable[avIndex][i];
            if (colValue >= dice.COLUMN_SHIFT_THRESHOLD && colValue > successNumber && colValue < roll) {
              expectedCS++;
            }
          }
          const actualCS = dice._getColumnShifts(roll, avIndex, ovIndex, actionTable);
          expect(actualCS).toBe(expectedCS);
        } else {
          // Should be 0 column shifts if roll <= successNumber or roll < threshold
          const actualCS = dice._getColumnShifts(roll, avIndex, ovIndex, actionTable);
          expect(actualCS).toBe(0);
        }
      }
    }
  }
});