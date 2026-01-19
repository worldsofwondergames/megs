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

        // Prepare items for tabs
        if (this.object.parent) {
            // Owned gadget - filter embedded items in a single pass
            const itemsByType = { powers: [], skills: [], advantages: [], drawbacks: [] };
            for (const item of this.object.parent.items) {
                if (item.system.parent === this.object.id) {
                    if (item.type === 'power') itemsByType.powers.push(item);
                    else if (item.type === 'skill') itemsByType.skills.push(item);
                    else if (item.type === 'advantage') itemsByType.advantages.push(item);
                    else if (item.type === 'drawback') itemsByType.drawbacks.push(item);
                }
            }
            context.powers = itemsByType.powers;
            context.skills = itemsByType.skills;
            context.advantages = itemsByType.advantages;
            context.drawbacks = itemsByType.drawbacks;
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

        // Attribute group toggle checkboxes (both Attributes tab and Settings tab)
        html.on('change', '.attribute-group-toggle, .settings-attribute-group-toggle', async (ev) => {
            ev.preventDefault();
            const group = $(ev.currentTarget).data('group');
            const isEnabled = ev.currentTarget.checked;

            const updateData = {
                [`system.settings.hasAttributes.${group}`]: isEnabled ? 'true' : 'false'
            };

            // If disabling, reset all attributes in this group to 0
            if (!isEnabled) {
                const groupAttributes = {
                    physical: ['dex', 'str', 'body'],
                    mental: ['int', 'will', 'mind'],
                    mystical: ['infl', 'aura', 'spirit']
                };

                for (const attr of groupAttributes[group] || []) {
                    updateData[`system.attributes.${attr}.value`] = 0;
                }
            }

            await this.object.update(updateData);
        });

        // Attribute plus/minus buttons
        html.on('click', '.attribute-plus, .attribute-minus', async (ev) => {
            ev.preventDefault();
            const button = ev.currentTarget;
            if (button.disabled) return;

            const attrKey = $(button).data('attribute');
            const currentValue = this.object.system.attributes[attrKey]?.value || 0;
            const isIncrement = button.classList.contains('attribute-plus');

            if (isIncrement && currentValue < 60) {
                await this.object.update({ [`system.attributes.${attrKey}.value`]: currentValue + 1 });
            } else if (!isIncrement && currentValue > 0) {
                await this.object.update({ [`system.attributes.${attrKey}.value`]: currentValue - 1 });
            }
        });

        // AV/EV toggle checkbox (both Attributes tab and Settings tab)
        html.on('change', '.avev-toggle, .settings-avev-toggle', async (ev) => {
            ev.preventDefault();
            const isEnabled = ev.currentTarget.checked;

            const updateData = {
                'system.settings.hasAVAndEV': isEnabled ? 'true' : 'false'
            };

            // If disabling, reset AV and EV to 0
            if (!isEnabled) {
                updateData['system.actionValue'] = 0;
                updateData['system.effectValue'] = 0;
            }

            await this.object.update(updateData);
        });

        // AV/EV plus/minus buttons
        html.on('click', '.av-plus, .av-minus, .ev-plus, .ev-minus', async (ev) => {
            ev.preventDefault();
            const button = ev.currentTarget;
            if (button.disabled) return;

            const isAV = button.classList.contains('av-plus') || button.classList.contains('av-minus');
            const isIncrement = button.classList.contains('av-plus') || button.classList.contains('ev-plus');
            const field = isAV ? 'actionValue' : 'effectValue';
            const currentValue = this.object.system[field] || 0;

            if (isIncrement && currentValue < 60) {
                await this.object.update({ [`system.${field}`]: currentValue + 1 });
            } else if (!isIncrement && currentValue > 0) {
                await this.object.update({ [`system.${field}`]: currentValue - 1 });
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

    /**
     * Handle dragover event for power rows
     * @param {DragEvent} event - The dragover event
     */
    _onDragOver(event) {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'copy';
    }

    /**
     * Handle drop event for bonuses/limitations onto power rows
     * @param {DragEvent} event - The drop event
     */
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
            ui.notifications.warn(game.i18n.localize('MEGS.OnlyBonusesAndLimitationsCanBeDropped'));
            return;
        }

        const itemData = droppedItem.toObject();
        itemData.system.parent = powerId;

        if (this.object.parent) {
            // Owned gadget - create embedded item
            await this.object.parent.createEmbeddedDocuments('Item', [itemData]);
        } else {
            // Unowned gadget - not supported yet
            ui.notifications.warn(game.i18n.localize('MEGS.ModifiersOnlyForOwnedGadgets'));
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
