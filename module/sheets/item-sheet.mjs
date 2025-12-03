import { MEGSActor } from '../documents/actor.mjs';
import { MEGSItem } from '../documents/item.mjs';
import { MEGS } from '../helpers/config.mjs';
import { MegsTableRolls, RollValues } from '../dice.mjs';
import { Utils } from '../utils.js';

/**
 * Extend the basic ItemSheet with some very simple modifications
 * @extends {ItemSheet}
 */
export class MEGSItemSheet extends ItemSheet {
    /** @override */
    constructor(object, options) {
        super(object, options);
        // default to uneditable if user is not owner or from a compendium
        if (this.object) {
            const isUnlocked = this.object.isOwner && !this.object._stats.compendiumSource;
            this.object.setFlag('megs', 'edit-mode', isUnlocked);
        }
    }

    /** @override */
    static get defaultOptions() {
        let newOptions = super.defaultOptions;
        newOptions.classes = ['megs', 'sheet', 'item'];
        newOptions.width = 585;
        newOptions.height = 480;
        newOptions.dragDrop = [
            { dragSelector: '.item-list .item', dropSelector: null },
            { dragSelector: '.d10.rollable', dropSelector: null },
        ];
        newOptions.tabs = [
            {
                navSelector: '.sheet-tabs',
                contentSelector: '.sheet-body',
                initial: 'characteristics',
            },
        ];
        return newOptions;
    }

    /** @override */
    get template() {
        const path = 'systems/megs/templates/item';
        return `${path}/item-${this.item.type}-sheet.hbs`;
    }

    /* -------------------------------------------- */

    /** @override */
    getData() {
        // Retrieve base data structure.
        const context = super.getData();

        // Use a safe clone of the item data for further operations.
        const itemData = context.data;

        context.rollData = this.item.getRollData();

        // Add the item's data to context.data for easier access, as well as flags.
        context.system = itemData.system;
        context.flags = itemData.flags;

        if (itemData.type === MEGS.itemTypes.power) {
            this._prepareModifiers(context);
        }

        if (itemData.type === MEGS.itemTypes.skill) {
            const actor = this.object.parent;

            // if has APs, those are effective
            if (this.object.system.aps > 0) {
                context.effectiveAPs = this.object.system.aps;
                context.isUnskilled = false;
            } else {
                // if no APs, use linked attribute value as effective and flag as unskilled
                context.isUnskilled = true;
                if (actor) {
                    context.effectiveAPs = actor.system.attributes[context.system.link].value;
                } else {
                    // no actor attached; should not display
                    context.effectiveAPs = 0;
                }
            }

            if (actor && context.system.isLinked === 'true') {
                context.minAPs = actor.system.attributes[context.system.link].value;
                context.maxAPs = actor.system.attributes[context.system.link].value;
            } else {
                context.minAPs = '0';
                context.maxAPs = 999;
            }

            this._prepareSubskills(context);
        }

        if (itemData.type === MEGS.itemTypes.subskill) {
            context.skillHasRanks = false;

            // if has APs, those are effective
            if (this.object.system.aps > 0) {
                context.effectiveAPs = this.object.system.aps;
                context.isUnskilled = false;
            } else {
                // check parent for APs
                const actor = game.actors.get(context.document.system.actorId);
                if (actor) {
                    var skill = actor.items.filter((obj) => {
                        return obj._id === context.document.system.parent;
                    })[0];
                    if (skill.system.aps > 0) {
                        context.effectiveAPs = skill.system.aps;
                        context.isUnskilled = false;
                        context.skillHasRanks = true;
                    } else {
                        // if no APs for parent, fall back to linked skill
                        context.effectiveAPs = actor.system.attributes[skill.system.link].value;
                        context.isUnskilled = true;
                    }
                } else {
                    context.effectiveAPs = 0;
                }
            }

            context.minAPs = 0;
            context.maxAPs = 999;
        }

        if (itemData.type === MEGS.itemTypes.gadget) {
            context.items = itemData.system.items;
            this._prepareGadgetData(context);
        }

        // store all skills for dropdown on subskill page
        if (itemData.type === MEGS.itemTypes.subskill) {
            let allSkills = {};
            for (let i of game.items) {
                if (i.type === MEGS.itemTypes.skill) {
                    allSkills[i.name] = i;
                }
            }
            context.allSkills = allSkills;
        }

        context.isRollable = this._isRollable(itemData);

        context.hasActor = this.object.parent ? true : false;

        // if has actor parent, store powers that actor has; otherwise, store all powers
        if (itemData.type === MEGS.itemTypes.bonus || itemData.type === MEGS.itemTypes.limitation) {
            if (context.hasActor) {
                let powers = [];
                const actor = this.object.parent;
                for (let i of actor.items) {
                    if (i.type === MEGS.itemTypes.power) {
                        powers.push(i);
                    }
                }
                context.powers = powers;
            }
        }

        context.showHeroPointCosts = game.settings.get('megs', 'showHeroPointCosts');

        return context;
    }

    /**
     * Can this be rolled?
     * @param {*} itemData
     * @returns
     */
    _isRollable(itemData) {
        // not rollable if it doesn't have an actor parent
        if (!this.item.parent) return false;

        // even auto powers can sometimes be dice actions
        if (itemData.type === MEGS.itemTypes.power) return true;

        // only skills with dice or both types are rollable
        if (itemData.type === MEGS.itemTypes.skill) {
            const isDice = itemData.system.type === MEGS.powerTypes.dice.toLowerCase();
            const isBoth = itemData.system.type === MEGS.powerTypes.both.toLowerCase();
            return isDice || isBoth;
        }

        // only subskills with dice or both types for parent skill + rollable are rollable
        if (itemData.type === MEGS.itemTypes.subskill) {
            const actor = game.actors.get(itemData.system.actorId);
            var skill = actor.items.filter((obj) => {
                return obj._id === itemData.system.parent;
            })[0];

            const isDice = skill.system.type === MEGS.powerTypes.dice.toLowerCase();
            const isBoth = skill.system.type === MEGS.powerTypes.both.toLowerCase();
            const isRollable =
                itemData.system.aps > 0 || // if subskill has APs
                skill.system.aps > 0 || // or skill has APs
                itemData.system.useUnskilled === 'true'; // or subskill can be rolled unskilled

            return (isDice || isBoth) && isRollable;
        }

        return false;
    }

    /* -------------------------------------------- */

    /** @override */
    activateListeners(html) {
        super.activateListeners(html);

        // Everything below here is only needed if the sheet is editable
        if (!this.isEditable) return;

        // Handle hideZeroAPSkills checkbox change - re-render to update filtered skills
        html.on('change', 'input[name="system.settings.hideZeroAPSkills"]', async (ev) => {
            ev.preventDefault();
            const checkbox = ev.currentTarget;
            const value = checkbox.checked ? 'true' : 'false';
            await this.object.update({ 'system.settings.hideZeroAPSkills': value });
            this.render(false);
        });

        // Skill APs increment/decrement
        html.on('click', '.ap-plus', async (ev) => {
            ev.preventDefault();
            const button = ev.currentTarget;
            const isVirtual = button.dataset.isVirtual === 'true';
            const skillName = button.dataset.skillName;
            const itemId = button.dataset.itemId;

            if (isVirtual) {
                // Update virtual skill in skillData or subskillData
                const skillData = foundry.utils.duplicate(this.object.system.skillData || {});
                const subskillData = foundry.utils.duplicate(this.object.system.subskillData || {});

                if (skillData.hasOwnProperty(skillName)) {
                    skillData[skillName] = (skillData[skillName] || 0) + 1;
                    await this.object.update({ 'system.skillData': skillData });
                } else if (subskillData.hasOwnProperty(skillName)) {
                    subskillData[skillName] = (subskillData[skillName] || 0) + 1;
                    await this.object.update({ 'system.subskillData': subskillData });
                }
                this.render(false);
            } else {
                // Update real skill item
                const item = this.object.parent.items.get(itemId);
                if (item && (item.type === 'skill' || item.type === 'subskill')) {
                    const newValue = (item.system.aps || 0) + 1;
                    await item.update({ 'system.aps': newValue });
                    this.render(false);
                }
            }
        });

        html.on('click', '.ap-minus', async (ev) => {
            ev.preventDefault();
            const button = ev.currentTarget;
            const isVirtual = button.dataset.isVirtual === 'true';
            const skillName = button.dataset.skillName;
            const itemId = button.dataset.itemId;

            if (isVirtual) {
                // Update virtual skill in skillData or subskillData
                const skillData = foundry.utils.duplicate(this.object.system.skillData || {});
                const subskillData = foundry.utils.duplicate(this.object.system.subskillData || {});

                if (skillData.hasOwnProperty(skillName) && (skillData[skillName] || 0) > 0) {
                    skillData[skillName] = (skillData[skillName] || 0) - 1;
                    await this.object.update({ 'system.skillData': skillData });
                    this.render(false);
                } else if (subskillData.hasOwnProperty(skillName) && (subskillData[skillName] || 0) > 0) {
                    subskillData[skillName] = (subskillData[skillName] || 0) - 1;
                    await this.object.update({ 'system.subskillData': subskillData });
                    this.render(false);
                }
            } else {
                // Update real skill item
                const item = this.object.parent.items.get(itemId);
                if (
                    item &&
                    (item.type === 'skill' || item.type === 'subskill') &&
                    (item.system.aps || 0) > 0
                ) {
                    const newValue = (item.system.aps || 0) - 1;
                    await item.update({ 'system.aps': newValue });
                    this.render(false);
                }
            }
        });

        // Render the item sheet for viewing/editing prior to the editable check.
        html.on('click', '.item-edit', (ev) => {
            const li = $(ev.currentTarget).parents('.item');
            let item;
            if (this.object.parent) {
                item = this.object.parent.items.get(li.data('itemId'));
            } else {
                item = game.items.get(li.data('itemId'));
            }
            item.apps[this.appId] = this;
            item.sheet.render(true);
        });

        // Add Sub-Item
        html.on('click', '.item-create', this._onSubItemCreate.bind(this));

        // Delete Sub-Item

        html.on('click', '.item-delete', (ev) => {
            const li = $(ev.currentTarget).parents('.item');
            li.length = 1; // make sure only returns this line
            const item = this.object.parent.items.get(li.data('itemId'));
            item.delete();
            li.slideUp(200, () => this.render(false));
        });

        // MEGS roll
        html.on('click', '.d10.rollable', (event) => {
            // TODO defer roll to item object

            const element = event.currentTarget;
            const dataset = element.dataset;

            let actionValue = 0;
            let effectValue = 0;
            let opposingValue = 0;
            let resistanceValue = 0;

            let targetActor = MegsTableRolls.getTargetActor();

            if (this.object.type === MEGS.itemTypes.power) {
                // for powers, AV and EV are typically APs of power
                actionValue = parseInt(dataset.value);
                effectValue = parseInt(dataset.value);

                // TODO physical powers should have AV of DEX, mental INT, mystical INFL - optional rule

                // Physical powers - OV and RV are DEX and BODY
                if (this.object.system.source === MEGS.powerSources.physical.toLowerCase()) {
                    dataset.key = MEGS.attributeAbbreviations.str;
                }
                // Mental powers - OV and RV are INT and MIND
                if (this.object.system.source === MEGS.powerSources.mental.toLowerCase()) {
                    dataset.key = MEGS.attributeAbbreviations.int;
                }
                // Mystical powers - OV and RV are INFL and SPIRIT
                if (this.object.system.source === MEGS.powerSources.mystical.toLowerCase()) {
                    dataset.key = MEGS.attributeAbbreviations.infl;
                }
                if (targetActor) {
                    opposingValue = Utils.getOpposingValue(dataset.key, targetActor);
                    resistanceValue = Utils.getResistanceValue(dataset.key, targetActor);
                }
            }

            dataset.type = this.object.type;

            // values of skills and subskills
            if (
                this.object.type === MEGS.itemTypes.skill ||
                this.object.type === MEGS.itemTypes.subskill
            ) {
                actionValue = parseInt(dataset.value);
                effectValue = parseInt(dataset.value);
            }

            let label = dataset.label;
            if (this.object.parent && this.object.parent.name) {
                label = this.object.parent.name + ' - ' + label;
            }

            const rollValues = new RollValues(
                label,
                dataset.type,
                dataset.value,
                actionValue,
                opposingValue,
                effectValue,
                resistanceValue,
                dataset.roll,
                dataset.unskilled
            );
            console.info('Rolling from item-sheet click');
            const rollTables = new MegsTableRolls(rollValues);
            rollTables
                .roll(event, this.object.parent.system.heroPoints.value)
                .then((response) => {});
        });

        if (this.object.parent && this.object.parent.isOwner) {
            let handler = (ev) => this._onDragStart(ev);
            html.find('li.item').each((i, li) => {
                if (li.classList.contains('inventory-header')) return;
                li.setAttribute('draggable', true);
                li.addEventListener('dragstart', handler, false);
            });
            html.find('div.d10.rollable').each((i, div) => {
                div.setAttribute('draggable', true);
                div.addEventListener('dragstart', handler, false);
            });
        }
    }

    /**
     * Set up bonuses and limitations to be shown on power tab
     * @param {*} context
     */
    _prepareModifiers(context) {
        // only powers can have modifiers
        if (this.object.type !== MEGS.itemTypes.power) return;

        // Initialize containers.
        const bonuses = [];
        const limitations = [];

        if (this.object.parent && this.object.parent.items) {
            // Iterate through items, allocating to containers
            for (let i of this.object.parent.items) {
                // if modifier belongs to this power
                if (i.system.parent === this.item._id) {
                    i.img = i.img || Item.DEFAULT_ICON;
                    if (i.type === MEGS.itemTypes.bonus) {
                        bonuses.push(i);
                        // Link parent power's item sheet to sub-item object so it updates on any changes
                        i.apps[this.appId] = this;
                    }
                    if (i.type === MEGS.itemTypes.limitation) {
                        limitations.push(i);

                        // Link parent power's item sheet to sub-item object so it updates on any changes
                        i.apps[this.appId] = this;
                    }
                }
            }

            // Assign and return
            context.bonuses = bonuses;
            context.limitations = limitations;
        }
    }

    /**
     *
     * @param {*} context
     */
    _prepareSubskills(context) {
        if (context.item.type === MEGS.itemTypes.skill) {
            let subskills = [];

            if (this.object.parent) {
                for (let i of this.object.parent.items) {
                    if (i.type === MEGS.itemTypes.subskill) {
                        if (i.system.parent === context.item._id) {
                            // TODO parent ID
                            // if subskill has APs
                            // or skill has APs
                            // or subskill can be rolled unskilled
                            if (
                                i.system.aps > 0 ||
                                context.item.system.aps > 0 ||
                                i.system.useUnskilled === 'true'
                            ) {
                                i.isRollable = true;
                                if (i.system.aps === 0 && context.item.system.aps === 0) {
                                    // unskilled
                                    i.isUnskilled = true;
                                    const actor = context.document.parent;
                                    i.effectiveAPs =
                                        actor.system.attributes[context.item.system.link].value;
                                } else {
                                    i.isUnskilled = false;
                                    i.effectiveAPs = Math.max(
                                        i.system.aps,
                                        context.item.system.aps
                                    );
                                }
                            } else {
                                i.isUnskilled = false;
                                i.isRollable = false;
                                i.effectiveAPs = 0;
                            }
                            subskills.push(i);
                        }
                    }
                }
            } else {
                subskills = game.items.filter((obj) => {
                    return (
                        obj.type === MEGS.itemTypes.subskill &&
                        obj.system.linkedSkill === context.document.name
                    );
                });
            }

            subskills.sort(function (a, b) {
                return a.name.localeCompare(b.name);
            });

            context.subskills = subskills;
        }
    }

    /**
     * Create virtual skill/subskill items from stored skillData for standalone gadgets
     * @param {*} context
     * @returns {Array}
     */
    _createVirtualSkillsFromData(context) {
        const virtualItems = [];
        const skillData = context.system.skillData || {};
        const subskillData = context.system.subskillData || {};

        // Create virtual skill items
        for (let [skillName, aps] of Object.entries(skillData)) {
            const virtualSkill = {
                _id: `virtual-skill-${skillName}`,
                name: skillName,
                type: MEGS.itemTypes.skill,
                img: 'systems/megs/assets/images/icons/skillls/skill.png',
                system: {
                    aps: aps,
                    parent: '',
                    link: 'dex',
                    type: 'both'
                },
                isVirtual: true
            };
            virtualItems.push(virtualSkill);
        }

        // Create virtual subskill items
        for (let [subskillName, aps] of Object.entries(subskillData)) {
            const virtualSubskill = {
                _id: `virtual-subskill-${subskillName}`,
                name: subskillName,
                type: MEGS.itemTypes.subskill,
                img: 'systems/megs/assets/images/icons/skillls/skill.png',
                system: {
                    aps: aps,
                    parent: `virtual-skill-parent`,
                    linkedSkill: '',
                    useUnskilled: 'false'
                },
                isVirtual: true
            };
            virtualItems.push(virtualSubskill);
        }

        return virtualItems;
    }

    /**
     *
     * @param {*} context
     */
    _prepareGadgetData(context) {
        // Handle attribute scores.
        for (let [k, v] of Object.entries(context.system.attributes)) {
            v.label = game.i18n.localize(CONFIG.MEGS.attributes[k]) ?? k;
        }

        // set reliability numbers
        context.reliabilityScores = CONFIG.reliabilityScores;

        // Initialize containers.
        const powers = [];
        const skills = [];
        const advantages = [];
        const drawbacks = [];
        const subskills = [];
        const gadgets = [];

        let items = [];
        let isStandalone = !context.document.parent;

        if (context.document.parent) {
            // Gadget owned by actor - get actual items from the actor
            items = context.document.parent.items.contents;
        } else if (context.system.skillData) {
            // Standalone gadget - create virtual skill/subskill items from stored data
            items = this._createVirtualSkillsFromData(context);
        }

        // First pass: collect items that belong to this gadget
        for (let i of items) {
            if (isStandalone || i.system.parent === this.document._id) {
                i.img = i.img || Item.DEFAULT_ICON;

                // Append to powers
                if (i.type === MEGS.itemTypes.power) {
                    powers.push(i);
                }
                // Append to skills
                else if (i.type === MEGS.itemTypes.skill) {
                    i.subskills = [];
                    if (i.system.aps === 0) {
                        i.unskilled = true;
                        i.linkedAPs = this.object.system.attributes[i.system.link].value;
                    } else {
                        i.unskilled = false;
                    }
                    skills.push(i);
                }
                // Append to advantages
                else if (i.type === MEGS.itemTypes.advantage) {
                    advantages.push(i);
                }
                // Append to drawbacks
                else if (i.type === MEGS.itemTypes.drawback) {
                    drawbacks.push(i);
                }
                // Append to gadgets
                else if (i.type === MEGS.itemTypes.gadget) {
                    gadgets.push(i);
                }
            }
        }

        // Second pass: collect subskills whose parent is one of the gadget's skills
        const skillIds = skills.map(s => s._id);
        for (let i of items) {
            if (i.type === MEGS.itemTypes.subskill && skillIds.includes(i.system.parent)) {
                i.skill = context.item;
                subskills.push(i);
            }
        }

        // sort alphabetically
        const arrays = [powers, skills, advantages, drawbacks, subskills, gadgets];
        arrays.forEach((element) => {
            element.sort(function (a, b) {
                let textA = a.name.toUpperCase();
                let textB = b.name.toUpperCase();
                return textA < textB ? -1 : textA > textB ? 1 : 0;
            });
        });

        subskills.forEach((element) => {
            const result = skills.find(({ _id }) => _id === element.system.parent);
            if (result) {
                result.subskills.push(element);
            }
        });

        // Filter skills based on hideZeroAPSkills setting (same as actor sheet)
        context.filteredSkills = [];
        if (context.system.settings?.hideZeroAPSkills !== 'true') {
            context.filteredSkills = skills;
        } else {
            skills.forEach((skill) => {
                if (skill.system.aps > 0 || this._doSubskillsHaveAPs(skill)) {
                    context.filteredSkills.push(skill);
                }
            });
        }

        // Assign and return
        context.powers = powers;
        context.skills = skills;
        context.advantages = advantages;
        context.drawbacks = drawbacks;
        context.subskills = subskills;
        context.gadgets = gadgets;
    }

    /**
     * Check if any subskills have APs > 0
     * @param {*} skill
     * @returns {boolean}
     */
    _doSubskillsHaveAPs(skill) {
        let doSubskillsHaveAPs = false;
        if (skill.subskills && skill.subskills.length > 0) {
            skill.subskills.forEach((subskill) => {
                if (subskill.system.aps > 0) {
                    doSubskillsHaveAPs = true;
                }
            });
        }
        return doSubskillsHaveAPs;
    }

    /**
     * Handle creating a new Owned Item for the actor using initial data defined in the HTML dataset
     * @param {Event} event   The originating click event
     * @private
     */
    async _onSubItemCreate(event) {
        event.preventDefault();
        const header = event.currentTarget;
        // Get the type of item to create.
        const type = header.dataset.type;
        // Grab any data associated with this control.
        const data = duplicate(header.dataset);
        // Initialize a default name.
        const name = `New ${type.capitalize()}`;
        // Prepare the item object.
        const itemData = {
            name: name,
            type: type,
            system: data,
        };

        // Remove the type from the dataset since it's in the itemData.type prop.
        delete itemData.system['type'];

        // Finally, create the item!
        let subItem;
        if (this.object.parent && this.object.parent instanceof MEGSActor) {
            itemData.system.parent = this.object._id;
            subItem = await MEGSItem.create(itemData, { parent: this.object.parent });
        } else {
            subItem = await MEGSItem.create(itemData, {});
        }
        subItem.apps[this.appId] = this;
        this.render(true);
        return subItem;
    }

    /* -------------------------------------------- */
    /*  Drag and Drop                               */
    /* -------------------------------------------- */

    _canDragStart(selector) {
        return this.isEditable;
    }

    /* -------------------------------------------- */

    _canDragDrop(selector) {
        return this.isEditable;
    }

    /* -------------------------------------------- */

    /** @inheritdoc */
    _onDragStart(event) {
        const li = event.currentTarget;

        if (event.target.classList.contains('content-link')) return;

        // Create drag data
        let dragData;

        // Owned Items
        if (li.dataset.itemId) {
            const item = this.object.parent.items.get(li.dataset.itemId);
            dragData = item.toDragData();
        }

        // Active Effect TODO
        if (li.dataset.effectId) {
            const effect = this.object.parent.effects.get(li.dataset.effectId);
            dragData = effect.toDragData();
        }

        if (!dragData) return;

        // Set data transfer
        event.dataTransfer.setData('text/plain', JSON.stringify(dragData));
    }

    /* -------------------------------------------- */

    async _onDrop(event) {
        const data = TextEditor.getDragEventData(event);
        const actor = this.object.parent;
        const allowed = Hooks.call('dropActorSheetData', actor, this, data);
        const isDroppable = this.object.type === MEGS.itemTypes.power;
        const item = await Item.implementation.fromDropData(data);
        const isSubItem =
            item.type === MEGS.itemTypes.bonus ||
            item.type === MEGS.itemTypes.limitation ||
            item.type === MEGS.itemTypes.subskill;

        const sheetTypeSkill = this.object.type === MEGS.itemTypes.skill;
        if (sheetTypeSkill && item.type === MEGS.itemTypes.subskill) {
            return this._onDropItem(event, data);
        }

        const sheetTypeGadget = this.object.type === MEGS.itemTypes.gadget;

        // Gadgets can accept powers, skills, advantages, drawbacks, bonuses, limitations
        const isGadgetSubItem =
            item.type === MEGS.itemTypes.power ||
            item.type === MEGS.itemTypes.skill ||
            item.type === MEGS.itemTypes.advantage ||
            item.type === MEGS.itemTypes.drawback ||
            item.type === MEGS.itemTypes.bonus ||
            item.type === MEGS.itemTypes.limitation;

        if (sheetTypeGadget && isGadgetSubItem) {
            return this._onDropItem(event, data);
        }

        if ((!allowed || !isDroppable || !isSubItem) && !sheetTypeGadget) return;

        // Handle different data types
        // TODO remove this?
        switch (data.type) {
            // case "ActiveEffect":
            //   return this._onDropActiveEffect(event, data);
            case 'Item':
                return this._onDropItem(event, data);
        }
    }

    /* -------------------------------------------- */

    /**
     * Handle the dropping of ActiveEffect data onto an Actor Sheet
     * @param {DragEvent} event                  The concluding DragEvent which contains drop data
     * @param {object} data                      The data transfer extracted from the event
     * @returns {Promise<ActiveEffect|boolean>}  The created ActiveEffect object or false if it couldn't be created.
     * @protected
     */
    async _onDropActiveEffect(event, data) {
        const effect = await ActiveEffect.implementation.fromDropData(data);
        if (!this.object.parent.isOwner || !effect) return false;
        if (this.object.parent.uuid === effect.parent?.uuid) return false;
        return ActiveEffect.create(effect.toObject(), { parent: this.object.parent });
    }

    /* -------------------------------------------- */

    /**
     * Handle dropping of an item reference or item data onto an Item Sheet
     * @param {DragEvent} event            The concluding DragEvent which contains drop data
     * @param {object} data                The data transfer extracted from the event
     * @returns {Promise<Item[]|boolean>}  The created or updated Item instances, or false if the drop was not permitted.
     * @protected
     */
    async _onDropItem(event, data) {
        if (!this.object.parent || !this.object.parent.isOwner) return false;
        const item = await Item.implementation.fromDropData(data);
        const itemData = item.toObject();

        // Handle item sorting within the same Actor
        if (this.object.parent.uuid === item.parent?.uuid) return this._onSortItem(event, itemData);

        // Create the owned item
        return this._onDropItemCreate(itemData);
    }

    /* -------------------------------------------- */

    /**
     * Handle the final creation of dropped Item data on the Actor.
     * This method is factored out to allow downstream classes the opportunity to override item creation behavior.
     * @param {object[]|object} itemData     The item data requested for creation
     * @returns {Promise<Item[]>}
     * @private
     */
    async _onDropItemCreate(itemData) {
        // TODO change system.parent to parentId
        itemData.system.parent = this.object._id; // link subitem to item
        itemData = itemData instanceof Array ? itemData : [itemData];
        const item = await this.object.parent.createEmbeddedDocuments('Item', itemData);
        this.render(true);
        return item;
    }

    /* -------------------------------------------- */

    /**
     * Handle a drop event for an existing embedded Item to sort that Item relative to its siblings
     * @param {Event} event
     * @param {Object} itemData
     * @private
     */
    _onSortItem(event, itemData) {
        // Get the drag source and drop target
        const items = this.object.parent.items;
        const source = items.get(itemData._id);
        const dropTarget = event.target.closest('[data-item-id]');
        if (!dropTarget) return;
        const target = items.get(dropTarget.dataset.itemId);

        // Don't sort on yourself
        if (source.id === target.id) return;

        // Identify sibling items based on adjacent HTML elements
        const siblings = [];
        for (let el of dropTarget.parentElement.children) {
            const siblingId = el.dataset.itemId;
            if (siblingId && siblingId !== source.id) siblings.push(items.get(el.dataset.itemId));
        }

        // Perform the sort
        const sortUpdates = SortingHelpers.performIntegerSort(source, { target, siblings });
        const updateData = sortUpdates.map((u) => {
            const update = u.update;
            update._id = u.target._id;
            return update;
        });

        // Perform the update
        return this.object.parent.updateEmbeddedDocuments('Item', updateData);
    }

    /** @override **/
    _getHeaderButtons() {
        if (this.object.isOwner) {
            return [
                {
                    class: 'megs-toggle-edit-mode',
                    label: game.i18n.localize('MEGS.Edit') ?? 'Edit',
                    icon: 'fas fa-edit',
                    onclick: (e) => {
                        this._toggleEditMode(e);
                    },
                },
                ...super._getHeaderButtons(),
            ];
        }
        return super._getHeaderButtons();
    }

    _toggleEditMode(_e) {
        const currentValue = this.object.getFlag('megs', 'edit-mode');
        this.object.setFlag('megs', 'edit-mode', !currentValue);
        this.render(false);
    }
}
