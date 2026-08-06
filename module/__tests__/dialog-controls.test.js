import { stepValue } from '../helpers/dialog-controls.mjs';

/**
 * Bounds arrive as raw HTML attribute strings, so the empty-string cases are the
 * ones that matter: Number('') is 0, and treating that as a real bound would pin
 * every unbounded stepper to zero.
 */
describe('stepValue', () => {
    test('adds the delta when the result is within bounds', () => {
        expect(stepValue('5', 1, '0', '10')).toBe(6);
        expect(stepValue('5', -1, '0', '10')).toBe(4);
    });

    test('clamps to min instead of stepping below it', () => {
        expect(stepValue('0', -1, '0', '10')).toBe(0);
    });

    test('clamps to max instead of stepping above it', () => {
        expect(stepValue('10', 1, '0', '10')).toBe(10);
    });

    test('honors a negative min, as current condition tracks use', () => {
        expect(stepValue('-7', -1, '-8', '')).toBe(-8);
        expect(stepValue('-8', -1, '-8', '')).toBe(-8);
    });

    test('treats an empty max as unbounded rather than as zero', () => {
        expect(stepValue('40', 1, '0', '')).toBe(41);
    });

    test('treats an empty min as unbounded rather than as zero', () => {
        expect(stepValue('0', -1, '', '')).toBe(-1);
    });

    test('treats a missing min/max as unbounded', () => {
        expect(stepValue('3', 1, undefined, undefined)).toBe(4);
        expect(stepValue('3', -1, null, null)).toBe(2);
    });

    test('treats a blank or non-numeric current value as zero', () => {
        expect(stepValue('', 1, '0', '10')).toBe(1);
        expect(stepValue('abc', 1, '0', '10')).toBe(1);
        expect(stepValue('', -1, '0', '10')).toBe(0);
    });

    test('cannot move a slider whose max equals its min', () => {
        expect(stepValue('0', 1, '0', '0')).toBe(0);
    });
});
