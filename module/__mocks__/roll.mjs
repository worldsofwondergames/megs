/* eslint-env jest */
import { jest } from '@jest/globals';

/**
 * Mocks for Foundry's Roll class
 */

/**
 * Roll
 */
global.rollToMessageMock = jest.fn((messageData = {}, { rollMode = null, create = true } = {}) => {
})
global.rollEvaluateMock = jest.fn(() => {
  return { total: 2 }
})
global.rollValidateMock = jest.fn((formula) => {
  return true
})
const Roll = jest.fn((diceArray, data = {}) => {

  const offset = global.rollIndex * 2;
  diceArray = diceArray.slice(offset, offset + 2);
  let diceFormula = "";
  if (!diceArray) diceArray = [];
  diceArray.forEach((element, index, array) => {
    diceFormula = diceFormula + element;
    if (index !== (array.length -1)) {
      diceFormula = diceFormula + " + ";
    }
  });
  global.rollIndex++;

  return {
    dice: [{ results: [10], options: {} }],
    toMessage: global.rollToMessageMock,
    evaluate: global.rollEvaluateMock,
    result: diceFormula
  }
}).mockName('Roll')
global.Roll = Roll
global.Roll.validate = global.rollValidateMock

global.rollIndex = 0;

export default Roll
