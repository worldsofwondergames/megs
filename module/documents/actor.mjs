import { MEGS } from "../helpers/config.mjs";
import { MEGSItem } from "./item.mjs";

/**
 * Extend the base Actor document by defining a custom roll data structure which is ideal for the Simple system.
 * @extends {Actor}
 */
export class MEGSActor extends Actor {

  async _preCreate(data, options, user) {
    await super._preCreate(data, options, user);

    _loadData('systems/megs/assets/data/skills.json').then(async (allGameSkills) => {
      // Create default skills and subskills
    
          // create skills
          let skillIds = [];
          for (let i of allGameSkills) {
            const itemData = { ...i };
            delete itemData._id;
            const item = await MEGSItem.create(itemData, {});
            skillIds.push(item._id);
          }
          const skills = await Promise.all(skillIds.map(async (i) => (await game.items.get(i)).toObject()));
          this.updateSource({ items: skills });
          for (let itemId of skillIds) {
            game.items.get(itemId).delete();
          }
    
          let actorSkills = {};
          this.items.forEach(skill => {
            actorSkills[skill.name] = skill._id;
          });

        console.error(this.items);
      });
    
    /*
    console.error(this.items);
    _loadData('systems/megs/assets/data/skills.json').then(async (skills) => {

      for (const skill of skills) {

        delete skill._id;

        // const subskills = skillData.subskills; // TODO
        // delete skillData.subskills;
    
      //   const itemData = {
      //     name: skillData.name,
      //     type: MEGS.itemTypes.skill,
      //     img: skillData.img ? 'systems/megs/assets/images/icons/skillls/' + skillData.img : 'systems/megs/assets/images/icons/skillls/skill.png',
      //     system: skillData.system,
      //   };
      //   delete itemData.system['type'];

      //   const skill = new MEGSItem(itemData);
      //   delete skill._id;
      //   const items = this.items.toObject();
      //   items.push(skill);
      //   this.updateSource({ items: items });
      }

      console.error(skills);
      this.updateSource({ items: skills });
      console.error(this.items);

      if (game.items) {
        let allGameSkills = [];
        for (let i of game.items) {
          if (i.type === MEGS.itemTypes.skill) {
            allGameSkills.push(i);
          }
        }
  
        console.error(allGameSkills);
      }
    });
    */
    
  
  
  }

  /** @override */
  prepareData() {
    // Prepare data for the actor. Calling the super version of this executes
    // the following, in order: data reset (to clear active effects),
    // prepareBaseData(), prepareEmbeddedDocuments() (including active effects),
    // prepareDerivedData().
    super.prepareData();

    if (this.items) {
      this.items.forEach(item => {
        if (item.type === MEGS.itemTypes.subskill) {
          item.system.actorId = this._id;
        }
      });
    }

  }

  
  /** @override */
  prepareBaseData() {
    // Data modifications in this step occur before processing embedded
    // documents or derived data.
  }
  /**
   * @override
   * Augment the actor source data with additional dynamic data. Typically,
   * you'll want to handle most of your calculated/derived data in this step.
   * Data calculated in this step should generally not exist in template.json
   * (such as ability modifiers rather than ability scores) and should be
   * available both inside and outside of character sheets (such as if an actor
   * is queried and has a roll executed directly from it).
   */
  prepareDerivedData() {
    super.prepareDerivedData();
    
    this.system.currentBody.max = this.system.attributes.body.value;
    this.system.currentMind.max = this.system.attributes.mind.value;
    this.system.currentSpirit.max = this.system.attributes.spirit.value;
  }

  /**
   * 
   * @returns 
   */
  _calculateInitiativeBonus() {
    // TODO replace all of this with effects?

    // calculate initiativeBonus
    let initiativeBonus = this.system.attributes.dex.value + this.system.attributes.int.value
        + this.system.attributes.infl.value;

    // Superspeed adds APs of their power
    if (this._hasAbility(this.items, MEGS.powers.SUPERSPEED)) { 
      const aps = this._getAbilityAPs(this.items, MEGS.powers.SUPERSPEED);
      initiativeBonus = initiativeBonus + aps;
    }

    // Martial artist gives a +2
    if (this._hasAbility(this.items, MEGS.skills.MARTIAL_ARTIST)) {
      initiativeBonus = initiativeBonus + 2;
    }

    // Lightning Reflexes gives +2
    if (this._hasAbility(this.items, MEGS.advantages.LIGHTNING_REFLEXES)) {
      initiativeBonus = initiativeBonus + 2;
    }

    // Water Freedom applies when submerged in water
    if (this._hasAbility(this.items, MEGS.powers.WATER_FREEDOM)) {
      // TODO add checkbox if has Water Freedom for if is in water
    }

    return initiativeBonus;
}

/**
   * Loop through array to see if it contains designated power/skill
   * @param {L} array 
   * @param {*} name 
   */
  _hasAbility(array, name) {
    let hasAbility = false;
    array.forEach(attribute => {
       if (attribute.name === name) {
        hasAbility = true;
      }
    });
    return hasAbility;
  }

  /**
   * Loop through array to get number of APs in designated power/skill
   * @param {*} array 
   * @param {*} name 
   */
  _getAbilityAPs(array, name) {
    let aps = 0;
    array.forEach(attribute => {
      if (attribute.name === name) {
        aps = attribute.system.aps;
      }
    });
    return aps;
  }

  /**
   * Override getRollData() that's supplied to rolls.
   */
  // TODO none of this is doing anything
  getRollData() {
    // Starts off by populating the roll data with `this.system`
    const data = { ...super.getRollData() };

    // Prepare actor roll data.
    this._getHeroRollData(data);
    this._getVillainRollData(data);
    this._getNpcRollData(data);

    return data;
  }

  /**
   * Prepare hero roll data.
   */
  _getHeroRollData(data) {
    if (this.type !== MEGS.characterTypes.hero) return;
  }

  /**
   * Prepare NPC roll data.
   */
  _getVillainRollData(data) {
    if (this.type !== MEGS.characterTypes.villain) return;

    // Process additional NPC data here.
  }

  /**
   * Prepare NPC roll data.
   */
  _getNpcRollData(data) {
    if (this.type !== MEGS.characterTypes.npc) return;

    // Process additional NPC data here.
  }

} 


/**
 * Create the MEGS tables from JSON data.
 * Grab the JSON and place it in an object.
 * @param {Object} jsonPath     The path in the Foundry Data directory to the JSON asset
 * @returns {Promise}
 */
async function _loadData(jsonPath) {
  const response = await fetch(jsonPath);
  const contents = await response.json();
  return contents;
}

