/* eslint-env jest */
import '../__mocks__/foundry.mjs';
/* global CONFIG */

import { MEGS } from '../helpers/config.mjs';

beforeAll(async () => {
    const fs = await import('fs/promises');
    const path = await import('path');
    const { fileURLToPath } = await import('url');

    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const chartPath = path.join(__dirname, '../../assets/data/apCostChart.json');

    const chartData = await fs.readFile(chartPath, 'utf-8');
    CONFIG.apCostChart = JSON.parse(chartData);
});

describe('MEGS.getAPCost', () => {
    test('returns correct cost for valid numeric inputs', () => {
        // 8 APs at FC 6 = 60 HP (from AP Purchase Chart)
        expect(MEGS.getAPCost(8, 6)).toBe(60);
    });

    test('returns 0 for 0 APs', () => {
        expect(MEGS.getAPCost(0, 6)).toBe(0);
    });

    test('coerces numeric string APs to number', () => {
        expect(MEGS.getAPCost('8', 6)).toBe(60);
    });

    test('coerces empty string APs to 0 (costs 0)', () => {
        expect(MEGS.getAPCost('', 6)).toBe(0);
    });

    test('returns 0 for NaN APs', () => {
        expect(MEGS.getAPCost(NaN, 6)).toBe(0);
    });

    test('returns 0 for null APs', () => {
        expect(MEGS.getAPCost(null, 6)).toBe(0);
    });

    test('returns 0 for undefined APs', () => {
        expect(MEGS.getAPCost(undefined, 6)).toBe(0);
    });

    test('returns 0 for negative APs', () => {
        expect(MEGS.getAPCost(-1, 6)).toBe(0);
    });

    test('calculates cost for APs over 40 using incremental formula', () => {
        const cost = MEGS.getAPCost(41, 6);
        expect(cost).toBeGreaterThan(0);
        expect(typeof cost).toBe('number');
    });

    test('returns 0 for FC below 1', () => {
        expect(MEGS.getAPCost(8, 0)).toBe(0);
    });

    test('returns 0 for FC above 10', () => {
        expect(MEGS.getAPCost(8, 11)).toBe(0);
    });

    test('returns 0 for non-numeric string APs', () => {
        expect(MEGS.getAPCost('abc', 6)).toBe(0);
    });

    test('coerces numeric string FC to number', () => {
        expect(MEGS.getAPCost(8, '6')).toBe(60);
    });

    test('returns 0 for empty string FC', () => {
        expect(MEGS.getAPCost(8, '')).toBe(0);
    });
});
