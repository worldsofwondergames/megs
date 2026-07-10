const TEST_PREFIX = '_E2E_';

export function prefixName(name) {
    return TEST_PREFIX + name;
}

export async function createHeroActor(page, name, attributes = {}) {
    return page.evaluate(async ({ name, attributes }) => {
        const actor = await Actor.create({
            name,
            type: 'hero',
            system: {
                attributes: {
                    dex: { value: attributes.dex || 5 },
                    str: { value: attributes.str || 4 },
                    body: { value: attributes.body || 4 },
                    int: { value: attributes.int || 3 },
                    will: { value: attributes.will || 3 },
                    mind: { value: attributes.mind || 3 },
                    infl: { value: attributes.infl || 2 },
                    aura: { value: attributes.aura || 2 },
                    spirit: { value: attributes.spirit || 2 },
                },
                heroPoints: { value: 10 },
            },
        });
        return actor.id;
    }, { name, attributes });
}

export async function createTargetActor(page, name, attributes = {}) {
    return page.evaluate(async ({ name, attributes }) => {
        const actor = await Actor.create({
            name,
            type: 'hero',
            system: {
                attributes: {
                    dex: { value: attributes.dex || 6 },
                    str: { value: attributes.str || 7 },
                    body: { value: attributes.body || 8 },
                    int: { value: attributes.int || 4 },
                    will: { value: attributes.will || 5 },
                    mind: { value: attributes.mind || 6 },
                    infl: { value: attributes.infl || 3 },
                    aura: { value: attributes.aura || 4 },
                    spirit: { value: attributes.spirit || 5 },
                },
                heroPoints: { value: 10 },
            },
        });
        return actor.id;
    }, { name, attributes });
}

export async function addPowerToActor(page, actorId, powerData) {
    return page.evaluate(async ({ actorId, powerData }) => {
        const actor = game.actors.get(actorId);
        const items = await actor.createEmbeddedDocuments('Item', [{
            name: powerData.name,
            type: 'power',
            system: {
                aps: powerData.aps || 8,
                link: powerData.link || 'str',
                source: powerData.source || 'physical',
                type: powerData.type || 'dice',
                avSource: powerData.avSource || '',
                evSource: powerData.evSource || '',
                ovSource: powerData.ovSource || '',
                rvSource: powerData.rvSource || '',
                parent: powerData.parent || '',
            },
        }]);
        return items[0].id;
    }, { actorId, powerData });
}

export async function addSkillToActor(page, actorId, skillData) {
    return page.evaluate(async ({ actorId, skillData }) => {
        const actor = game.actors.get(actorId);
        const items = await actor.createEmbeddedDocuments('Item', [{
            name: skillData.name,
            type: 'skill',
            system: {
                aps: skillData.aps || 3,
                link: skillData.link || 'dex',
                parent: skillData.parent || '',
            },
        }]);
        return items[0].id;
    }, { actorId, skillData });
}

export async function addTraitToActor(page, actorId, traitData) {
    return page.evaluate(async ({ actorId, traitData }) => {
        const actor = game.actors.get(actorId);
        const items = await actor.createEmbeddedDocuments('Item', [{
            name: traitData.name,
            type: traitData.type || 'advantage',
            system: {
                baseCost: traitData.baseCost || 5,
                text: traitData.text || '',
                gadgetOnly: traitData.gadgetOnly || false,
                creationOnly: traitData.creationOnly || false,
                hasSubtext: traitData.hasSubtext !== false,
            },
        }]);
        return items[0].id;
    }, { actorId, traitData });
}

export async function addGadgetToActor(page, actorId, gadgetData) {
    return page.evaluate(async ({ actorId, gadgetData }) => {
        const actor = game.actors.get(actorId);
        const items = await actor.createEmbeddedDocuments('Item', [{
            name: gadgetData.name,
            type: 'gadget',
            system: {
                actionValue: gadgetData.av || 0,
                effectValue: gadgetData.ev || 0,
                description: gadgetData.description || '',
                reliability: gadgetData.reliability ?? 0,
                isBroken: gadgetData.isBroken || false,
                attributes: {
                    dex: { value: gadgetData.attrs?.dex || 0, label: 'DEX', alwaysSubstitute: gadgetData.attrs?.dexItalic || false },
                    str: { value: gadgetData.attrs?.str || 0, label: 'STR', alwaysSubstitute: gadgetData.attrs?.strItalic || false },
                    body: { value: gadgetData.attrs?.body || 0, label: 'BODY', alwaysSubstitute: gadgetData.attrs?.bodyItalic || false },
                    int: { value: gadgetData.attrs?.int || 0, label: 'INT', alwaysSubstitute: false },
                    will: { value: gadgetData.attrs?.will || 0, label: 'WILL', alwaysSubstitute: false },
                    mind: { value: gadgetData.attrs?.mind || 0, label: 'MIND', alwaysSubstitute: false },
                    infl: { value: gadgetData.attrs?.infl || 0, label: 'INFL', alwaysSubstitute: false },
                    aura: { value: gadgetData.attrs?.aura || 0, label: 'AURA', alwaysSubstitute: false },
                    spirit: { value: gadgetData.attrs?.spirit || 0, label: 'SPIRIT', alwaysSubstitute: false },
                },
                settings: { hasAttributes: gadgetData.hasAttributes ?? true },
            },
        }]);
        return items[0].id;
    }, { actorId, gadgetData });
}

export async function deleteActor(page, actorId) {
    await page.evaluate(async (id) => {
        const actor = game.actors.get(id);
        if (actor) await actor.delete();
    }, actorId);
}

export async function cleanupE2EActors(page) {
    await page.evaluate(async (prefix) => {
        const actors = game.actors.filter(a => a.name.startsWith(prefix));
        for (const actor of actors) {
            await actor.delete();
        }
    }, TEST_PREFIX);
}

export async function openActorSheet(page, actorId, tab) {
    await page.evaluate(({ id, tab }) => {
        const actor = game.actors.get(id);
        if (!actor) throw new Error('Actor not found: ' + id);
        actor.sheet.render(true);
    }, { id: actorId, tab });
    await page.waitForSelector('.sheet.actor', { timeout: 5000 });
    if (tab) {
        await page.click(`.sheet.actor .tabs .item[data-tab="${tab}"]`);
        await page.waitForSelector(`.sheet.actor .tab.${tab}`, { timeout: 5000 });
    }
}

export async function openItemSheet(page, actorId, itemId) {
    await page.evaluate(({ actorId, itemId }) => {
        const actor = game.actors.get(actorId);
        if (!actor) throw new Error('Actor not found: ' + actorId);
        const item = actor.items.get(itemId);
        if (!item) throw new Error('Item not found: ' + itemId);
        item.sheet.render(true);
    }, { actorId, itemId });
    await page.waitForSelector('.sheet.item', { timeout: 5000 });
}

export async function closeAllWindows(page) {
    await page.evaluate(() => {
        Object.values(ui.windows).forEach(w => w.close());
    });
    await page.waitForFunction(() => Object.keys(ui.windows).length === 0, { timeout: 5000 });
}
