import '../__mocks__/foundry.mjs';
import '../__mocks__/item.mjs';
/* global CONFIG, MEGSItem, actorUpdateMock, rollToMessageMock, collectionFindMock, dccRollCreateRollMock, dccItemRollSpellCheckMock, uiNotificationsWarnMock, itemTypesMock, game, test, expect */
/**
 * Tests for Actor.mjs using Foundry Mocks.
 * Mocks for Foundry Classes/Functions are found in __mocks__/foundry.mjs
 * Mocks for MEGSItem Class are found in __mocks__/item.mjs
 * eslint-env jest
 **/

import { MEGSActor } from '../documents/actor.mjs';
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

// Create Base Test Actor
const actor = new MEGSActor();

test('prepareData sets ability modifiers', () => {
    expect(actor.name).toBe('Anonymous Hero');

    const attributes = actor.system.attributes;
    expect(attributes.dex.value).toEqual(9);
    expect(attributes.str.value).toEqual(5);
    expect(attributes.body.value).toEqual(6);
    expect(attributes.int.value).toEqual(12);
    expect(attributes.will.value).toEqual(12);
    expect(attributes.mind.value).toEqual(10);
    expect(attributes.infl.value).toEqual(10);
    expect(attributes.aura.value).toEqual(8);
    expect(attributes.spirit.value).toEqual(10);
});

test('_hasAbility returns true if ability is present', () => {
    const actor = new MEGSActor();
    const abilities = [{ name: 'Superspeed' }, { name: 'Martial Artist' }];
    expect(actor._hasAbility(abilities, 'Superspeed')).toBe(true);
    expect(actor._hasAbility(abilities, 'Martial Artist')).toBe(true);
    expect(actor._hasAbility(abilities, 'Not Present')).toBe(false);
});

test('_getAbilityAPs returns correct APs for ability', () => {
    const actor = new MEGSActor();
    const abilities = [
        { name: 'Superspeed', system: { aps: 5 } },
        { name: 'Martial Artist', system: { aps: 2 } },
    ];
    expect(actor._getAbilityAPs(abilities, 'Superspeed')).toBe(5);
    expect(actor._getAbilityAPs(abilities, 'Martial Artist')).toBe(2);
    expect(actor._getAbilityAPs(abilities, 'Not Present')).toBe(0);
});

test('_calculateInitiativeBonus returns correct value', () => {
    const actor = new MEGSActor();
    actor.system = {
        attributes: {
            dex: { value: 2 },
            int: { value: 3 },
            infl: { value: 4 },
        },
    };
    actor.items = [
        { name: 'Superspeed', system: { aps: 5 } },
        { name: 'Martial Artist', system: { aps: 0 } },
        { name: 'Lightning Reflexes', system: { aps: 0 } },
    ];
    // Should be 2+3+4+5+2+2 = 18
    expect(actor._calculateInitiativeBonus()).toBe(18);
});

describe('Character Budget Calculations', () => {
    test('calculates attribute costs correctly with FC 7', () => {
        const actor = new MEGSActor({
            system: {
                attributes: {
                    dex: { value: 5, factorCost: 7 },
                    str: { value: 0, factorCost: 6 },
                    body: { value: 0, factorCost: 6 },
                    int: { value: 0, factorCost: 7 },
                    will: { value: 0, factorCost: 6 },
                    mind: { value: 0, factorCost: 6 },
                    infl: { value: 0, factorCost: 7 },
                    aura: { value: 0, factorCost: 6 },
                    spirit: { value: 0, factorCost: 6 }
                },
                wealth: 0,
                creationBudget: { base: 450 }
            }
        });

        actor.items = [];
        actor.prepareBaseData();
        actor.prepareDerivedData();

        // DEX 5 @ FC 7 = 28 HP (chart["5"][6] = 28)
        expect(actor.system.heroPointBudget.attributesCost).toBe(28);
    });

    test('calculates attribute costs correctly with FC 6', () => {
        const actor = new MEGSActor({
            system: {
                attributes: {
                    dex: { value: 0, factorCost: 7 },
                    str: { value: 6, factorCost: 6 },
                    body: { value: 0, factorCost: 6 },
                    int: { value: 0, factorCost: 7 },
                    will: { value: 0, factorCost: 6 },
                    mind: { value: 0, factorCost: 6 },
                    infl: { value: 0, factorCost: 7 },
                    aura: { value: 0, factorCost: 6 },
                    spirit: { value: 0, factorCost: 6 }
                },
                wealth: 0,
                creationBudget: { base: 450 }
            }
        });

        actor.items = [];
        actor.prepareBaseData();
        actor.prepareDerivedData();

        // STR 6 @ FC 6 = 36 HP
        expect(actor.system.heroPointBudget.attributesCost).toBe(36);
    });

    test('excludes child items from budget totals', () => {
        const actor = new MEGSActor({
            system: {
                attributes: {
                    dex: { value: 0, factorCost: 7 },
                    str: { value: 0, factorCost: 6 },
                    body: { value: 0, factorCost: 6 },
                    int: { value: 0, factorCost: 7 },
                    will: { value: 0, factorCost: 6 },
                    mind: { value: 0, factorCost: 6 },
                    infl: { value: 0, factorCost: 7 },
                    aura: { value: 0, factorCost: 6 },
                    spirit: { value: 0, factorCost: 6 }
                },
                wealth: 0,
                creationBudget: { base: 450 }
            }
        });

        // Create a gadget and a power that belongs to the gadget
        const gadget = {
            _id: 'gadget1',
            type: MEGS.itemTypes.gadget,
            system: { totalCost: 50, parent: null }
        };

        const childPower = {
            _id: 'power1',
            type: MEGS.itemTypes.power,
            system: { totalCost: 30, parent: 'gadget1' }
        };

        const standalonePower = {
            _id: 'power2',
            type: MEGS.itemTypes.power,
            system: { totalCost: 20, parent: null }
        };

        actor.items = [gadget, childPower, standalonePower];
        actor.prepareBaseData();
        actor.prepareDerivedData();

        // Should only count gadget (50) and standalone power (20)
        // Child power should NOT be counted separately
        expect(actor.system.heroPointBudget.gadgetsCost).toBe(50);
        expect(actor.system.heroPointBudget.powersCost).toBe(20);
        expect(actor.system.heroPointBudget.itemsCost).toBe(70); // 50 + 20
    });

    test('handles drawbacks correctly in budget', () => {
        const actor = new MEGSActor({
            system: {
                attributes: {
                    dex: { value: 0, factorCost: 7 },
                    str: { value: 0, factorCost: 6 },
                    body: { value: 0, factorCost: 6 },
                    int: { value: 0, factorCost: 7 },
                    will: { value: 0, factorCost: 6 },
                    mind: { value: 0, factorCost: 6 },
                    infl: { value: 0, factorCost: 7 },
                    aura: { value: 0, factorCost: 6 },
                    spirit: { value: 0, factorCost: 6 }
                },
                wealth: 0,
                creationBudget: { base: 450 }
            }
        });

        const drawback = {
            _id: 'drawback1',
            type: MEGS.itemTypes.drawback,
            system: { totalCost: 25, parent: null }
        };

        actor.items = [drawback];
        actor.prepareBaseData();
        actor.prepareDerivedData();

        // Drawbacks have negative costs that reduce total spent
        expect(actor.system.heroPointBudget.drawbacks).toBe(-25); // Negative value
        expect(actor.system.heroPointBudget.totalSpent).toBe(-25); // Reduced by drawback
        expect(actor.system.heroPointBudget.total).toBe(450); // Base budget unchanged
        expect(actor.system.heroPointBudget.remaining).toBe(475); // 450 - (-25) = 475
    });

    test('calculates total spent and remaining correctly', () => {
        const actor = new MEGSActor({
            system: {
                attributes: {
                    dex: { value: 3, factorCost: 7 },
                    str: { value: 2, factorCost: 6 },
                    body: { value: 2, factorCost: 6 },
                    int: { value: 0, factorCost: 7 },
                    will: { value: 0, factorCost: 6 },
                    mind: { value: 0, factorCost: 6 },
                    infl: { value: 0, factorCost: 7 },
                    aura: { value: 0, factorCost: 6 },
                    spirit: { value: 0, factorCost: 6 }
                },
                wealth: 2, // 2 APs @ FC 2 = 2 HP
                creationBudget: { base: 450 }
            }
        });

        const power = {
            _id: 'power1',
            type: MEGS.itemTypes.power,
            system: { totalCost: 50, parent: null }
        };

        actor.items = [power];
        actor.prepareBaseData();
        actor.prepareDerivedData();

        // Attributes: DEX 3@FC7=14, STR 2@FC6=6, BODY 2@FC6=6 = 26
        // Wealth: 2@FC2=2
        // Power: 50
        // Total spent: 26 + 2 + 50 = 78
        // Remaining: 450 - 78 = 372
        expect(actor.system.heroPointBudget.attributesCost).toBe(26);
        expect(actor.system.heroPointBudget.wealthCost).toBe(2);
        expect(actor.system.heroPointBudget.itemsCost).toBe(50);
        expect(actor.system.heroPointBudget.totalSpent).toBe(78);
        expect(actor.system.heroPointBudget.remaining).toBe(372);
    });
});
