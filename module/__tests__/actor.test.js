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
    // Helper function to create test actor with default attributes
    const createTestActor = (attributeOverrides = {}, wealth = 0, budget = 450) => {
        const defaultAttributes = {
            dex: { value: 0, factorCost: 7 },
            str: { value: 0, factorCost: 6 },
            body: { value: 0, factorCost: 6 },
            int: { value: 0, factorCost: 7 },
            will: { value: 0, factorCost: 6 },
            mind: { value: 0, factorCost: 6 },
            infl: { value: 0, factorCost: 7 },
            aura: { value: 0, factorCost: 6 },
            spirit: { value: 0, factorCost: 6 },
        };

        return new MEGSActor({
            system: {
                attributes: { ...defaultAttributes, ...attributeOverrides },
                wealth,
                creationBudget: { base: budget },
            },
        });
    };

    test('calculates attribute costs correctly with FC 7', () => {
        const actor = createTestActor({ dex: { value: 5, factorCost: 7 } });

        actor.items = [];
        actor.prepareBaseData();
        actor.prepareDerivedData();

        // DEX 5 @ FC 7 = 28 HP (chart["5"][6] = 28)
        expect(actor.system.heroPointBudget.attributesCost).toBe(28);
    });

    test('calculates attribute costs correctly with FC 6', () => {
        const actor = createTestActor({ str: { value: 6, factorCost: 6 } });

        actor.items = [];
        actor.prepareBaseData();
        actor.prepareDerivedData();

        // STR 6 @ FC 6 = 36 HP
        expect(actor.system.heroPointBudget.attributesCost).toBe(36);
    });

    test('excludes child items from budget totals', () => {
        const actor = createTestActor();

        // Create a gadget and a power that belongs to the gadget
        const gadget = {
            _id: 'gadget1',
            type: MEGS.itemTypes.gadget,
            system: { totalCost: 50, parent: null },
        };

        const childPower = {
            _id: 'power1',
            type: MEGS.itemTypes.power,
            system: { totalCost: 30, parent: 'gadget1' },
        };

        const standalonePower = {
            _id: 'power2',
            type: MEGS.itemTypes.power,
            system: { totalCost: 20, parent: null },
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

    test('handles drawbacks with positive cost (converts to negative)', () => {
        const actor = createTestActor();

        const drawback = {
            _id: 'drawback1',
            name: 'Test Drawback',
            type: MEGS.itemTypes.drawback,
            system: { totalCost: 25, parent: null },
        };

        actor.items = [drawback];
        actor.prepareBaseData();
        actor.prepareDerivedData();

        // Positive cost should be converted to negative
        expect(actor.system.heroPointBudget.drawbacks).toBe(-25);
        expect(actor.system.heroPointBudget.totalSpent).toBe(-25);
        expect(actor.system.heroPointBudget.total).toBe(450);
        expect(actor.system.heroPointBudget.remaining).toBe(475); // 450 - (-25) = 475
    });

    test('handles drawbacks with negative cost (stays negative)', () => {
        const actor = createTestActor();

        const drawback = {
            _id: 'drawback1',
            name: 'Test Drawback',
            type: MEGS.itemTypes.drawback,
            system: { totalCost: -50, parent: null },
        };

        actor.items = [drawback];
        actor.prepareBaseData();
        actor.prepareDerivedData();

        // Already negative cost should stay negative
        expect(actor.system.heroPointBudget.drawbacks).toBe(-50);
        expect(actor.system.heroPointBudget.totalSpent).toBe(-50);
        expect(actor.system.heroPointBudget.remaining).toBe(500); // 450 - (-50) = 500
    });

    test('calculates total spent and remaining correctly', () => {
        const actor = createTestActor(
            {
                dex: { value: 3, factorCost: 7 },
                str: { value: 2, factorCost: 6 },
                body: { value: 2, factorCost: 6 },
            },
            2
        ); // 2 APs wealth @ FC 2 = 2 HP

        const power = {
            _id: 'power1',
            type: MEGS.itemTypes.power,
            system: { totalCost: 50, parent: null },
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

// --- motivations (issue #243) -------------------------------------------------
// An undefined motivation list makes the sheet's {{selectOptions}} throw
// "Cannot convert undefined or null to object", which takes down the entire
// sheet render. Every type whose sheet shows the motivation select needs one.
describe('motivations', () => {
    const buildActor = (type) => {
        const actor = new MEGSActor({ system: { attributes: {} } });
        actor.type = type;
        actor.items = [];
        return actor;
    };

    beforeEach(() => {
        CONFIG.motivations = {
            hero: ['Upholding the Good', 'Seeking Justice'],
            villain: ['Power Lust', 'Mercenary'],
            antihero: ['Unwanted Power', 'Thrill of Adventure'],
        };
    });

    test('hero gets its own motivations plus antihero', () => {
        const actor = buildActor(MEGS.characterTypes.hero);
        actor.prepareBaseData();
        actor.prepareDerivedData();

        expect(actor.system.motivations).toContain('Upholding the Good');
        expect(actor.system.motivations).toContain('Unwanted Power');
        expect(actor.system.motivations).not.toContain('Power Lust');
    });

    test('villain gets its own motivations plus antihero', () => {
        const actor = buildActor(MEGS.characterTypes.villain);
        actor.prepareBaseData();
        actor.prepareDerivedData();

        expect(actor.system.motivations).toContain('Power Lust');
        expect(actor.system.motivations).toContain('Thrill of Adventure');
        expect(actor.system.motivations).not.toContain('Upholding the Good');
    });

    test('npc gets the full motivation list and is never undefined', () => {
        const actor = buildActor(MEGS.characterTypes.npc);
        actor.prepareBaseData();
        actor.prepareDerivedData();

        expect(actor.system.motivations).toBeDefined();
        expect(actor.system.motivations).toContain('Upholding the Good');
        expect(actor.system.motivations).toContain('Power Lust');
        expect(actor.system.motivations).toContain('Unwanted Power');
    });
});

describe('Equipped gadget Attributes replace the character\'s for rolls (issue #210)', () => {
    // The default test actor has DEX 9, STR 5, BODY 6, INT 12, WILL 12, MIND 10, INFL 10, AURA 8, SPIRIT 10
    const gadget = (name, attributes, isEquipped = true) => ({
        name,
        type: MEGS.itemTypes.gadget,
        system: { isEquipped, attributes },
    });
    const prepare = (items) => {
        const actor = new MEGSActor();
        actor.items = items;
        actor._prepareEffectiveAttributes();
        return actor;
    };

    test('with no gadgets the effective Attributes are the character\'s own', () => {
        const actor = prepare([]);
        expect(actor.system.effectiveAttributes).toEqual({
            dex: 9, str: 5, body: 6, int: 12, will: 12, mind: 10, infl: 10, aura: 8, spirit: 10,
        });
        expect(actor.system.attributeOverrides).toEqual({});
    });

    test('an equipped gadget\'s higher italicized Attribute replaces the character\'s', () => {
        const actor = prepare([gadget('Armor', { body: { value: 11, alwaysSubstitute: true } })]);
        expect(actor.system.effectiveAttributes.body).toBe(11);
        expect(actor.system.attributeOverrides).toEqual({ body: { value: 11, gadget: 'Armor' } });
        // The stored Attribute is unchanged
        expect(actor.system.attributes.body.value).toBe(6);
    });

    test('a gadget that is not equipped changes nothing', () => {
        const actor = prepare([gadget('Armor', { body: { value: 11, alwaysSubstitute: true } }, false)]);
        expect(actor.system.effectiveAttributes.body).toBe(6);
        expect(actor.system.attributeOverrides).toEqual({});
    });

    test('a lower italicized Attribute neither replaces nor adds to the character\'s', () => {
        const actor = prepare([gadget('Gauntlets', { str: { value: 3, alwaysSubstitute: true } })]);
        expect(actor.system.effectiveAttributes.str).toBe(5);
        expect(actor.system.attributeOverrides).toEqual({});
    });

    test('an Attribute that is not italicized changes nothing', () => {
        const actor = prepare([gadget('Car', { str: { value: 10, alwaysSubstitute: false } })]);
        expect(actor.system.effectiveAttributes.str).toBe(5);
    });

    test('with several equipped gadgets the highest value wins', () => {
        const actor = prepare([
            gadget('Vest', { body: { value: 8, alwaysSubstitute: true } }),
            gadget('Battlesuit', { body: { value: 14, alwaysSubstitute: true }, str: { value: 12, alwaysSubstitute: true } }),
            gadget('Helmet', { body: { value: 9, alwaysSubstitute: true } }),
        ]);
        expect(actor.system.attributeOverrides).toEqual({
            body: { value: 14, gadget: 'Battlesuit' },
            str: { value: 12, gadget: 'Battlesuit' },
        });
    });

    test('the item sheet\'s string "true" counts as equipped', () => {
        const actor = prepare([gadget('Armor', { body: { value: 11, alwaysSubstitute: true } }, 'true')]);
        expect(actor.system.effectiveAttributes.body).toBe(11);
    });

    test('roll helpers read the effective values', async () => {
        const { Utils } = await import('../utils.js');
        const actor = prepare([gadget('Battlesuit', {
            dex: { value: 11, alwaysSubstitute: true },
            str: { value: 12, alwaysSubstitute: true },
            body: { value: 14, alwaysSubstitute: true },
        })]);
        expect(Utils.getAttributeValue(actor, 'dex')).toBe(11);
        expect(Utils.getOpposingValue('dex', actor)).toBe(11);
        expect(Utils.getResistanceValue('dex', actor)).toBe(14);
        expect(Utils.getEffectValue('dex', actor)).toBe(12);
        // Attributes the gadget does not replace keep the character's value
        expect(Utils.getResistanceValue('int', actor)).toBe(10);
    });
});

describe('Initiative uses equipped gadgets\' italicized Attributes (issue #306)', () => {
    // The default test actor has DEX 9, INT 12 and INFL 10
    const prepare = (isEquipped) => {
        const actor = new MEGSActor();
        actor.items = [{
            name: 'Battlesuit',
            type: MEGS.itemTypes.gadget,
            system: {
                isEquipped,
                attributes: {
                    dex: { value: 11, alwaysSubstitute: true },
                    infl: { value: 14, alwaysSubstitute: true },
                },
            },
        }];
        actor._prepareEffectiveAttributes();
        return actor;
    };

    test('an equipped gadget raises the Initiative Bonus', () => {
        // 11 + 12 + 14
        expect(prepare(true)._calculateInitiativeBonus()).toBe(37);
    });

    test('an unequipped gadget leaves the Initiative Bonus alone', () => {
        // 9 + 12 + 10
        expect(prepare(false)._calculateInitiativeBonus()).toBe(31);
    });
});
