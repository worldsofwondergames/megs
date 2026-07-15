import { test, expect } from '../fixtures/foundry-test.mjs';
import {
    prefixName,
    createHeroActor,
    addPowerToActor,
    addSkillToActor,
    addTraitToActor,
    addModifierToActorItem,
    deleteActor,
    closeAllWindows,
} from '../fixtures/test-data.mjs';

/**
 * Category 8 of #226: Hero Point Budget / Character Cost Calculator.
 *
 * Expected costs are hardcoded from assets/data/apCostChart.json:
 *   aps 2: [2, 2, 3, 4, 5, 6, 7, ...]      aps 3: [3, 4, 6, 8, 10, 12, 14, ...]
 *   aps 4: [4, 6, 9, 12, 15, 18, 21, ...]  aps 5: [5, 8, 12, 16, 20, 24, 28, ...]
 * (index = factor cost - 1)
 *
 * Default test hero: DEX 5, STR 4, BODY 4, INT 3, WILL 3, MIND 3,
 * INFL 2, AURA 2, SPIRIT 2. Attribute FCs: action attrs 7, others 6.
 *   DEX 28 + STR 18 + BODY 18 + INT 14 + WILL 12 + MIND 12
 *   + INFL 7 + AURA 6 + SPIRIT 6 = 121
 */
test.describe('Hero Point Budget (#226 cat 8)', () => {
    const ATTRIBUTES_COST = 121;

    async function getBudget(page, actorId) {
        return page.evaluate((id) => {
            const actor = game.actors.get(id);
            actor.prepareData();
            return foundry.utils.deepClone(actor.system.heroPointBudget);
        }, actorId);
    }

    test('Attribute costs follow the AP Cost Chart', async ({ page }) => {
        let actorId;
        try {
            actorId = await createHeroActor(page, prefixName('Budget_Attrs'));
            const budget = await getBudget(page, actorId);
            expect(budget.attributesCost).toBe(ATTRIBUTES_COST);
            expect(budget.base).toBe(450);
            expect(budget.totalSpent).toBe(ATTRIBUTES_COST);
            expect(budget.remaining).toBe(450 - ATTRIBUTES_COST);
        } finally {
            await closeAllWindows(page);
            if (actorId) await deleteActor(page, actorId);
        }
    });

    test('Power cost = baseCost + AP chart cost (10 + chart[5 APs][FC 3] = 22)', async ({ page }) => {
        let actorId;
        try {
            actorId = await createHeroActor(page, prefixName('Budget_Power'));
            await addPowerToActor(page, actorId, {
                name: 'Flame Being', aps: 5, baseCost: 10, factorCost: 3,
            });
            const budget = await getBudget(page, actorId);
            expect(budget.powersCost).toBe(22);
        } finally {
            await closeAllWindows(page);
            if (actorId) await deleteActor(page, actorId);
        }
    });

    test('Skill cost = baseCost + AP chart cost (0 + chart[3 APs][FC 4] = 8)', async ({ page }) => {
        let actorId;
        try {
            actorId = await createHeroActor(page, prefixName('Budget_Skill'));
            await addSkillToActor(page, actorId, {
                name: 'Artist', aps: 3, baseCost: 0, factorCost: 4,
            });
            const budget = await getBudget(page, actorId);
            expect(budget.skillsCost).toBe(8);
        } finally {
            await closeAllWindows(page);
            if (actorId) await deleteActor(page, actorId);
        }
    });

    test('Advantage adds its cost; drawback subtracts', async ({ page }) => {
        let actorId;
        try {
            actorId = await createHeroActor(page, prefixName('Budget_Traits'));
            await addTraitToActor(page, actorId, {
                name: 'Scholar Trait', type: 'advantage', baseCost: 15,
            });
            await addTraitToActor(page, actorId, {
                name: 'Unlucky Trait', type: 'drawback', baseCost: 10,
            });
            const budget = await getBudget(page, actorId);
            expect(budget.advantagesCost).toBe(15);
            expect(budget.drawbacks).toBe(-10); // stored under "drawbacks"
            expect(budget.traitsCost).toBe(5);
        } finally {
            await closeAllWindows(page);
            if (actorId) await deleteActor(page, actorId);
        }
    });

    test('Bonus factor cost modifier raises a power\'s cost', async ({ page }) => {
        let actorId;
        try {
            actorId = await createHeroActor(page, prefixName('Budget_Bonus'));
            const powerId = await addPowerToActor(page, actorId, {
                name: 'Energy Blast Test', aps: 5, baseCost: 10, factorCost: 3,
            });
            // FC 3 -> 22 total; bonus +2 makes FC 5 -> 10 + chart[5][FC 5]=20 -> 30
            await addModifierToActorItem(page, actorId, {
                name: 'Area Bonus', type: 'bonus', factorCostMod: 2, parent: powerId,
            });
            const budget = await getBudget(page, actorId);
            expect(budget.powersCost).toBe(30);
        } finally {
            await closeAllWindows(page);
            if (actorId) await deleteActor(page, actorId);
        }
    });

    test('Limitation factor cost modifier lowers a power\'s cost', async ({ page }) => {
        let actorId;
        try {
            actorId = await createHeroActor(page, prefixName('Budget_Limitation'));
            const powerId = await addPowerToActor(page, actorId, {
                name: 'Energy Blast Test', aps: 5, baseCost: 10, factorCost: 3,
            });
            // FC 3 -> 22 total; limitation -1 makes FC 2 -> 10 + chart[5][FC 2]=8 -> 18
            await addModifierToActorItem(page, actorId, {
                name: 'Touch Limitation', type: 'limitation', factorCostMod: -1, parent: powerId,
            });
            const budget = await getBudget(page, actorId);
            expect(budget.powersCost).toBe(18);
        } finally {
            await closeAllWindows(page);
            if (actorId) await deleteActor(page, actorId);
        }
    });

    test('Total budget sums attributes and all item categories', async ({ page }) => {
        let actorId;
        try {
            actorId = await createHeroActor(page, prefixName('Budget_Total'));
            await addPowerToActor(page, actorId, {
                name: 'Flight Test', aps: 5, baseCost: 10, factorCost: 3, // 22
            });
            await addSkillToActor(page, actorId, {
                name: 'Detective Test', aps: 3, baseCost: 0, factorCost: 4, // 8
            });
            await addTraitToActor(page, actorId, {
                name: 'Sharp Eye Trait', type: 'advantage', baseCost: 15, // +15
            });
            await addTraitToActor(page, actorId, {
                name: 'Debt Trait', type: 'drawback', baseCost: 10, // -10
            });

            const budget = await getBudget(page, actorId);
            const expectedItems = 22 + 8 + 15 - 10;
            expect(budget.itemsCost).toBe(expectedItems);
            expect(budget.totalSpent).toBe(ATTRIBUTES_COST + expectedItems);
            expect(budget.remaining).toBe(450 - ATTRIBUTES_COST - expectedItems);
            // Internal consistency: components add up to the reported total
            expect(budget.attributesCost + budget.wealthCost + budget.itemsCost).toBe(budget.totalSpent);
        } finally {
            await closeAllWindows(page);
            if (actorId) await deleteActor(page, actorId);
        }
    });
});
