/**
 * Extend the basic ActorSheet with some very simple modifications
 * @extends {ActorSheet}
 */
export class MEGSCharacterBuilderSheet extends ActorSheet {
    /** @override */
    static get defaultOptions() {
        let newOptions = super.defaultOptions;
        newOptions.classes = ['megs', 'sheet', 'actor'];
        newOptions.width = 650;
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

        // Prepare powers for the Powers tab
        context.powers = this.actor.items.filter(i => i.type === 'power');

        // Provide all items for the getPowerModifiers helper
        context.items = this.actor.items;

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

    /** @override */
    activateListeners(html) {
        super.activateListeners(html);

        // Item delete handler
        html.on('click', '.item-delete', (ev) => {
            const li = $(ev.currentTarget).parents('.item');
            const item = this.actor.items.get(li.data('itemId'));
            item.delete();
            li.slideUp(200, () => this.render(false));
        });

        // Power/Skill APs increment
        html.on('click', '.ap-plus', async (ev) => {
            ev.preventDefault();
            const itemId = $(ev.currentTarget).data('itemId');
            const item = this.actor.items.get(itemId);
            if (item && (item.type === 'skill' || item.type === 'power')) {
                const newValue = (item.system.aps || 0) + 1;
                await item.update({ 'system.aps': newValue });
                this.render(false);
            }
        });

        // Power/Skill APs decrement
        html.on('click', '.ap-minus', async (ev) => {
            ev.preventDefault();
            const itemId = $(ev.currentTarget).data('itemId');
            const item = this.actor.items.get(itemId);
            if (item && (item.type === 'skill' || item.type === 'power') && (item.system.aps || 0) > 0) {
                const newValue = (item.system.aps || 0) - 1;
                await item.update({ 'system.aps': newValue });
                this.render(false);
            }
        });

        // Power/Skill isLinked checkbox
        html.on('change', 'input[name="system.isLinked"]', async (ev) => {
            const itemId = $(ev.currentTarget).data('itemId');
            const item = this.actor.items.get(itemId);
            if (item) {
                await item.update({ 'system.isLinked': ev.currentTarget.checked });
                this.render(false);
            }
        });

        // Enable drag-and-drop for Bonuses/Limitations onto Powers
        this._enablePowerRowDropZones(html);
    }

    /**
     * Enable each power row as a drop zone for Bonuses and Limitations
     * @param {jQuery} html
     * @private
     */
    _enablePowerRowDropZones(html) {
        const powerRows = html.find('.tab.powers .item-row');

        powerRows.each((i, row) => {
            row.addEventListener('dragover', this._onDragOver.bind(this));
            row.addEventListener('drop', this._onDropOnPower.bind(this));
        });
    }

    /**
     * Handle dragover event to allow dropping
     * @param {DragEvent} event
     * @private
     */
    _onDragOver(event) {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'copy';
    }

    /**
     * Handle dropping a Bonus or Limitation onto a Power
     * @param {DragEvent} event
     * @private
     */
    async _onDropOnPower(event) {
        event.preventDefault();
        event.stopPropagation();

        // Get the power ID from the row
        const row = event.currentTarget;
        const powerId = row.dataset.itemId;

        if (!powerId) return;

        // Get the dropped item data
        const data = TextEditor.getDragEventData(event);
        const droppedItem = await Item.implementation.fromDropData(data);

        if (!droppedItem) return;

        // Only allow Bonuses and Limitations
        if (droppedItem.type !== 'bonus' && droppedItem.type !== 'limitation') {
            ui.notifications.warn('Only Bonuses and Limitations can be dropped onto Powers.');
            return;
        }

        // Create the item data with parent set to the power
        const itemData = droppedItem.toObject();
        itemData.system.parent = powerId;

        // Create the item on the actor
        await this.actor.createEmbeddedDocuments('Item', [itemData]);

        ui.notifications.info(`${droppedItem.name} attached to power.`);
        this.render(false);
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
