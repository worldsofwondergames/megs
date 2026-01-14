import { MEGSItemSheet } from './item-sheet.mjs';
import { MEGS } from '../helpers/config.mjs';

/**
 * Gadget Builder Sheet - Character creator-like interface for gadgets
 * @extends {MEGSItemSheet}
 */
export class MEGSGadgetBuilderSheet extends MEGSItemSheet {
    /** @override */
    static get defaultOptions() {
        let newOptions = super.defaultOptions;
        newOptions.classes = ['megs', 'sheet', 'item', 'gadget-builder'];
        newOptions.width = 750;
        newOptions.height = 700;
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
        return `systems/megs/templates/item/gadget-builder-sheet.hbs`;
    }

    /** @override */
    async getData() {
        const context = await super.getData();

        // Prepare powers for the Powers tab
        if (this.object.parent) {
            // Owned gadget - filter embedded items
            context.powers = this.object.parent.items.filter(
                i => i.type === 'power' && i.system.parent === this.object.id
            );
            context.skills = this.object.parent.items.filter(
                i => i.type === 'skill' && i.system.parent === this.object.id
            );
            context.advantages = this.object.parent.items.filter(
                i => i.type === 'advantage' && i.system.parent === this.object.id
            );
            context.drawbacks = this.object.parent.items.filter(
                i => i.type === 'drawback' && i.system.parent === this.object.id
            );
        } else {
            // Unowned gadget - create virtual items from flattened data
            context.powers = this._createVirtualPowersFromData(context);
            context.skills = this._createVirtualSkillsFromData(context);
            const traits = this._createVirtualTraitsFromData(context);
            context.advantages = traits.filter(t => t.type === 'advantage');
            context.drawbacks = traits.filter(t => t.type === 'drawback');
        }

        // Provide all items for helpers
        context.items = this.object.parent ?
            Array.from(this.object.parent.items) :
            [...context.powers, ...context.skills, ...context.advantages, ...context.drawbacks];

        // Ensure budget is calculated
        context.gadgetBudget = context.system.gadgetPointBudget || {
            base: 0,
            totalSpent: 0,
            remaining: 0
        };

        // Add reliability scores for settings dropdown
        context.reliabilityScores = CONFIG.reliabilityScores || [0, 2, 3, 5, 7, 9, 11];

        return context;
    }

    /** @override */
    activateListeners(html) {
        super.activateListeners(html);

        // Power/Skill isLinked checkbox
        html.on('change', 'input[data-field="isLinked"]', async (ev) => {
            ev.preventDefault();
            ev.stopPropagation();

            const itemId = $(ev.currentTarget).data('itemId');
            if (this.object.parent) {
                const item = this.object.parent.items.get(itemId);
                if (item) {
                    await item.update({ 'system.isLinked': ev.currentTarget.checked });
                }
            }
        });

        // Attribute plus/minus buttons
        html.on('click', '.attribute-plus', async (ev) => {
            ev.preventDefault();
            const attrKey = $(ev.currentTarget).data('attribute');
            const currentValue = this.object.system.attributes[attrKey]?.value || 0;
            await this.object.update({
                [`system.attributes.${attrKey}.value`]: currentValue + 1
            });
        });

        html.on('click', '.attribute-minus', async (ev) => {
            ev.preventDefault();
            const attrKey = $(ev.currentTarget).data('attribute');
            const currentValue = this.object.system.attributes[attrKey]?.value || 0;
            if (currentValue > 0) {
                await this.object.update({
                    [`system.attributes.${attrKey}.value`]: currentValue - 1
                });
            }
        });

        // AV/EV plus/minus buttons
        html.on('click', '.av-plus', async (ev) => {
            ev.preventDefault();
            const currentValue = this.object.system.actionValue || 0;
            await this.object.update({ 'system.actionValue': currentValue + 1 });
        });

        html.on('click', '.av-minus', async (ev) => {
            ev.preventDefault();
            const currentValue = this.object.system.actionValue || 0;
            if (currentValue > 0) {
                await this.object.update({ 'system.actionValue': currentValue - 1 });
            }
        });

        html.on('click', '.ev-plus', async (ev) => {
            ev.preventDefault();
            const currentValue = this.object.system.effectValue || 0;
            await this.object.update({ 'system.effectValue': currentValue + 1 });
        });

        html.on('click', '.ev-minus', async (ev) => {
            ev.preventDefault();
            const currentValue = this.object.system.effectValue || 0;
            if (currentValue > 0) {
                await this.object.update({ 'system.effectValue': currentValue - 1 });
            }
        });

        // Enable drag-and-drop for Bonuses/Limitations onto Powers
        this._enablePowerRowDropZones(html);
    }

    /**
     * Enable power rows as drop zones for modifiers
     */
    _enablePowerRowDropZones(html) {
        const powerRows = html.find('.tab.powers .item-row');

        powerRows.each((i, row) => {
            row.addEventListener('dragover', this._onDragOver.bind(this));
            row.addEventListener('drop', this._onDropOnPower.bind(this));
        });
    }

    _onDragOver(event) {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'copy';
    }

    async _onDropOnPower(event) {
        event.preventDefault();
        event.stopPropagation();

        const row = event.currentTarget;
        const powerId = row.dataset.itemId;
        if (!powerId) return;

        const data = TextEditor.getDragEventData(event);
        const droppedItem = await Item.implementation.fromDropData(data);
        if (!droppedItem) return;

        if (droppedItem.type !== 'bonus' && droppedItem.type !== 'limitation') {
            ui.notifications.warn('Only Bonuses and Limitations can be dropped onto Powers.');
            return;
        }

        const itemData = droppedItem.toObject();
        itemData.system.parent = powerId;

        if (this.object.parent) {
            // Owned gadget - create embedded item
            await this.object.parent.createEmbeddedDocuments('Item', [itemData]);
        } else {
            // Unowned gadget - not supported yet
            ui.notifications.warn('Modifiers can only be added to powers on gadgets owned by a character.');
        }

        this.render(false);
    }

    /**
     * Create virtual power items from flattened data for unowned gadgets
     */
    _createVirtualPowersFromData(context) {
        const powers = [];
        const powerAPs = context.system.powerAPs || {};
        const powerBaseCosts = context.system.powerBaseCosts || {};
        const powerFactorCosts = context.system.powerFactorCosts || {};
        const powerIsLinked = context.system.powerIsLinked || {};
        const powerLinks = context.system.powerLinks || {};

        for (const [powerName, aps] of Object.entries(powerAPs)) {
            const baseCost = powerBaseCosts[powerName] || 0;
            const factorCost = powerFactorCosts[powerName] || 0;
            const isLinked = powerIsLinked[powerName] || false;
            const link = powerLinks[powerName] || '';

            let effectiveFC = factorCost;
            if (isLinked === 'true' || isLinked === true) {
                effectiveFC = Math.max(1, effectiveFC - 2);
            }

            const apCost = MEGS.getAPCost(aps, effectiveFC) || 0;
            const totalCost = baseCost + apCost;

            powers.push({
                _id: `virtual-power-${powerName}`,
                name: powerName,
                type: 'power',
                isVirtual: true,
                system: {
                    aps: aps,
                    baseCost: baseCost,
                    factorCost: factorCost,
                    isLinked: isLinked,
                    link: link,
                    totalCost: totalCost
                }
            });
        }

        return powers;
    }

    /**
     * Create virtual skill items from flattened data for unowned gadgets
     */
    _createVirtualSkillsFromData(context) {
        const skills = [];
        const skillData = context.system.skillData || {};
        const skillBaseCosts = context.system.skillBaseCosts || {};
        const skillFactorCosts = context.system.skillFactorCosts || {};

        for (const [skillName, aps] of Object.entries(skillData)) {
            const baseCost = skillBaseCosts[skillName] || 0;
            const factorCost = skillFactorCosts[skillName] || 2; // Default to 2 if not set
            const apCost = MEGS.getAPCost(aps, factorCost) || 0;
            const totalCost = baseCost + apCost;

            skills.push({
                _id: `virtual-skill-${skillName}`,
                name: skillName,
                type: 'skill',
                isVirtual: true,
                system: {
                    aps: aps,
                    baseCost: baseCost,
                    factorCost: factorCost,
                    isLinked: false,
                    totalCost: totalCost
                }
            });
        }

        return skills;
    }

    /**
     * Create virtual trait items from traitData for unowned gadgets
     */
    _createVirtualTraitsFromData(context) {
        const traits = [];
        const traitData = context.system.traitData || {};

        for (const [key, trait] of Object.entries(traitData)) {
            traits.push({
                _id: `virtual-trait-${key}`,
                name: trait.name,
                type: trait.type,
                img: trait.img,
                isVirtual: true,
                system: {
                    baseCost: trait.system?.baseCost || 0,
                    totalCost: trait.system?.baseCost || 0,
                    text: trait.system?.text || ''
                }
            });
        }

        return traits;
    }
}
