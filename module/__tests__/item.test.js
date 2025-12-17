import '../__mocks__/foundry.mjs';
import '../__mocks__/item.mjs';
/* global CONFIG, test, expect */
/**
 * Tests for Item.mjs using Foundry Mocks.
 * Mocks for Foundry Classes/Functions are found in __mocks__/foundry.mjs
 * Mocks for MEGSItem Class are found in __mocks__/item.mjs
 * eslint-env jest
 **/

import { MEGSItem } from '../documents/item.mjs';
import { MEGS } from '../helpers/config.mjs';

// Load AP Cost Chart for tests
beforeAll(async () => {
    const fs = await import('fs/promises');
    const path = await import('path');
    const { fileURLToPath } = await import('url');

    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const chartPath = path.join(__dirname, '../../assets/data/apCostChart.json');

    const chartData = await fs.readFile(chartPath, 'utf-8');
    const apCostChart = JSON.parse(chartData);
    CONFIG.apCostChart = apCostChart;
});

describe('Gadget Cost Calculation', () => {
    test('Machinegun cost calculation (can be Taken Away)', () => {
        // Create machinegun gadget: BODY: 6, AV: 5, EV: 5, Range: 5, Ammo: 10, R#: 2
        const machinegun = new MEGSItem({
            name: 'Machinegun',
            type: 'gadget',
            system: {
                attributes: {
                    body: { value: 6, factorCost: 6 }
                },
                actionValue: 5,
                effectValue: 5,
                range: 5,
                reliability: 2,
                canBeTakenAway: true
            }
        });

        // Trigger derived data calculation
        machinegun.prepareDerivedData();

        // Expected calculation:
        // AV: 5 (base) + 12 (chart: 5 APs @ FC 1+2=3) = 17
        // EV: 5 (base) + 12 (chart: 5 APs @ FC 1+2=3) = 17
        // Range: 5 (base) + 12 (chart: 5 APs @ FC 1+2=3) = 17
        // BODY: 48 (chart: 6 APs @ FC 6+2=8)
        // Subtotal: 99
        // Note: Ammo drawback would be handled separately as a child item
        // Gadget Bonus ÷4 (can be Taken Away): 99 ÷ 4 = 24.75 = 25

        expect(machinegun.system.totalCost).toBe(25);
    });

    test('Gadget cost with child power', () => {
        // Create a simple gadget with BODY and a power
        const gadget = new MEGSItem({
            name: 'Test Gadget',
            type: 'gadget',
            system: {
                attributes: {
                    body: { value: 4, factorCost: 6 }
                },
                reliability: 5, // R# 5 = no FC modifier
                canBeTakenAway: true
            }
        });

        // Mock parent actor with a power that belongs to this gadget
        const mockPower = {
            _id: 'power1',
            type: 'power',
            system: {
                parent: gadget._id,
                totalCost: 30
            }
        };

        gadget.parent = {
            items: [mockPower]
        };

        gadget.prepareDerivedData();

        // Expected calculation:
        // BODY: 18 (chart: 4 APs @ FC 6)
        // Child power: 30
        // Subtotal: 48
        // Gadget Bonus ÷4: 48 ÷ 4 = 12

        expect(gadget.system.totalCost).toBe(12);
    });

    test('Gadget that cannot be Taken Away uses ÷2 bonus', () => {
        // Create gadget that cannot be taken away
        const gadget = new MEGSItem({
            name: 'Battlesuit',
            type: 'gadget',
            system: {
                attributes: {
                    body: { value: 6, factorCost: 6 }
                },
                reliability: 5,
                canBeTakenAway: false // Cannot be taken away
            }
        });

        gadget.prepareDerivedData();

        // Expected calculation:
        // BODY: 36 (chart: 6 APs @ FC 6+0=6)
        // Gadget Bonus ÷2 (cannot be Taken Away): 36 ÷ 2 = 18

        expect(gadget.system.totalCost).toBe(18);
    });

    test('Reliability Number modifies attribute Factor Cost', () => {
        // Create gadget with R# 2 (adds +2 to FC)
        const gadget = new MEGSItem({
            name: 'Unstable Device',
            type: 'gadget',
            system: {
                attributes: {
                    body: { value: 5, factorCost: 6 }
                },
                reliability: 2, // +2 to FC
                canBeTakenAway: true
            }
        });

        gadget.prepareDerivedData();

        // Expected calculation:
        // BODY: 32 (chart: 5 APs @ FC 6+2=8)
        // Gadget Bonus ÷4: 32 ÷ 4 = 8

        expect(gadget.system.totalCost).toBe(8);
    });
});
