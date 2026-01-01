import { MEGSActorSheet } from './actor-sheet.mjs';

/**
 * Extend the MEGSActorSheet to inherit shared handlers
 * @extends {MEGSActorSheet}
 */
export class MEGSCharacterBuilderSheet extends MEGSActorSheet {
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

        // Prepare powers for the Powers tab (exclude powers that belong to gadgets)
        context.powers = this.actor.items.filter(i => i.type === 'power' && !i.system.parent);

        // Prepare skills for the Skills tab (exclude skills that belong to gadgets)
        context.skills = this.actor.items.filter(i => i.type === 'skill' && !i.system.parent);

        // Prepare advantages and drawbacks for the Traits tab (exclude those that belong to gadgets)
        context.advantages = this.actor.items.filter(i => i.type === 'advantage' && !i.system.parent);
        context.drawbacks = this.actor.items.filter(i => i.type === 'drawback' && !i.system.parent);

        // Prepare gadgets for the Gadgets tab (exclude sub-gadgets that belong to other gadgets)
        context.gadgets = this.actor.items.filter(i => i.type === 'gadget' && !i.system.parent);
        // Set ownerId on each gadget so getGadgetDescription can find powers/skills
        context.gadgets.forEach(gadget => {
            gadget.ownerId = this.actor._id;
        });

        // Provide all items for helpers (getPowerModifiers, getSkillSubskills, etc.)
        const allItems = Array.from(this.actor.items);
        context.items = allItems;

        // Provide wealth data from CONFIG
        context.wealthData = CONFIG.wealth;

        // Ensure wealth fields are initialized in the database
        await this._ensureWealthInitialized();

        // Ensure wealth values are always numbers (Foundry form handling can convert to string)
        if (context.system.wealth !== undefined && context.system.wealth !== null) {
            context.system.wealth = parseInt(context.system.wealth);
        }
        if (context.system.wealthYear !== undefined && context.system.wealthYear !== null) {
            context.system.wealthYear = parseInt(context.system.wealthYear);
        }

        // Debug: Log wealth value in getData
        console.log('getData - wealth value:', context.system.wealth, 'type:', typeof context.system.wealth);

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

        // Enrich biography text for proper display of links and other enriched content
        if (context.system.biography) {
            context.enrichedBiography = await TextEditor.enrichHTML(context.system.biography, {
                async: true,
                secrets: this.document.isOwner,
                relativeTo: this.actor
            });
        } else {
            context.enrichedBiography = '';
        }

        return context;
    }

    /** @override */
    activateListeners(html) {
        super.activateListeners(html);

        // Inherited from MEGSActorSheet:
        // - .item-delete handler with cascade delete
        // - .ap-plus and .ap-minus handlers
        // - .tab.skills .skill-row .toggle-icon accordion toggle

        // Power/Skill isLinked checkbox
        html.on('change', 'input[name="system.isLinked"]', async (ev) => {
            ev.preventDefault();
            ev.stopPropagation();

            const itemId = $(ev.currentTarget).data('itemId');
            const item = this.actor.items.get(itemId);
            if (item) {
                const isLinked = ev.currentTarget.checked;
                await item.update({ 'system.isLinked': isLinked });
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

        // Wealth inflation adjustment checkbox
        html.on('change', '.wealth-inflation-checkbox', async (ev) => {
            ev.preventDefault();
            const isChecked = ev.currentTarget.checked;

            // Store current wealth selection to restore after render
            const currentWealth = parseInt(this.actor.system.wealth ?? 0);
            console.log('Checkbox change - current wealth:', currentWealth, 'checked:', isChecked);

            // If unchecking, reset year to 1990
            if (!isChecked) {
                await this.actor.update({
                    'system.wealthAdjustForInflation': false,
                    'system.wealthYear': 1990,
                    'system.wealth': currentWealth  // Preserve wealth selection
                });
            } else {
                await this.actor.update({
                    'system.wealthAdjustForInflation': true,
                    'system.wealth': currentWealth  // Preserve wealth selection
                });
            }
            console.log('After update - wealth:', this.actor.system.wealth);
        });

        // Wealth year selection
        html.on('change', '.wealth-year-select', async (ev) => {
            ev.preventDefault();
            const selectedYear = parseInt(ev.currentTarget.value);

            // Store current wealth selection to restore after render
            const currentWealth = parseInt(this.actor.system.wealth ?? 0);
            console.log('Year change - current wealth:', currentWealth, 'new year:', selectedYear);

            await this.actor.update({
                'system.wealthYear': selectedYear,
                'system.wealth': currentWealth  // Preserve wealth selection
            });
            console.log('After update - wealth:', this.actor.system.wealth);
        });

        // Wealth radio button selection
        html.on('change', '.wealth-radio', async (ev) => {
            ev.preventDefault();
            const selectedAP = parseInt(ev.currentTarget.value);
            await this.actor.update({ 'system.wealth': selectedAP });
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
     * Ensure wealth fields are properly initialized in the database
     * This fixes actors created before the wealth system was implemented
     */
    async _ensureWealthInitialized() {
        const actor = this.actor;
        let needsUpdate = false;
        const updates = {};

        // Check if wealth fields are missing or invalid
        if (actor.system.wealth === undefined || actor.system.wealth === null) {
            needsUpdate = true;
            updates['system.wealth'] = 0;
        }

        if (actor.system.wealthYear === undefined || actor.system.wealthYear === null) {
            needsUpdate = true;
            updates['system.wealthYear'] = 1990;
        }

        if (actor.system.wealthAdjustForInflation === undefined || actor.system.wealthAdjustForInflation === null) {
            needsUpdate = true;
            updates['system.wealthAdjustForInflation'] = false;
        }

        // Update the actor if needed
        if (needsUpdate) {
            console.log('MEGS Character Creator: Initializing wealth fields for actor', actor.name);
            await actor.update(updates);
        }
    }

    /**
     * Update wealth table dollar values dynamically without full re-render
     * @param {jQuery} html
     * @private
     */
    _updateWealthTableValues(html) {
        const wealthData = CONFIG.wealth;
        const currentYear = this.actor.system.wealthYear || 1990;

        if (!wealthData || !wealthData.wealth_table) return;

        // Update each row's dollar value
        wealthData.wealth_table.forEach(row => {
            const dollarValue = row[currentYear];
            if (dollarValue !== undefined) {
                const formattedValue = dollarValue.toLocaleString('en-US');
                html.find(`.wealth-value-col[data-ap="${row.ap}"]`).text(`$${formattedValue}`);
            }
        });
    }

    // _saveAccordionState and _restoreAccordionState are inherited from MEGSActorSheet
}
