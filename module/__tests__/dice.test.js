import { NoDialog, YesDialog } from '../__mocks__/foundry.mjs';
import { MegsTableRolls, RollValues } from '../dice.mjs'
import { log, error } from "console"; // jest overrides console; use these instead

test("_handleRoll", () => {
  // TODO
})

test("_handleTargetedRolls", () => {
  // TODO
})

test("_handleRolls", () => {
  // TODO
})

// TODO test combat maneuvers - assets/combatManuevers.json



// TODO test for APs beyond A - ex: av = 7, ov = 4, 10 + 10 + 9 + 8 = 8 column shifts, ev = 4, rv = 4, pretty sure should be 10
// _handleRolls -> refactor out of this

test("_rollDice should return if dice do not match", () => {
  const values = {
    label: "Test",
    type: "attribute",
    valueOrAps: 0,
    actionValue: 0,
    opposingValue: 0,
    effectValue: 0,
    resistanceValue: 0,
    rollFormula: "2 + 3",
    unskilled: false
  }
  global.rollIndex = 0;

  const dice = new MegsTableRolls(values);

  let resultData = {
    "result": "",
    "actionValue": 0,
    "opposingValue": 0,
    "difficulty": 0,
    "dice": [2,3],
    "columnShifts": 0,
    "effectValue": 0,
    "resistanceValue": 0,
    "success": true,
    "evResult": "",
    "rvColumnShifts": 0
  };

  dice._rollDice(resultData , {}).then((response) => {
      expect(response).toStrictEqual([2, 3]);
  });
});

test("_rollDice should roll again if have matching dice on first roll and elect to roll again", () => {
  global.Dialog = YesDialog
  const values = {
    label: "Test",
    type: "attribute",
    valueOrAps: 0,
    actionValue: 0,
    opposingValue: 0,
    effectValue: 0,
    resistanceValue: 0,
    rollFormula: "2 + 2 + 3 + 4",
    unskilled: false
  }
  global.rollIndex = 0;

  const dice = new MegsTableRolls(values);

  let resultData = {
    "result": "",
    "actionValue": 0,
    "opposingValue": 0,
    "difficulty": 0,
    "dice": [2,2,3,4],
    "columnShifts": 0,
    "effectValue": 0,
    "resistanceValue": 0,
    "success": true,
    "evResult": "",
    "rvColumnShifts": 0
  };

  dice._rollDice(resultData , {}).then((response) => {
      expect(response).toStrictEqual([2, 2, 3, 4]);
  });
});

test("_rollDice should roll again if have matching dice on first and second rolls and user elects to roll again both times", () => {
  global.Dialog = YesDialog
  const values = {
    label: "Test",
    type: "attribute",
    valueOrAps: 0,
    actionValue: 0,
    opposingValue: 0,
    effectValue: 0,
    resistanceValue: 0,
    rollFormula: "2 + 2 + 3 + 3 + 4 + 5",
    unskilled: false
  }
  global.rollIndex = 0;

  const dice = new MegsTableRolls(values);

  let resultData = {
    "result": "",
    "actionValue": 0,
    "opposingValue": 0,
    "difficulty": 0,
    "dice": [2,2,3,4],
    "columnShifts": 0,
    "effectValue": 0,
    "resistanceValue": 0,
    "success": true,
    "evResult": "",
    "rvColumnShifts": 0
  };

  dice._rollDice(resultData , {}).then((response) => {
      expect(response).toStrictEqual([2, 2, 3, 3, 4, 5]);
  });
});

test("_rollDice should not roll again if have matching dice on first roll and user elects not to roll again", () => {
  global.Dialog = NoDialog
  const values = {
    label: "Test",
    type: "attribute",
    valueOrAps: 0,
    actionValue: 0,
    opposingValue: 0,
    effectValue: 0,
    resistanceValue: 0,
    rollFormula: "2 + 2",
    unskilled: false
  }
  global.rollIndex = 0;

  const dice = new MegsTableRolls(values);

  let resultData = {
    "result": "",
    "actionValue": 0,
    "opposingValue": 0,
    "difficulty": 0,
    "dice": [2,2,3,4],
    "columnShifts": 0,
    "effectValue": 0,
    "resistanceValue": 0,
    "success": true,
    "evResult": "",
    "rvColumnShifts": 0
  };

  dice._rollDice(resultData , {}).then((response) => {
      expect(response).toStrictEqual([2, 2]);
  });
});

test("_rollDice should not roll again if have matching dice on first roll and user elects not to roll again", () => {
  global.Dialog = NoDialog
  const values = {
    label: "Test",
    type: "attribute",
    valueOrAps: 0,
    actionValue: 0,
    opposingValue: 0,
    effectValue: 0,
    resistanceValue: 0,
    rollFormula: "1 + 1",
    unskilled: false
  }
  global.rollIndex = 0;

  const dice = new MegsTableRolls(values);

  let resultData = {
    "result": "",
    "actionValue": 0,
    "opposingValue": 0,
    "difficulty": 0,
    "dice": [1, 1],
    "columnShifts": 0,
    "effectValue": 0,
    "resistanceValue": 0,
    "success": true,
    "evResult": "",
    "rvColumnShifts": 0
  };

  dice._rollDice(resultData , {}).then((response) => {
    expect(response).toStrictEqual([1, 1]);
    expect(resultData.result).toEqual("Double 1s: Automatic failure!");
    // TODO not really failing -> success === false
  });
});


test("_getActionTableDifficulty returns the correct difficulty number", () => {
  // TODO
})


test("_getColumnShifts returns the correct number of column shifts", () => {
  const values = new RollValues("Test",0,0,0,0,0,'1d10 + 1d10');
  const dice = new MegsTableRolls(values);

  const actionTable = CONFIG.tables.actionTable;

  // The roll must be greater than the Success Number
  // The total die roll must lie on or beyond the Column Shift Threshold. 
  for (let i=1; i < 19; i++) {
    expect(dice._getColumnShifts(11, i, actionTable)).toBe(0);
    expect(dice._getColumnShifts(12, i, actionTable)).toBe(0);
  }
  
  expect(dice._getColumnShifts(14, 1, actionTable)).toBe(1);
  expect(dice._getColumnShifts(16, 1, actionTable)).toBe(2);
  expect(dice._getColumnShifts(19, 1, actionTable)).toBe(3);
  expect(dice._getColumnShifts(22, 1, actionTable)).toBe(4);
  expect(dice._getColumnShifts(25, 1, actionTable)).toBe(5);
  expect(dice._getColumnShifts(29, 1, actionTable)).toBe(6);
  expect(dice._getColumnShifts(33, 1, actionTable)).toBe(7);
  expect(dice._getColumnShifts(37, 1, actionTable)).toBe(8);
  expect(dice._getColumnShifts(41, 1, actionTable)).toBe(9);
  expect(dice._getColumnShifts(46, 1, actionTable)).toBe(10);
  expect(dice._getColumnShifts(51, 1, actionTable)).toBe(11);
  expect(dice._getColumnShifts(56, 1, actionTable)).toBe(12);
  expect(dice._getColumnShifts(61, 1, actionTable)).toBe(13);
  expect(dice._getColumnShifts(66, 1, actionTable)).toBe(14);
  expect(dice._getColumnShifts(71, 1, actionTable)).toBe(15);
  expect(dice._getColumnShifts(76, 1, actionTable)).toBe(16);
  expect(dice._getColumnShifts(81, 1, actionTable)).toBe(17);

  expect(dice._getColumnShifts(15, 16, actionTable)).toBe(1);
  expect(dice._getColumnShifts(16, 16, actionTable)).toBe(2);
});

test('_getRangeIndex returns the correct index values', () => {
  const values = new RollValues("Test",0,0,0,0,0,'1d10 + 1d10');
  const dice = new MegsTableRolls(values);

  expect(dice._getRangeIndex(0)).toBe(0);
  expect(dice._getRangeIndex(60)).toBe(18);
});