import { MEGS } from "../helpers/config.mjs";
import { MegsTableRolls, RollValues } from "../dice.mjs";
import { Utils } from "../utils.js"

/**
 * Extend the basic Item with some very simple modifications.
 * @extends {Item}
 */
export class MEGSItem extends Item {

  /** @override */
  constructor(data, context) {
    super(data, context);
  }

  /**
   * Augment the basic Item data model with additional dynamic data.
   */
  prepareData() {
    // As with the actor class, items are documents that can have their data
    // preparation methods overridden (such as prepareBaseData()).
    super.prepareData();
  }

  /**
   * @override
   * Augment the item source data with additional dynamic data. Typically,
   * you'll want to handle most of your calculated/derived data in this step.
   * Data calculated in this step should generally not exist in template.json
   * (such as attribute modifiers rather than attribute scores) and should be
   * available both inside and outside of actor sheets (such as if an actor
   * is queried and has a roll executed directly from it).
   */
  prepareDerivedData() {
    const itemData = this;
    const systemData = itemData.system;

    // replace default icon if another has been specified in template.json
    if (itemData.img === "icons/svg/item-bag.svg") {
      if (systemData.img !== "") {
        this.img = systemData.img;
      }
    }

    // calculate gadget bonus
    // TODO cost
    if (this.type === MEGS.itemTypes.gadget) {
      if (itemData.canBeTakenAway) {
        this.gadgetBonus = 4;
      } else {
        this.gadgetBonus = 2;
      }
    }

    // calculate total cost of the item
    // TODO gadgets are different
    if (systemData.hasOwnProperty("baseCost")) {
      if (systemData.hasOwnProperty("factorCost") && systemData.hasOwnProperty("aps")) {
        systemData.totalCost = systemData.baseCost + (systemData.factorCost * systemData.aps);
      } else {
        systemData.totalCost = systemData.baseCost;
      }
      this.totalCost = systemData.totalCost;
    }

    // import constants
    systemData.powerTypes = MEGS.powerTypes;
    systemData.powerSources = MEGS.powerSources;
    systemData.ranges = MEGS.ranges;

    systemData.yesNoOptions = MEGS.yesNoOptions;

    systemData.attributesForLink = {};
    for (const [key, value] of Object.entries(MEGS.attributeLabels)) {
      systemData.attributesForLink[key] = game.i18n.localize(value);
    }

  }

  /**
   * Prepare a data object which defines the data schema used by dice roll commands against this Item
   * @override
   */
  getRollData() {
    // Starts off by populating the roll data with `this.system`
    const rollData = { ...super.getRollData() };

    // Quit early if there's no parent actor
    if (!this.actor) return rollData;

    // If present, add the actor's roll data
    rollData.actor = this.actor.getRollData();

    return rollData;
  }

  /**
   * Handle clickable rolls.
   * @private
   */
  async roll() {
    const item = this;

    // Initialize chat data.
    const speaker = ChatMessage.getSpeaker({ actor: this.actor });
    const rollMode = game.settings.get('core', 'rollMode');
    const label = `[${item.actor.name}] ${item.name}`;

    if (this.type === MEGS.itemTypes.skill || this.type === MEGS.itemTypes.subskill || this.type === MEGS.itemTypes.power) {
      this.rollMegs();
    }

    // If there's no roll data, send a chat message.
    else if (!this.system.formula) {
      ChatMessage.create({
        speaker: speaker,
        rollMode: rollMode,
        flavor: label,
        content: item.system.description ?? '',
      });
    }
    // Otherwise, create a roll and send a chat message from it.
    else {
      // Retrieve roll data.
      const rollData = this.getRollData();

      // Invoke the roll and submit it to chat.
      const roll = new Roll(rollData.formula, rollData);
      // If you need to store the value first, uncomment the next line.
      // const result = await roll.evaluate();
      roll.toMessage({
        speaker: speaker,
        rollMode: rollMode,
        flavor: label,
      });
      return roll;
    }
  }

  /**
   *
   */
  rollMegs() {
    // for powers, AV and EV are typically APs of power
    let actionValue = parseInt(this.system.aps);
    let effectValue = parseInt(this.system.aps);
    let opposingValue = 0;
    let resistanceValue = 0;

    let targetActor = MegsTableRolls.getTargetActor();

    if (targetActor) {
      let key;

      if (this.system.link) {
        let linkedType = this.system[this.system.link];
        if (!linkedType && this.parent) {
          linkedType = this.parent.system.attributes[this.system.link];
        }

        if (linkedType) {
          // Physical powers - OV and RV are DEX and BODY
          if (linkedType.type === MEGS.powerSources.physical.toLowerCase()) {
            key = MEGS.attributeAbbreviations.str;
          }
          // Mental powers - OV and RV are INT and MIND
          if (linkedType.type === MEGS.powerSources.mental.toLowerCase()) {
            key = MEGS.attributeAbbreviations.int;
          }
          // Mystical powers - OV and RV are INFL and SPIRIT
          if (linkedType.type === MEGS.powerSources.mystical.toLowerCase()) {
            key = MEGS.attributeAbbreviations.infl;
          }

          opposingValue = Utils.getOpposingValue(key, targetActor);
          resistanceValue = Utils.getResistanceValue(key, targetActor);
        } else {
          console.error("No linked type for this item");
        }
      } else {
        console.error("No linked attribute for this item");
      }
    }

    if (this.type === MEGS.itemTypes.power) {
      // TODO physical powers should have AV of DEX, mental INT, mystical INFL - optional rule
    }

    // values of skills and subskills
    if (this.type === MEGS.itemTypes.skill || this.type === MEGS.itemTypes.subskill) {
      // TDOO anything skill-specific
    }

    let label = this.name;
    if (this.parent && this.parent.name) {
      label = this.parent.name + " - " + label;
    }

    console.info("Rolling from item.rollMegs()");
    const isUnskilled = this.system.aps === 0;
    const rollValues = new RollValues(label, this.type, this.system.aps, actionValue, opposingValue,
        effectValue, resistanceValue, "1d10 + 1d10", isUnskilled);
    const rollTables = new MegsTableRolls(rollValues);
    rollTables.roll(null, this.parent.system.heroPoints.value).then((response) => {
      // no handling happens
    })
  }

  /** @override */
  static async create(data, context={}) {
    const createData = data instanceof Array ? data : [data];
    const created = await this.createDocuments(createData, context);
    return data instanceof Array ? created : created.shift();
  }

  /** @override */
  getEmbeddedCollection(embeddedName) {
    const collectionName = this.constructor.getCollectionName(embeddedName);
    if ( !collectionName ) {
      throw new Error(`${embeddedName} is not a valid embedded Document within the ${this.documentName} Document`);
    }
    const field = this.constructor.hierarchy[collectionName];
    return field.getCollection(this);
  }

}
