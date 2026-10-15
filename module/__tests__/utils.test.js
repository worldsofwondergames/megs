import '../__mocks__/foundry.mjs';
import { Utils } from '../utils.js';

// Issue #282: the builder sheets save Linked as a boolean, the item sheet as a string.
describe('Utils.isTrue', () => {
    test.each([
        [true, true],
        ['true', true],
        [false, false],
        ['false', false],
        [undefined, false],
        ['', false]
    ])('isTrue(%p) is %p', (value, expected) => {
        expect(Utils.isTrue(value)).toBe(expected);
    });
});
