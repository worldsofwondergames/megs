/* global canvas, Scene -- Foundry globals used inside page.evaluate callbacks */
import { test, expect } from '../fixtures/foundry-test.mjs';
import {
    prefixName,
    createHeroActor,
    createTargetActor,
    openActorSheet,
    closeAllWindows,
} from '../fixtures/test-data.mjs';
import {
    waitForRollDialog,
    getRollDialogValues,
    closeRollDialog,
    isRollDialogOpen,
} from '../fixtures/roll-helpers.mjs';

/**
 * Category 11 of #226: Token Interaction.
 * A temporary scene with two tokens is created for the whole file and
 * removed afterwards; the previously viewed scene is restored.
 */
test.describe('Token Interaction (#226 cat 11)', () => {
    let attackerId;
    let targetId;
    let sceneId;
    let originalSceneId;

    test.beforeAll(async ({ workerPage: page }) => {
        attackerId = await createHeroActor(page, prefixName('Token_Attacker'));
        // Target defaults: DEX 6, BODY 8 (distinct from attacker's 5/4)
        targetId = await createTargetActor(page, prefixName('Token_Target'));

        const ids = await page.evaluate(async ({ attackerId, targetId }) => {
            const originalSceneId = canvas?.scene?.id ?? null;
            const scene = await Scene.create({
                name: '_E2E_TokenScene',
                width: 2000,
                height: 2000,
                grid: { size: 100 },
            });
            const attacker = game.actors.get(attackerId);
            const target = game.actors.get(targetId);
            const attackerToken = (await attacker.getTokenDocument({ x: 500, y: 500 })).toObject();
            const targetToken = (await target.getTokenDocument({ x: 900, y: 500 })).toObject();
            await scene.createEmbeddedDocuments('Token', [attackerToken, targetToken]);
            await scene.view();
            return { sceneId: scene.id, originalSceneId };
        }, { attackerId, targetId });
        sceneId = ids.sceneId;
        originalSceneId = ids.originalSceneId;

        await page.waitForFunction(
            (id) => canvas?.ready === true && canvas.scene?.id === id,
            sceneId,
            { timeout: 30000 }
        );
    });

    test.afterAll(async ({ workerPage: page }) => {
        await page.evaluate(async ({ sceneId, originalSceneId, attackerId, targetId }) => {
            for (const t of [...game.user.targets]) {
                t.setTarget(false, { user: game.user, releaseOthers: false });
            }
            if (originalSceneId && game.scenes.get(originalSceneId)) {
                await game.scenes.get(originalSceneId).view();
            }
            const scene = game.scenes.get(sceneId);
            if (scene) await scene.delete();
            for (const id of [attackerId, targetId]) {
                const actor = game.actors.get(id);
                if (actor) await actor.delete();
            }
        }, { sceneId, originalSceneId, attackerId, targetId });
    });

    /** Find the canvas token for an actor id. */
    async function getTokenId(page, actorId) {
        return page.evaluate((id) => {
            const token = canvas.tokens.placeables.find(t => t.actor?.id === id);
            return token ? token.id : null;
        }, actorId);
    }

    test('Selecting a token controls it on the canvas', async ({ page }) => {
        const tokenId = await getTokenId(page, attackerId);
        expect(tokenId).not.toBeNull();

        const controlled = await page.evaluate((tokenId) => {
            const token = canvas.tokens.get(tokenId);
            token.control({ releaseOthers: true });
            return canvas.tokens.controlled.map(t => t.id);
        }, tokenId);
        expect(controlled).toEqual([tokenId]);
    });

    test('Targeting a token feeds its OV/RV into the roll dialog', async ({ page }) => {
        try {
            const targetTokenId = await getTokenId(page, targetId);
            await page.evaluate((tokenId) => {
                for (const t of [...game.user.targets]) {
                    t.setTarget(false, { user: game.user, releaseOthers: false });
                }
                canvas.tokens.get(tokenId).setTarget(true, { user: game.user, releaseOthers: true });
            }, targetTokenId);

            const targetCount = await page.evaluate(() => game.user.targets.size);
            expect(targetCount).toBe(1);

            // DEX roll against the target: OV = target DEX (6), RV = target BODY (8)
            await openActorSheet(page, attackerId, 'abilities');
            await page.click('.sheet.actor .tab.abilities .resource-label.rollable[data-key="dex"]');
            await waitForRollDialog(page);

            const values = await page.evaluate(() => {
                const d = document.querySelector('.dialog .megs-dialog');
                return {
                    ov: Number.parseInt(d.querySelector('#opposingValue').value),
                    rv: Number.parseInt(d.querySelector('#resistanceValue').value),
                };
            });
            expect(values.ov).toBe(6);
            expect(values.rv).toBe(8);

            await closeRollDialog(page);
        } finally {
            await page.evaluate(() => {
                for (const t of [...game.user.targets]) {
                    t.setTarget(false, { user: game.user, releaseOthers: false });
                }
            });
            await closeAllWindows(page);
        }
    });

    test('Targeting more than one token warns and blocks the roll', async ({ page }) => {
        try {
            const attackerTokenId = await getTokenId(page, attackerId);
            const targetTokenId = await getTokenId(page, targetId);
            await page.evaluate(({ a, b }) => {
                canvas.tokens.get(a).setTarget(true, { user: game.user, releaseOthers: true });
                canvas.tokens.get(b).setTarget(true, { user: game.user, releaseOthers: false });
            }, { a: attackerTokenId, b: targetTokenId });

            const targetCount = await page.evaluate(() => game.user.targets.size);
            expect(targetCount).toBe(2);

            await openActorSheet(page, attackerId, 'abilities');
            await page.click('.sheet.actor .tab.abilities .resource-label.rollable[data-key="dex"]');

            // Warning notification appears and no roll dialog opens
            await page.waitForFunction(
                () => [...document.querySelectorAll('.notification')]
                    .some(n => n.textContent.includes('You can only target one token')),
                null,
                { timeout: 10000 }
            );
            expect(await isRollDialogOpen(page)).toBe(false);
        } finally {
            await page.evaluate(() => {
                for (const t of [...game.user.targets]) {
                    t.setTarget(false, { user: game.user, releaseOthers: false });
                }
            });
            await closeAllWindows(page);
        }
    });

    test('Roll from a selected token uses that token\'s actor data', async ({ page }) => {
        try {
            const attackerTokenId = await getTokenId(page, attackerId);
            await page.evaluate((tokenId) => {
                for (const t of [...game.user.targets]) {
                    t.setTarget(false, { user: game.user, releaseOthers: false });
                }
                canvas.tokens.get(tokenId).control({ releaseOthers: true });
            }, attackerTokenId);

            // The token's sheet is the actor's sheet: AV should be the
            // attacker's DEX (5), not the previously targeted actor's.
            await openActorSheet(page, attackerId, 'abilities');
            await page.click('.sheet.actor .tab.abilities .resource-label.rollable[data-key="dex"]');
            await waitForRollDialog(page);

            const values = await getRollDialogValues(page);
            expect(values.actionValue).toBe(5);
            await closeRollDialog(page);
        } finally {
            await closeAllWindows(page);
        }
    });
});
