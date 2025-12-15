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

        // Prepare skills for the Skills tab
        context.skills = this.actor.items.filter(i => i.type === 'skill');

        // Prepare advantages and drawbacks for the Traits tab
        context.advantages = this.actor.items.filter(i => i.type === 'advantage');
        context.drawbacks = this.actor.items.filter(i => i.type === 'drawback');

        // Provide all items for helpers (getPowerModifiers, getSkillSubskills, etc.)
        const allItems = Array.from(this.actor.items);
        context.items = allItems;

        // Provide wealth data from CONFIG
        context.wealthData = CONFIG.wealth;

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

        // Item delete handler with cascade delete for modifiers
        html.on('click', '.item-delete', async (ev) => {
            const li = $(ev.currentTarget).parents('.item');
            const item = this.actor.items.get(li.data('itemId'));

            // If deleting a power or skill, also delete all associated bonuses/limitations
            if (item.type === 'power' || item.type === 'skill') {
                const modifiers = this.actor.items.filter(i =>
                    (i.type === 'bonus' || i.type === 'limitation') &&
                    i.system.parent === item._id
                );
                const modifierIds = modifiers.map(m => m._id);
                if (modifierIds.length > 0) {
                    await this.actor.deleteEmbeddedDocuments('Item', modifierIds);
                }
            }

            await item.delete();
            li.slideUp(200, () => this.render(false));
        });

        // Power/Skill APs increment
        html.on('click', '.ap-plus', async (ev) => {
            ev.preventDefault();
            const itemId = $(ev.currentTarget).data('itemId');
            const item = this.actor.items.get(itemId);
            if (item && (item.type === 'skill' || item.type === 'power')) {
                const newValue = (item.system.aps || 0) + 1;

                // Save accordion state before render
                this._saveAccordionState(html);

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

                // Save accordion state before render
                this._saveAccordionState(html);

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

        // Subskill isTrained checkbox
        html.on('change', '.subskill-checkbox', async (ev) => {
            const itemId = $(ev.currentTarget).data('itemId');
            const item = this.actor.items.get(itemId);
            if (item && item.type === 'subskill') {
                // Save accordion state before render
                this._saveAccordionState(html);

                await item.update({ 'system.isTrained': ev.currentTarget.checked });
                this.render(false);
            }
        });

        // Enable drag-and-drop for Bonuses/Limitations onto Powers
        this._enablePowerRowDropZones(html);

        // Skill accordion toggle
        html.on('click', '.tab.skills .skill-row .toggle-icon', (ev) => {
            ev.preventDefault();
            const skillRow = $(ev.currentTarget).closest('.skill-row');
            const skillId = skillRow.data('itemId');
            const isExpanded = skillRow.data('expanded');
            const icon = $(ev.currentTarget);

            if (isExpanded) {
                // Collapse - hide subskills
                html.find(`.subskill-row[data-parent-id="${skillId}"]`).slideUp(200);
                icon.removeClass('fa-chevron-down').addClass('fa-chevron-right');
                skillRow.data('expanded', false);
            } else {
                // Expand - show subskills
                html.find(`.subskill-row[data-parent-id="${skillId}"]`).slideDown(200);
                icon.removeClass('fa-chevron-right').addClass('fa-chevron-down');
                skillRow.data('expanded', true);
            }
        });

        // Wealth inflation adjustment checkbox
        html.on('change', '.wealth-inflation-checkbox', async (ev) => {
            const isChecked = ev.currentTarget.checked;

            // If unchecking, reset year to 1990
            if (!isChecked) {
                await this.actor.update({
                    'system.wealthAdjustForInflation': false,
                    'system.wealthYear': 1990
                });
            } else {
                await this.actor.update({ 'system.wealthAdjustForInflation': true });
            }

            // Enable/disable the year dropdown
            const yearSelect = html.find('.wealth-year-select');
            yearSelect.prop('disabled', !isChecked);

            this.render(false);
        });

        // Wealth year selection
        html.on('change', '.wealth-year-select', async (ev) => {
            const selectedYear = parseInt(ev.currentTarget.value);
            await this.actor.update({ 'system.wealthYear': selectedYear });
            this.render(false);
        });

        // Wealth radio button selection
        html.on('change', '.wealth-radio', async (ev) => {
            const selectedAP = parseInt(ev.currentTarget.value);
            await this.actor.update({ 'system.wealth': selectedAP });
            this.render(false);
        });

        // Restore accordion state after render
        this._restoreAccordionState(html);
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

    /**
     * Save the current accordion state for skills
     * @param {jQuery} html
     * @private
     */
    _saveAccordionState(html) {
        const state = {};
        html.find('.tab.skills .skill-row').each((i, row) => {
            const skillId = $(row).data('itemId');
            const isExpanded = $(row).data('expanded');
            state[skillId] = isExpanded;
        });
        this._accordionState = state;
    }

    /**
     * Restore the accordion state for skills after render
     * @param {jQuery} html
     * @private
     */
    _restoreAccordionState(html) {
        if (!this._accordionState) return;

        html.find('.tab.skills .skill-row').each((i, row) => {
            const skillId = $(row).data('itemId');
            const wasExpanded = this._accordionState[skillId];

            if (wasExpanded) {
                // Restore expanded state
                $(row).data('expanded', true);
                $(row).find('.toggle-icon').removeClass('fa-chevron-right').addClass('fa-chevron-down');
                html.find(`.subskill-row[data-parent-id="${skillId}"]`).show();
            }
        });
    }
}
