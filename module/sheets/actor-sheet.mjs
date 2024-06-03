import { MEGS } from '../helpers/config.mjs';
import {
  prepareActiveEffectCategories,
} from '../helpers/effects.mjs';
import { MegsTableRolls, RollValues } from '../dice.mjs'

/**
 * Extend the basic ActorSheet with some very simple modifications
 * @extends {ActorSheet}
 */
export class MEGSActorSheet extends ActorSheet {
  /** @override */
  static get defaultOptions () {
    let newOptions = super.defaultOptions;
    newOptions.classes = ['megs', 'sheet', 'actor'];
    newOptions.width = 600;
    newOptions.height = 600;
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
  get template () {
    return `systems/megs/templates/actor/actor-${this.actor.type}-sheet.hbs`;
  }

  /* -------------------------------------------- */

  /** @override */
  getData () {
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

    // Prepare actor data and items.
    if (actorData.type === MEGS.characterTypes.hero) {
      this._prepareItems(context);
      this._prepareCharacterData(context);
      this._prepareInitiative(context);
    }

    // Prepare Villain data and items.
    if (actorData.type === MEGS.characterTypes.villain) {
      this._prepareItems(context);
      this._prepareCharacterData(context);
      this._prepareInitiative(context);
    }

    // Prepare NPC data and items.
    if (actorData.type === MEGS.characterTypes.npc) {
      this._prepareCharacterData(context);
    }

    // Add roll data for TinyMCE editors.
    // TODO does this do anything in current model?
    context.rollData = context.actor.getRollData();

    // Prepare active effects
    context.effects = prepareActiveEffectCategories(
      // A generator that returns all effects stored on the actor
      // as well as any items
      this.actor.allApplicableEffects()
    );

    context.showHeroPointCosts = game.settings.get("megs", "showHeroPointCosts");

    return context;
  }

  /**
   * Organize and classify Items for Character sheets.
   *
   * @param {Object} context The actor to prepare.
   *
   * @return {undefined}
   * @private
   */
  _prepareCharacterData (context) {
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
  _calculateInitiativeBonus (context) {
    // TODO replace this with active effects

    // calculate initiativeBonus
    let initiativeBonus = context.document.system.attributes.dex.value + context.document.system.attributes.int.value
      + context.document.system.attributes.infl.value;
    
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
  _hasAbility (array, name) {
    let hasAbility = false;
    if (array) {
      array.forEach(ability => {
        if (ability.name === name) {
          hasAbility = true;
        }
      });
    } else {
      console.error("Cannot find '"+name+"' in null array");
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
    array.forEach(ability => {
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
  _getAbilityAPs (array, name) {
    let aps = 0;
    array.forEach(attribute => {
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
  _prepareItems (context) {
    // Initialize containers.
    const powers = [];
    const skills = [];
    const advantages = [];
    const drawbacks = [];
    const subskills = [];
    const gadgets = [];

    // Iterate through items, allocating to containers
    for (let i of context.items) {
      i.img = i.img || Item.DEFAULT_ICON;

      // Append to powers
      if (i.type === MEGS.itemTypes.power && !i.system.parent) {
        powers.push(i);
      }
      // Append to skills.
      else if (i.type === MEGS.itemTypes.skill && !i.system.parent) {
        if (i.system.aps === 0) {
          i.unskilled = true;
          i.linkedAPs = this.object.system.attributes[i.system.link].value;
        } else {
          i.unskilled = false;
        }
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
      // Append to gadgets
      else if (i.type === MEGS.itemTypes.gadget) {
        i.ownerId = this.object._id;
        gadgets.push(i);
      }
      // TODO handle omni-gadgets
    }

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
  activateListeners (html) {
    super.activateListeners(html);

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

    // Delete Inventory Item
    html.on('click', '.item-delete', (ev) => {
      const li = $(ev.currentTarget).parents('.item');
      const item = this.actor.items.get(li.data('itemId'));
      item.delete();
      li.slideUp(200, () => this.render(false));
    });

    // Active Effect management
    // TODO delete
    // html.on('click', '.effect-control', (ev) => {
    //   const row = ev.currentTarget.closest('li');
    //   const document =
    //     row.dataset.parentId === this.actor.id
    //       ? this.actor
    //       : this.actor.items.get(row.dataset.parentId);
    //   onManageActiveEffect(ev, document);
    // });
    
    // Rollable attributes.
    html.on('click', '.rollable', this._onRoll.bind(this));

    // Drag events for macros.
    // TODO do we need this?
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
   * Handle creating a new Owned Item for the actor using initial data defined in the HTML dataset
   * @param {Event} event   The originating click event
   * @private
   */
  async _onItemCreate (event) {
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
   * Handle clickable rolls.
   * @param {Event} event   The originating click event
   * @private
   */
  _onRoll (event) {
    const element = event.currentTarget;
    const dataset = element.dataset;

    let actionValue = parseInt(dataset.value);
    let opposingValue = 0;
    let effectValue = 0;
    let resistanceValue = 0;
  
    let targetActor = MegsTableRolls.getTargetActor();
    if (targetActor) {
      if (dataset.type === MEGS.itemTypes.attribute) {
        opposingValue = targetActor.system.attributes[dataset.key].value;
        resistanceValue = this._getResistanceValueForAttribute(dataset.key, targetActor);
      } else if (dataset.type === MEGS.itemTypes.power || dataset.type === MEGS.itemTypes.skill) {
        if (dataset.link) {
          opposingValue = targetActor.system.attributes[dataset.link].value;
          resistanceValue = this._getResistanceValueForAttribute(dataset.link, targetActor);
        } else {
          console.error("No linked attribute for "+dataset.name);
        }
      }
    }

    if (dataset.type === MEGS.itemTypes.attribute) {
      effectValue = this._getEffectValueForAttribute(dataset.key);
    } else if (dataset.type === MEGS.itemTypes.power || dataset.type === MEGS.itemTypes.skill 
        || dataset.type === MEGS.itemTypes.subskill) {
      effectValue = parseInt(dataset.value);
    } else if (dataset.type === MEGS.itemTypes.gadget) {
      // TODO gadget type - physical, mental, spiritual?
      // TODO get owner data?
      console.error(dataset);
      const gadget = game.items.get(dataset.gadgetid);
      console.error(dataset.gadgetid); // TODO
      console.error(gadget); // TODO
      actionValue = parseInt(dataset.actionvalue);
      effectValue = parseInt(dataset.effectvalue);
  }

    const rollValues = new RollValues(this.object.name + " - " + dataset.label, dataset.type, dataset.value, actionValue, opposingValue,
        effectValue, resistanceValue, dataset.roll, dataset.unskilled);
    const rollTables = new MegsTableRolls(rollValues);
    rollTables.roll(event, this.object.system.heroPoints.value).then((response) => {
    })
  }

  /**
   *
   * @param key
   * @param targetActor
   * @returns {*}
   * @private
   */
  _getResistanceValueForAttribute(key, targetActor) {
    let resistanceValue;
    if (key === "dex") {
      resistanceValue = targetActor.system.attributes.body.value;
    } else if (key === "int") {
      resistanceValue = targetActor.system.attributes.mind.value;
    } else if (key === "infl") {
      resistanceValue = targetActor.system.attributes.spirit.value;
    } else {
      ui.notifications.error("Invalid attribute selection");
      return;
    }
    return resistanceValue;
  }

  /**
   *
   * @param key
   * @returns {string}
   * @private
   */
  _getEffectValueForAttribute(key) {
    let effectValue;
    if (key === MEGS.attributeAbbreviations.dex) {
      effectValue = this.actor.system.attributes.str.value;
    } else if (key === MEGS.attributeAbbreviations.int) {
      effectValue = this.actor.system.attributes.will.value;
    } else if (key === MEGS.attributeAbbreviations.infl) {
      effectValue = this.actor.system.attributes.aura.value;
    } else {
      ui.notifications.error("Invalid attribute selection");
      return;
    }
    return effectValue;
  }

}