import { MEGS } from '../helpers/config.mjs';
import { prepareActiveEffectCategories } from '../helpers/effects.mjs';
import { MegsTableRolls, RollValues } from '../dice.mjs';
import { Utils } from '../utils.js';

/**
 * Extend the basic ActorSheet with some very simple modifications
 * @extends {ActorSheet}
 */
export class MEGSActorSheet extends ActorSheet {
    /** @override */
    constructor(object, options) {
        super(object, options);
        if (this.actor) {
            const isUnlocked = this.actor.isOwner && !this.actor._stats.compendiumSource;
            this.actor.setFlag('megs', 'edit-mode', isUnlocked);
        }
    }

    /** @override */
    static get defaultOptions() {
        let newOptions = super.defaultOptions;
        newOptions.classes = ['megs', 'sheet', 'actor'];
        newOptions.width = 600;
        newOptions.height = 600;
        newOptions.dragDrop = [{ dragSelector: '.item-list .item', dropSelector: null }];
        newOptions.tabs = [
            {
                navSelector: '.sheet-tabs',
                contentSelector: '.sheet-body',
                initial: 'abilities',
            },
        ];
        return newOptions;
    }

    /** @override */
    get template() {
        return `systems/megs/templates/actor/actor-${this.actor.type}-sheet.hbs`;
    }

    /* -------------------------------------------- */

    /** @override */
    getData() {
        // Retrieve the data structure from the base sheet. You can inspect or log
        // the context variable to see the structure, but some key properties for
        // sheets are the actor object, the data object, whether or not it's
        // editable, the items array, and the effects array.
        const context = super.getData();

        // Use a safe clone of the actor data for further operations.
        const actorData = context.data;

        // Add the actor's data to context.data for easier access, as well as flags.
        context.system = actorData.system;
        context.flags = actorData.flags;

        // Prepare character data and items for hero, villain, and npc types.
        if (actorData.type === MEGS.characterTypes.hero ||
            actorData.type === MEGS.characterTypes.villain ||
            actorData.type === MEGS.characterTypes.npc) {
            this._prepareItems(context);
            this._prepareCharacterData(context);
            this._prepareInitiative(context);
        }

        if (
            actorData.type === MEGS.characterTypes.vehicle ||
            actorData.type === MEGS.characterTypes.location
        ) {
            this._prepareItems(context);
            this._prepareCharacterData(context);

            // get list of potential actors to own
            context.characters = [];
            game.actors.forEach((element) => {
                if (
                    element.type !== MEGS.characterTypes.vehicle &&
                    element.type !== MEGS.characterTypes.location
                ) {
                    context.characters[element._id] = element.name;
                }
            });
            context.characters = this._sortArray(context.characters);

            this._populateLinkedGadgets(context, 'locations');
            this._populateLinkedGadgets(context, 'vehicles');
        }

        // Add roll data for TinyMCE editors.
        // TODO does this do anything in current model?
        context.rollData = context.actor.getRollData();

        // TODO Prepare active effects
        // context.effects = prepareActiveEffectCategories(
        //     // A generator that returns all effects stored on the actor
        //     // as well as any items
        //     this.actor.allApplicableEffects()
        // );

        // Filter skills
        context.filteredSkills = [];
        if (context.skills) {
            if (context.system.settings.hideZeroAPSkills !== 'true') {
                context.filteredSkills = context.skills;
            } else {
                context.skills.forEach((skill) => {
                    if (skill.system.aps > 0) {
                        context.filteredSkills.push(skill);
                    }
                });
            }
        }

        context.showHeroPointCosts = game.settings.get('megs', 'showHeroPointCosts');
        context.allowSkillDeletion = game.settings.get('megs', 'allowSkillDeletion');

        return context;
    }

    _getGadgetsForActor(owner, gadgetType) {
        const gadgetArray = [];
        if (owner) {
            if (owner.items) {
                owner.items.forEach((element) => {
                    if (element.type === MEGS.itemTypes.gadget) {
                        if (gadgetType) {
                            if (
                                gadgetType === MEGS.characterTypes.vehicle &&
                                element.system.vehicle?.isVehicle
                            ) {
                                gadgetArray[element._id] = element.name;
                            }
                            // if (gadgetType === MEGS.characterTypes.location && element.system.location?.isLocation) {
                            //   gadgetArray[element._id] = element.name;
                            // }
                        } else {
                            gadgetArray[element._id] = element.name;
                        }
                    }
                });
            }
        }
        return gadgetArray;
    }

    /**
     * Populate linked gadgets list for vehicles and locations
     * @param {Object} context The context object
     * @param {string} propertyName The property name to populate ('locations' or 'vehicles')
     * @private
     */
    _populateLinkedGadgets(context, propertyName) {
        context[propertyName] = [];
        if (context.system.ownerId) {
            const owner = game.actors.get(context.system.ownerId);
            if (owner && owner.items) {
                context.system.linkedItem = undefined;

                owner.items.forEach((element) => {
                    if (element.type === MEGS.itemTypes.gadget) {
                        // store linked vehicle item
                        if (element._id === context.system.linkedItemId) {
                            context.system.linkedItem = element;
                        }

                        // add to list for header
                        context[propertyName][element.name] = element._id;
                    }
                });
                context[propertyName] = this._sortArray(context[propertyName]);
            }
        }
    }

    /**
     *
     * @param {*} array
     * @returns
     */
    _sortArray(array) {
        const sortedKeys = Object.keys(array).sort((a, b) => {
            const nameA = array[a].toUpperCase();
            const nameB = array[b].toUpperCase();
            return nameA.localeCompare(nameB);
        });
        return sortedKeys.reduce((acc, key) => {
            acc[key] = array[key];
            return acc;
        }, {});
    }

    /**
     * Organize and classify Items for Character sheets.
     *
     * @param {Object} context The actor to prepare.
     *
     * @return {undefined}
     * @private
     */
    _prepareCharacterData(context) {
        // Handle attribute scores.
        for (let [k, v] of Object.entries(context.system.attributes)) {
            v.label = game.i18n.localize(CONFIG.MEGS.attributes[k]) ?? k;
        }

        // The exception is player characters and sheets that have "link actor data" enabled (PCs do by default).
        // For these actors there's a single actor sheet shared by all copies of the actor.
    }

    _prepareInitiative(context) {
        // TODO If two Characters' Initiative totals are tied, a hero always takes precedence over a villain or minor Character.
        const initiativeBonus = this._calculateInitiativeBonus(context);

        // set value on actor sheet object
        // TODO do we need both of these now?
        context.system.initiativeBonus.value = initiativeBonus; // works for sheet display
        context.actor.system.initiativeBonus.value = initiativeBonus; // already changes
    }

    /**
     *
     * @param {*} context
     * @returns number
     * @private
     */
    // TODO do we need this? On the actor item
    _calculateInitiativeBonus(context) {
        // TODO replace this with active effects

        // calculate initiativeBonus
        let initiativeBonus =
            context.document.system.attributes.dex.value +
            context.document.system.attributes.int.value +
            context.document.system.attributes.infl.value;

        // Superspeed adds APs of their power
        if (this._hasAbility(context.powers, MEGS.powers.SUPERSPEED)) {
            const aps = this._getAbilityAPs(context.powers, MEGS.powers.SUPERSPEED);
            initiativeBonus = initiativeBonus + aps;
        }

        const martialArtist = this._getAbilityFromArray(context.skills, MEGS.skills.MARTIAL_ARTIST);
        if (martialArtist) {
            const martialArtistRanks = martialArtist.system.aps;
            // Martial artist gives a +2
            if (martialArtistRanks > 0) {
                initiativeBonus = initiativeBonus + 2;
            }
        }

        // Lightning Reflexes gives +2
        if (this._hasAbility(context.advantages, MEGS.advantages.LIGHTNING_REFLEXES)) {
            initiativeBonus = initiativeBonus + 2;
        }

        // Water Freedom applies when submerged in water
        // TODO dialog prompt for modifiers
        if (this._hasAbility(context.powers, MEGS.powers.WATER_FREEDOM)) {
            // TODO add checkbox if has Water Freedom for if is in water
        }

        return initiativeBonus;
    }

    /**
     * Loop through array to see if it contains designated power/skill
     * @param {L} array
     * @param {*} name
     * @private
     */
    _hasAbility(array, name) {
        let hasAbility = false;
        if (array) {
            array.forEach((ability) => {
                if (ability.name === name) {
                    hasAbility = true;
                }
            });
        } else {
            console.error("Cannot find '" + name + "' in null array");
        }
        return hasAbility;
    }

    /**
     *
     * @param {*} array
     * @param {*} name
     * @returns
     */
    _getAbilityFromArray(array, name) {
        let returnValue;
        array.forEach((ability) => {
            if (ability.name === name) {
                returnValue = ability;
            }
        });
        return returnValue;
    }

    /**
     * Loop through array to get number of APs in designated power/skill
     * @param {*} array
     * @param {*} name
     * @private
     */
    _getAbilityAPs(array, name) {
        let aps = 0;
        array.forEach((attribute) => {
            if (attribute.name === name && attribute.system && attribute.system.aps) {
                aps = attribute.system.aps;
            }
        });
        return aps;
    }

    /**
     * Organize and classify Items for Character sheets.
     *
     * @param {Object} context The actor to prepare.
     *
     * @return {undefined}
     * @private
     */
    _prepareItems(context) {
        // Initialize containers.
        const powers = [];
        const skills = [];
        const advantages = [];
        const drawbacks = [];
        const subskills = [];
        const gadgets = [];

        // TODO delete this by 1.0
        context.items = context.items.filter(
            (i) =>
                (i.system.type !== MEGS.itemTypes.bonus &&
                    i.system.type !== MEGS.itemTypes.limitation &&
                    i.system.type !== MEGS.itemTypes.subskill) ||
                i.system.parent !== ''
        );

        // Iterate through items, allocating to containers
        context.items.forEach((i) => {
            i.img = i.img || Item.DEFAULT_ICON;

            // Append to powers
            if (i.type === MEGS.itemTypes.power && !i.system.parent) {
                powers.push(i);
            }
            // Append to skills.
            else if (i.type === MEGS.itemTypes.skill && !i.system.parent) {
                i.subskills = [];
                if (i.system.aps === 0) {
                    i.unskilled = true;
                    i.linkedAPs = this.object.system.attributes[i.system.link].value;
                } else {
                    i.unskilled = false;
                }
                i.subskills = [];
                skills.push(i);
            }
            // Append to advantages.
            else if (i.type === MEGS.itemTypes.advantage && !i.system.parent) {
                advantages.push(i);
            }
            // Append to drawbacks.
            else if (i.type === MEGS.itemTypes.drawback && !i.system.parent) {
                drawbacks.push(i);
            }
            // Append to subskills.
            else if (i.type === MEGS.itemTypes.subskill) {
                subskills.push(i);
            }
            // Append to gadgets; do not show if gadget is owned by another gadget
            else if (i.type === MEGS.itemTypes.gadget && !i.system.parent) {
                i.ownerId = this.object._id;
                i.rollable = i.system.effectValue > 0 || i.system.actionValue > 0;
                gadgets.push(i);
            }
        });

        // Add skills from linked gadget (for vehicles/locations)
        if (context.system.linkedItemId && context.system.ownerId) {
            const owner = game.actors.get(context.system.ownerId);
            if (owner && owner.items) {
                // Get all skills and subskills that belong to the linked gadget
                owner.items.forEach((item) => {
                    if (item.system.parent === context.system.linkedItemId) {
                        if (item.type === MEGS.itemTypes.skill) {
                            const linkedSkill = { ...item };
                            linkedSkill.isFromLinkedGadget = true;
                            linkedSkill.subskills = [];
                            if (linkedSkill.system.aps === 0) {
                                linkedSkill.unskilled = true;
                                linkedSkill.linkedAPs = context.system.linkedItem?.system.attributes[linkedSkill.system.link]?.value || 0;
                            } else {
                                linkedSkill.unskilled = false;
                            }
                            skills.push(linkedSkill);
                        } else if (item.type === MEGS.itemTypes.subskill) {
                            const linkedSubskill = { ...item };
                            linkedSubskill.isFromLinkedGadget = true;
                            subskills.push(linkedSubskill);
                        }
                    }
                });
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

        // Assign and return
        context.powers = powers;
        context.skills = skills;
        context.advantages = advantages;
        context.drawbacks = drawbacks;
        context.subskills = subskills;
        context.gadgets = gadgets;
    }

    /* -------------------------------------------- */

    /** @override */
    activateListeners(html) {
        super.activateListeners(html);

        // Restore accordion state after render
        this._restoreAccordionState(html);

        html.on('click', '.lockPageIcon', (ev) => this._toggleEditMode(ev));

        // Double-click TinyMCE editor content to activate editing
        html.on('dblclick', '.editor-content', (ev) => {
            // Find the associated edit button and click it
            const editorContainer = $(ev.currentTarget).closest('.editor');
            const editButton = editorContainer.find('.editor-edit');
            if (editButton.length > 0 && !editButton.hasClass('active')) {
                editButton.click();
            }
        });

        // Render the item sheet for viewing/editing prior to the editable check.
        html.on('click', '.item-edit', (ev) => {
            const li = $(ev.currentTarget).parents('.item');
            const item = this.actor.items.get(li.data('itemId'));
            item.sheet.render(true);
        });

        // -------------------------------------------------------------
        // Everything below here is only needed if the sheet is editable

        if (!this.isEditable) return;

        // Add Inventory Item
        html.on('click', '.item-create', this._onItemCreate.bind(this));

        // Delete Inventory Item with cascade delete for modifiers
        html.on('click', '.item-delete', (ev) => this._handleItemDelete(ev));

        // Skill APs increment/decrement
        html.on('click', '.ap-plus', (ev) => this._handleApChange(ev, html, 1));
        html.on('click', '.ap-minus', (ev) => this._handleApChange(ev, html, -1));

        // Skill accordion toggle
        html.on('click', '.tab.skills .skill-row .toggle-icon', (ev) => this._handleSkillAccordionToggle(ev, html));

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

        // Rollable attributes.
        html.on('click', '.rollable', this._onRoll.bind(this));

        // Drag events for macros.
        if (this.actor.isOwner) {
            let handler = (ev) => this._onDragStart(ev);
            html.find('li.item').each((i, li) => {
                if (li.classList.contains('inventory-header')) return;
                li.setAttribute('draggable', true);
                li.addEventListener('dragstart', handler, false);
            });
        }
    }

    /**
     *
     * @param {*} event
     */
    _onDragStart(event) {
        super._onDragStart(event);
    }

    /**
     * Handle creating a new Owned Item for the actor using initial data defined in the HTML dataset
     * @param {Event} event   The originating click event
     * @private
     */
    async _onItemCreate(event) {
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
        return await Item.create(itemData, { parent: this.actor });
    }

    /**
     * Handle AP increment/decrement for skills and powers
     * @param {Event} event The click event
     * @param {jQuery} html The HTML element
     * @param {number} delta The change amount (+1 or -1)
     * @private
     */
    async _handleApChange(event, html, delta) {
        event.preventDefault();
        const itemId = $(event.currentTarget).data('itemId');
        const item = this.actor.items.get(itemId);

        if (!item || (item.type !== 'skill' && item.type !== 'power')) {
            return;
        }

        const currentAps = item.system.aps || 0;
        const newValue = currentAps + delta;

        // Don't allow negative values
        if (newValue < 0) {
            return;
        }

        // Save accordion state before render
        this._saveAccordionState(html);

        await item.update({ 'system.aps': newValue });
        this.render(false);
    }

    /**
     * Get action and effect values from gadget attributes
     * @param {Object} gadget The gadget item
     * @param {number} currentActionValue Current action value
     * @returns {Object} Object with effectValue and actionValue
     * @private
     */
    _getGadgetValues(gadget, currentActionValue) {
        const attributePairs = [
            { effect: 'str', action: 'dex', actorFallback: 'dex' },
            { effect: 'will', action: 'int', actorFallback: 'int' },
            { effect: 'aura', action: 'infl', actorFallback: 'infl' }
        ];

        for (const pair of attributePairs) {
            if (gadget.system.attributes[pair.effect] > 0) {
                const effectValue = gadget.system.attributes[pair.effect];
                let actionValue = currentActionValue;

                if (actionValue === 0) {
                    if (gadget.system.attributes[pair.action] > 0) {
                        actionValue = gadget.system.attributes[pair.action];
                    } else {
                        actionValue = this.object.system.attributes[pair.actorFallback];
                    }
                }

                return { effectValue, actionValue };
            }
        }

        return { effectValue: 0, actionValue: currentActionValue };
    }

    /**
     * Handle item deletion with cascade delete for modifiers
     * @param {Event} event The click event
     * @private
     */
    async _handleItemDelete(event) {
        const li = $(event.currentTarget).parents('.item');
        const item = this.actor.items.get(li.data('itemId'));

        if (!item) return;

        const type = item.type.charAt(0).toUpperCase() + item.type.slice(1);
        const confirmed = await Dialog.confirm({
            title: `Delete ${type}: ${item.name}`,
            content: `<p style="font-family: Helvetica, Arial, sans-serif;"><strong>Are You Sure?</strong> This item will be permanently deleted and cannot be recovered.</p>`,
            defaultYes: false,
            options: {
                classes: ['megs', 'dialog']
            }
        });

        if (!confirmed) return;

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
    }

    /**
     * Handle skill accordion toggle
     * @param {Event} event The click event
     * @param {jQuery} html The HTML element
     * @private
     */
    _handleSkillAccordionToggle(event, html) {
        event.preventDefault();
        const skillRow = $(event.currentTarget).closest('.skill-row');
        const skillId = skillRow.data('itemId');
        const isExpanded = skillRow.data('expanded');
        const icon = $(event.currentTarget);

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
    }

    /**
     * Handle clickable rolls.
     * @param {Event} event   The originating click event
     * @private
     */
    _onRoll(event) {
        const element = event.currentTarget;
        const dataset = element.dataset;

        let actionValue = parseInt(dataset.value);
        let opposingValue = 0;
        let effectValue = 0;
        let resistanceValue = 0;

        let targetActor = MegsTableRolls.getTargetActor();
        if (targetActor) {
            if (dataset.type === MEGS.rollTypes.attribute) {
                opposingValue = targetActor.system.attributes[dataset.key].value;
                resistanceValue = Utils.getResistanceValue(dataset.key, targetActor);
            } else if (
                dataset.type === MEGS.itemTypes.power ||
                dataset.type === MEGS.itemTypes.skill
            ) {
                if (dataset.link) {
                    opposingValue = targetActor.system.attributes[dataset.link].value;
                    resistanceValue = Utils.getResistanceValue(dataset.link, targetActor);
                } else {
                    console.error('No linked attribute for ' + dataset.name);
                }
            }
        }

        if (dataset.type === MEGS.rollTypes.attribute) {
            effectValue = Utils.getEffectValue(dataset.key, this.actor);
        } else if (
            dataset.type === MEGS.itemTypes.power ||
            dataset.type === MEGS.itemTypes.skill ||
            dataset.type === MEGS.itemTypes.subskill
        ) {
            effectValue = parseInt(dataset.value);
        } else if (dataset.type === MEGS.itemTypes.gadget) {
            // TODO clean all this up; waaaay too complex
            actionValue = parseInt(dataset.actionvalue);
            effectValue = parseInt(dataset.effectvalue);

            if (effectValue === 0) {
                // no EV specified; check attributes
                const gadget = this._getOwnedItemById(dataset.gadgetid);

                if (gadget) {
                    const values = this._getGadgetValues(gadget, actionValue);
                    effectValue = values.effectValue;
                    actionValue = values.actionValue;
                } else {
                    console.error('No gadget with ID ' + dataset.gadgetid + ' found');
                }
            }
        }

        console.info('Rolling from actor-sheet._onRoll()');
        const rollValues = new RollValues(
            this.object.name + ' - ' + dataset.label,
            dataset.type,
            dataset.value,
            actionValue,
            opposingValue,
            effectValue,
            resistanceValue,
            dataset.roll,
            dataset.unskilled
        );
        const speaker = ChatMessage.getSpeaker({ actor: this.object });
        const rollTables = new MegsTableRolls(rollValues, speaker);
        rollTables.roll(event, this.object.system.heroPoints.value).then((response) => {});
    }

    /**
     *
     * @param {*} id
     * @returns
     */
    _getOwnedItemById(id) {
        let ownedItem;
        const items = this.object.collections.items;
        for (let i of items) {
            if (i._id === id) {
                ownedItem = i;
                break;
            }
        }
        return ownedItem;
    }

    /** @override **/
    async _onDrop(event) {
        super._onDrop(event);
    }

    _changeEditHeaderLink(sheetHeaderLinks) {
        const found = sheetHeaderLinks.find((element) => element.label === 'Sheet');
        found.icon = 'fas fa-file';
    }

    /** @override **/
    _getHeaderButtons() {
        let sheetHeaderLinks = [];
        if (this.actor.isOwner) {
            sheetHeaderLinks = [
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
        } else {
            sheetHeaderLinks = super._getHeaderButtons();
        }
        this._changeEditHeaderLink(sheetHeaderLinks);
        this._changeConfigureIcon(sheetHeaderLinks);
        return sheetHeaderLinks;
    }

    _changeConfigureIcon(buttons) {
        const configButton = buttons.find(b => b.class === 'configure-sheet');
        if (configButton) {
            configButton.icon = 'fas fa-file-alt'; // Document icon
        }
    }

    _toggleEditMode(_e) {
        const currentValue = this.actor.getFlag('megs', 'edit-mode');
        this.actor.setFlag('megs', 'edit-mode', !currentValue);
        this.render(false);
    }

    /**
     * Save the current accordion state (which skills are expanded)
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
     * Restore the accordion state after re-render
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
