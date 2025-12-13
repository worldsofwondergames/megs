/**
 * Extend the basic ActorSheet with some very simple modifications
 * @extends {ActorSheet}
 */
export class MEGSCharacterBuilderSheet extends ActorSheet {
    /** @override */
    static get defaultOptions() {
        let newOptions = super.defaultOptions;
        newOptions.classes = ['megs', 'sheet', 'actor'];
        newOptions.width = 600;
        newOptions.height = 600;
        newOptions.tabs = [
            {
                navSelector: '.sheet-tabs',
                contentSelector: '.sheet-body',
                initial: 'attributes',
            },
        ];
        return newOptions;
    }

    /** @override */
    get template() {
        return `systems/megs/templates/actor/character-creator-sheet.hbs`;
    }

    /** @override */
    async getData() {
        const context = await super.getData();

        // Ensure context.system exists
        if (!context.system) {
            context.system = this.actor.system;
        }

        // Check if actor needs attribute initialization and fix it in the database
        await this._ensureAttributesInitialized();

        // Ensure attributes are properly initialized in the context for rendering
        // This fixes issues where older actors might have undefined or malformed attribute data
        const defaultAttributes = {
            dex: { value: 0, factorCost: 7, label: 'Dexterity', type: 'physical', rolls: ['action', 'opposing'] },
            str: { value: 0, factorCost: 6, label: 'Strength', type: 'physical', rolls: ['effect'] },
            body: { value: 0, factorCost: 6, label: 'Body', type: 'physical', rolls: ['resistance'] },
            int: { value: 0, factorCost: 7, label: 'Intelligence', type: 'mental', rolls: ['action', 'opposing'] },
            will: { value: 0, factorCost: 6, label: 'Will', type: 'mental', rolls: ['effect'] },
            mind: { value: 0, factorCost: 6, label: 'Mind', type: 'mental', rolls: ['resistance'] },
            infl: { value: 0, factorCost: 7, label: 'Influence', type: 'mystical', rolls: ['action', 'opposing'] },
            aura: { value: 0, factorCost: 6, label: 'Aura', type: 'mystical', rolls: ['effect'] },
            spirit: { value: 0, factorCost: 6, label: 'Spirit', type: 'mystical', rolls: ['resistance'] }
        };

        if (!context.system.attributes) {
            context.system.attributes = {};
        }

        for (const [key, defaultAttr] of Object.entries(defaultAttributes)) {
            if (!context.system.attributes[key]) {
                context.system.attributes[key] = { ...defaultAttr };
            } else {
                // Ensure the value property exists
                if (context.system.attributes[key].value === undefined || context.system.attributes[key].value === null) {
                    context.system.attributes[key].value = 0;
                }
            }
        }

        return context;
    }

    /**
     * Ensure actor attributes are properly initialized in the database
     * This fixes actors created before the attribute system was fully implemented
     */
    async _ensureAttributesInitialized() {
        const actor = this.actor;
        const attributes = actor.system.attributes;

        // Check if any attributes are missing or have undefined values
        let needsUpdate = false;
        const updates = {};

        const attributeKeys = ['dex', 'str', 'body', 'int', 'will', 'mind', 'infl', 'aura', 'spirit'];

        for (const key of attributeKeys) {
            if (!attributes || !attributes[key] || attributes[key].value === undefined || attributes[key].value === null) {
                needsUpdate = true;
                // Only update if value is actually missing - preserve existing values
                if (!attributes || !attributes[key] || attributes[key].value === undefined || attributes[key].value === null) {
                    updates[`system.attributes.${key}.value`] = 0;
                }
            }
        }

        // Update the actor if needed
        if (needsUpdate) {
            console.log('MEGS Character Creator: Initializing missing attributes for actor', actor.name);
            await actor.update(updates);
        }
    }
}
