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

    // Set up reliability scores mapping (index → R# value)
    CONFIG.reliabilityScores = [0, 2, 3, 5, 7, 9, 11];
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
        // R# index 2 → R# 3 → reliabilityMod +1
        // BODY: 6 APs @ FC (6+1=7) = 42 HP
        // AV: Base 5 + (5 APs @ FC max(1, 1+1=2)) = 5 + 8 = 13 HP
        // EV: Base 5 + (5 APs @ FC max(1, 1+1=2)) = 5 + 8 = 13 HP
        // Range: Base 5 + (5 APs @ FC max(1, 1+1=2)) = 5 + 8 = 13 HP
        // Subtotal: 42 + 13 + 13 + 13 = 81 HP
        // Gadget Bonus ÷4 (can be Taken Away): ceil(81 / 4) = ceil(20.25) = 21 HP

        expect(machinegun.system.totalCost).toBe(21);
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
        // R# index 5 → R# 9 → reliabilityMod -2
        // BODY: 4 APs @ FC (6-2=4) = 12 HP
        // Child power is calculated inline, not from totalCost
        // With no parent items in mock, child cost = 0
        // Subtotal: 12 HP
        // Gadget Bonus ÷4: ceil(12 / 4) = 3 HP
        // Note: Child power calculation requires proper mock setup with parent.items

        expect(gadget.system.totalCost).toBe(3);
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
        // R# index 5 → R# 9 → reliabilityMod -2
        // BODY: 6 APs @ FC (6-2=4) = 24 HP
        // Gadget Bonus ÷2 (cannot be Taken Away): ceil(24 / 2) = 12 HP

        expect(gadget.system.totalCost).toBe(12);
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
        // R# index 2 → R# 3 → reliabilityMod +1
        // BODY: 5 APs @ FC (6+1=7) = 28 HP
        // Gadget Bonus ÷4: ceil(28 / 4) = 7 HP

        expect(gadget.system.totalCost).toBe(7);
    });
});

describe('Gadget cost with modified child powers (issue #287)', () => {
    // R# 5 (index 3) has no Factor Cost modifier, so these tests see only the power's own modifiers.
    // BODY 4 APs @ FC 6 = 18 HP.
    // Power: Base Cost 10, 5 APs. 5 APs costs 8/12/16/20/24 HP at FC 2/3/4/5/6.
    const makeGadget = (childItems) => {
        const gadget = new MEGSItem({
            _id: 'gadget1',
            name: 'Test Gadget',
            type: 'gadget',
            system: {
                attributes: { body: { value: 4, factorCost: 6 } },
                reliability: 3,
                canBeTakenAway: true
            }
        });
        gadget.parent = { items: childItems };
        gadget.prepareDerivedData();
        return gadget;
    };
    const power = (extra = {}) => ({
        _id: 'power1',
        id: 'power1',
        type: 'power',
        system: { parent: 'gadget1', aps: 5, factorCost: 5, baseCost: 10, ...extra }
    });
    const modifier = (type, parent, factorCostMod) => ({
        _id: `${type}-${parent}-${factorCostMod}`,
        type,
        system: { parent, factorCostMod }
    });

    test('unmodified power counts at its own Factor Cost', () => {
        // 18 + (10 + 20) = 48, 48 / 4 = 12
        expect(makeGadget([power()]).system.totalCost).toBe(12);
    });

    test('a limitation on the power lowers the gadget cost', () => {
        // FC 5 - 1 = 4: 18 + (10 + 16) = 44, 44 / 4 = 11
        const gadget = makeGadget([power(), modifier('limitation', 'power1', -1)]);
        expect(gadget.system.totalCost).toBe(11);
    });

    test('a bonus on the power raises the gadget cost', () => {
        // FC 5 + 1 = 6: 18 + (10 + 24) = 52, 52 / 4 = 13
        const gadget = makeGadget([power(), modifier('bonus', 'power1', 1)]);
        expect(gadget.system.totalCost).toBe(13);
    });

    test('a limitation on some other power does not change the gadget cost', () => {
        const gadget = makeGadget([power(), modifier('limitation', 'other-power', -1)]);
        expect(gadget.system.totalCost).toBe(12);
    });

    test('a limitation stacks with the linking reduction', () => {
        // FC 5 - 1 - 2 = 2: 5 APs @ FC 2 = 8. 18 + (10 + 8) = 36, 36 / 4 = 9
        const gadget = makeGadget([power({ isLinked: true }), modifier('limitation', 'power1', -1)]);
        expect(gadget.system.totalCost).toBe(9);
    });

    test('an untrained subskill lowers the cost of a skill on the gadget', () => {
        // FC 5 - 1 untrained = 4: 18 + 16 = 34, ceil(34 / 4) = 9
        const skill = {
            _id: 'skill1',
            id: 'skill1',
            type: 'skill',
            system: { parent: 'gadget1', aps: 5, factorCost: 5, baseCost: 0 }
        };
        const gadget = makeGadget([
            skill,
            { _id: 'sub1', type: 'subskill', system: { parent: 'skill1', isTrained: true } },
            { _id: 'sub2', type: 'subskill', system: { parent: 'skill1', isTrained: false } }
        ]);
        expect(gadget.system.totalCost).toBe(9);
    });

    test('gadget cost and gadget point budget use the same power cost', () => {
        const gadget = makeGadget([power(), modifier('limitation', 'power1', -1)]);
        // 10 + 16 before the gadget bonus
        expect(gadget.system.gadgetPointBudget.powersCost).toBe(26);
    });
});

describe('Reliability Number applies to child powers and skills (issue #294)', () => {
    // A gadget with no attributes and one power: Base Cost 10, 5 APs, Factor Cost 5.
    // 5 APs costs 5/8/20/32/40 HP at FC 1/2/5/8/10. Reliability index -> R#: 0->0 (+3), 3->5 (0), 6->11 (-3).
    const makeGadget = (reliability, childItems) => {
        const gadget = new MEGSItem({
            _id: 'gadget1',
            name: 'Test Gadget',
            type: 'gadget',
            system: { attributes: {}, reliability, canBeTakenAway: true }
        });
        gadget.parent = { items: childItems };
        gadget.prepareDerivedData();
        return gadget;
    };
    const power = (factorCost = 5) => ({
        _id: 'power1',
        id: 'power1',
        type: 'power',
        system: { parent: 'gadget1', aps: 5, factorCost, baseCost: 10 }
    });

    test('R# 0 adds 3 to the power Factor Cost', () => {
        // FC 5 + 3 = 8: 10 + 32 = 42, ceil(42 / 4) = 11
        expect(makeGadget(0, [power()]).system.totalCost).toBe(11);
    });

    test('R# 5 leaves the power Factor Cost alone', () => {
        // FC 5: 10 + 20 = 30, ceil(30 / 4) = 8
        expect(makeGadget(3, [power()]).system.totalCost).toBe(8);
    });

    test('R# 11 subtracts 3 from the power Factor Cost', () => {
        // FC 5 - 3 = 2: 10 + 8 = 18, ceil(18 / 4) = 5
        expect(makeGadget(6, [power()]).system.totalCost).toBe(5);
    });

    test('the Factor Cost is capped at 10', () => {
        // FC 9 + 3 = 12, capped to 10: 10 + 40 = 50, ceil(50 / 4) = 13
        expect(makeGadget(0, [power(9)]).system.totalCost).toBe(13);
    });

    test('the Factor Cost does not go below 1', () => {
        // FC 2 - 3 = -1, raised to 1: 10 + 5 = 15, ceil(15 / 4) = 4
        expect(makeGadget(6, [power(2)]).system.totalCost).toBe(4);
    });

    test('the R# also applies to a skill on the gadget', () => {
        // FC 5 + 3 = 8: 0 + 32 = 32, 32 / 4 = 8
        const skill = { _id: 'skill1', id: 'skill1', type: 'skill', system: { parent: 'gadget1', aps: 5, factorCost: 5, baseCost: 0 } };
        expect(makeGadget(0, [skill]).system.totalCost).toBe(8);
    });

    test('the gadget point budget uses the same power cost', () => {
        // 10 + 32 before the gadget bonus
        expect(makeGadget(0, [power()]).system.gadgetPointBudget.powersCost).toBe(42);
    });

    test('an unowned gadget applies the R# to its listed powers', () => {
        const gadget = new MEGSItem({
            name: 'Unowned Gadget',
            type: 'gadget',
            system: {
                attributes: {},
                reliability: 0,
                canBeTakenAway: true,
                powerAPs: { Gliding: 5 },
                powerBaseCosts: { Gliding: 10 },
                powerFactorCosts: { Gliding: 5 }
            }
        });
        gadget.prepareDerivedData();
        // FC 5 + 3 = 8: 10 + 32 = 42
        expect(gadget.system.gadgetPointBudget.powersCost).toBe(42);
    });
});

describe('Reliability Number Conversion', () => {
    test('converts index 0 to R# 0 (+3 to FC)', () => {
        const gadget = new MEGSItem({
            name: 'R# 0 Device',
            type: 'gadget',
            system: {
                attributes: {
                    body: { value: 3, factorCost: 6 }
                },
                reliability: 0, // Index 0 → R# 0
                canBeTakenAway: true
            }
        });

        gadget.prepareDerivedData();

        // Expected: 3 APs @ FC (6+3=9) = 20, ÷4 = 5
        expect(gadget.system.totalCost).toBe(5);
    });

    test('converts index 1 to R# 2 (+2 to FC)', () => {
        const gadget = new MEGSItem({
            name: 'R# 2 Device',
            type: 'gadget',
            system: {
                attributes: {
                    body: { value: 3, factorCost: 6 }
                },
                reliability: 1, // Index 1 → R# 2
                canBeTakenAway: true
            }
        });

        gadget.prepareDerivedData();

        // Expected: 3 APs @ FC (6+2=8) = 16, ÷4 = 4
        expect(gadget.system.totalCost).toBe(4);
    });

    test('converts index 3 to R# 5 (no FC modifier)', () => {
        const gadget = new MEGSItem({
            name: 'R# 5 Device',
            type: 'gadget',
            system: {
                attributes: {
                    body: { value: 4, factorCost: 6 }
                },
                reliability: 3, // Index 3 → R# 5 (default)
                canBeTakenAway: true
            }
        });

        gadget.prepareDerivedData();

        // Expected: 4 APs @ FC 6 = 18, ÷4 = 4.5 = 5
        expect(gadget.system.totalCost).toBe(5);
    });

    test('converts index 6 to R# 11 (-3 to FC, minimum 1)', () => {
        const gadget = new MEGSItem({
            name: 'R# 11 Device',
            type: 'gadget',
            system: {
                attributes: {
                    body: { value: 5, factorCost: 6 }
                },
                reliability: 6, // Index 6 → R# 11
                canBeTakenAway: true
            }
        });

        gadget.prepareDerivedData();

        // Expected: 5 APs @ FC max(1, 6-3=3) = 12, ÷4 = 3
        expect(gadget.system.totalCost).toBe(3);
    });
});

describe('Base Cost Only Powers', () => {
    test('power with factorCost 0 uses only baseCost', () => {
        const power = new MEGSItem({
            name: 'Self-Link',
            type: 'power',
            system: {
                baseCost: 10,
                factorCost: 0,
                aps: 5 // Should be ignored
            }
        });

        power.prepareDerivedData();

        // Expected: Only baseCost, no AP chart lookup
        expect(power.system.totalCost).toBe(10);
    });

    test('power with 0 APs has zero cost regardless of FC', () => {
        const power = new MEGSItem({
            name: 'Unpurchased Power',
            type: 'power',
            system: {
                baseCost: 5,
                factorCost: 7,
                aps: 0
            }
        });

        power.prepareDerivedData();

        // Expected: 0 cost when APs = 0
        expect(power.system.totalCost).toBe(0);
    });

    test('power with valid FC and APs uses AP chart', () => {
        const power = new MEGSItem({
            name: 'Flight',
            type: 'power',
            system: {
                baseCost: 0,
                factorCost: 5,
                aps: 10
            }
        });

        power.prepareDerivedData();

        // Expected: 0 (base) + chart(10 APs @ FC 5) = 80
        expect(power.system.totalCost).toBe(80);
    });
});

describe('Omni-Gadget Cost Calculation', () => {
    test('omni-gadget with no attributes has zero cost', () => {
        const gadget = new MEGSItem({
            name: 'Omni Widget',
            type: 'gadget',
            system: {
                isOmni: 'true',
                aps: 10,
                omniClasses: { a: 'true', b: 'true', c: 'false', d: 'false' },
                attributes: {},
                reliability: 3,
                canBeTakenAway: true
            }
        });

        gadget.prepareDerivedData();

        expect(gadget.system.totalCost).toBe(0);
    });

    test('omni-gadget with BODY attribute still costs HP', () => {
        const gadget = new MEGSItem({
            name: 'Omni Armor',
            type: 'gadget',
            system: {
                isOmni: 'true',
                aps: 8,
                omniClasses: { a: 'true', b: 'false', c: 'false', d: 'false' },
                attributes: {
                    body: { value: 5, factorCost: 6 }
                },
                reliability: 3,
                canBeTakenAway: true
            }
        });

        gadget.prepareDerivedData();

        // BODY: 5 APs @ FC 6 = 22, ÷4 = 5.5 = 6
        expect(gadget.system.totalCost).toBe(6);
    });

    test('omni-gadget with all four classes stores data correctly', () => {
        const gadget = new MEGSItem({
            name: 'Full Omni',
            type: 'gadget',
            system: {
                isOmni: 'true',
                aps: 15,
                omniClasses: { a: 'true', b: 'true', c: 'true', d: 'true' },
                attributes: {},
                reliability: 3,
                canBeTakenAway: true
            }
        });

        expect(gadget.system.isOmni).toBe('true');
        expect(gadget.system.aps).toBe(15);
        expect(gadget.system.omniClasses.a).toBe('true');
        expect(gadget.system.omniClasses.b).toBe('true');
        expect(gadget.system.omniClasses.c).toBe('true');
        expect(gadget.system.omniClasses.d).toBe('true');
    });
});

describe('Gadget Attribute FC Clamping', () => {
    test('FC is clamped to max 10 when reliability + hardened defenses exceeds limit', () => {
        const gadget = new MEGSItem({
            name: 'Over-FC Device',
            type: 'gadget',
            system: {
                attributes: {
                    body: { value: 2, factorCost: 6 }
                },
                reliability: 0, // R# 0, +3 to FC
                hasHardenedDefenses: true, // +2 to BODY FC
                canBeTakenAway: true
            }
        });

        gadget.prepareDerivedData();

        // Body FC: 6 + 3 (R#0) + 2 (Hardened) = 11, clamped to 10
        // 2 APs @ FC 10 = 10, ÷4 = 3
        expect(gadget.system.totalCost).toBe(3);
    });

    test('string factorCost is coerced to number', () => {
        const gadget = new MEGSItem({
            name: 'String FC Device',
            type: 'gadget',
            system: {
                attributes: {
                    body: { value: 2, factorCost: '6' }
                },
                reliability: 3, // R# 5, no modifier
                canBeTakenAway: true
            }
        });

        gadget.prepareDerivedData();

        // Body FC: 6 + 0 = 6; 2 APs @ FC 6 = 6, ÷4 = 2
        expect(gadget.system.totalCost).toBe(2);
    });

    test('gadgetPointBudget attributesCost matches individual calculation', () => {
        const gadget = new MEGSItem({
            name: 'Budget Test',
            type: 'gadget',
            system: {
                attributes: {
                    body: { value: 2, factorCost: 6 },
                    dex: { value: 3, factorCost: 7 }
                },
                reliability: 3, // R# 5, no modifier
                canBeTakenAway: true,
                creationBudget: { base: 100 }
            }
        });

        gadget.prepareDerivedData();

        // Body: 2 APs @ FC 6 = 6
        // Dex: 3 APs @ FC 7 = 14
        // Total attributes = 20
        expect(gadget.system.gadgetPointBudget.attributesCost).toBe(20);
    });
});

describe('Stackable Gadget Data Model', () => {
    test('stackable flag defaults to false in gadget data', () => {
        const gadget = new MEGSItem({
            name: 'Test Gadget',
            type: 'gadget',
            system: {
                attributes: {},
                reliability: 3,
                canBeTakenAway: true
            }
        });

        expect(gadget.system.isStackable).toBeFalsy();
    });

    test('stackable gadget retains flag through prepareDerivedData', () => {
        const gadget = new MEGSItem({
            name: 'Batarang',
            type: 'gadget',
            system: {
                isStackable: 'true',
                quantity: 3,
                attributes: {},
                reliability: 3,
                canBeTakenAway: true
            }
        });

        gadget.prepareDerivedData();

        expect(gadget.system.isStackable).toBe('true');
        expect(gadget.system.quantity).toBe(3);
    });

    test('stackable gadget cost calculation is unaffected by stackable flag', () => {
        const gadget = new MEGSItem({
            name: 'Stackable Device',
            type: 'gadget',
            system: {
                isStackable: 'true',
                quantity: 5,
                attributes: {
                    body: { value: 4, factorCost: 6 }
                },
                reliability: 3,
                canBeTakenAway: true
            }
        });

        gadget.prepareDerivedData();

        // Cost should be same as non-stackable: 4 APs @ FC 6 = 18, ÷4 = 5
        expect(gadget.system.totalCost).toBe(5);
    });
});
