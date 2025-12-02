/* eslint-env jest */
import { jest } from '@jest/globals';
import { log, error } from 'console'; // jest overrides console; use these instead

/**
 * Mocks for Foundry's Roll class
 */

/**
 * Roll
 */
global.rollToMessageMock = jest.fn(
    (messageData = {}, { rollMode = null, create = true } = {}) => {}
);
global.rollEvaluateMock = jest.fn(() => {
    return { total: 2 };
});
global.rollEvaluateMock = function () {
    return { total: 2 };
};

global.rollValidateMock = jest.fn((formula) => {
    return true;
});
const Roll = jest
    .fn((diceFormula, data = {}) => {
        const offset = global.rollIndex * 2;
        const diceArray = diceFormula.split('+').map((s) => s.trim());
        diceFormula = diceArray[offset] + ' + ' + diceArray[offset + 1];
        global.rollIndex++;

        return {
            dice: [{ results: [10], options: {} }],
            toMessage: global.rollToMessageMock,
            evaluate: global.rollEvaluateMock,
            result: diceFormula,
        };
    })
    .mockName('Roll');
global.Roll = Roll;
global.Roll.validate = global.rollValidateMock;

global.rollIndex = 0;

export default Roll;
