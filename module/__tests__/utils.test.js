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

// Issue #286: a linked Power or Skill must have the same APs as its Attribute.
describe('Utils.getLinkMismatch', () => {
    const actor = { system: { attributes: { dex: { value: 7 } } } };
    const item = (system) => ({ system: { link: 'dex', aps: 6, isLinked: true, ...system } });

    test.each([true, 'true'])('isLinked %p with APs below the Attribute is a mismatch', (isLinked) => {
        expect(Utils.getLinkMismatch(item({ isLinked }), actor)).toEqual({ link: 'dex', attributeValue: 7, aps: 6 });
    });

    test('APs above the Attribute is a mismatch', () => {
        expect(Utils.getLinkMismatch(item({ aps: 8 }), actor)).toEqual({ link: 'dex', attributeValue: 7, aps: 8 });
    });

    test('APs equal to the Attribute is not a mismatch', () => {
        expect(Utils.getLinkMismatch(item({ aps: 7 }), actor)).toBeNull();
    });

    test.each([false, 'false', undefined])('isLinked %p is never a mismatch', (isLinked) => {
        expect(Utils.getLinkMismatch(item({ isLinked }), actor)).toBeNull();
    });

    test.each(['none', 'special', ''])('link %p has no Attribute to compare with', (link) => {
        expect(Utils.getLinkMismatch(item({ link }), actor)).toBeNull();
    });

    test('no owning actor is not a mismatch', () => {
        expect(Utils.getLinkMismatch(item({}), null)).toBeNull();
    });
});
