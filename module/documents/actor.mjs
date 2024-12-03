import { MEGS } from "../helpers/config.mjs";
import { MEGSItem } from "./item.mjs";

/**
 * Extend the base Actor document by defining a custom roll data structure which is ideal for the Simple system.
 * @extends {Actor}
 */
export class MEGSActor extends Actor {

  async _preCreate(data, options, user) {
    await super._preCreate(data, options, user);

    const skillsJson = [
    {
        "name": "Acrobatics",
        "type": "skill",
        "img": "acrobatics.png",
        "system": {
            "description": "<p>Acrobatics is composed of three separate Subskills; these are Climbing. Dodging, and Gymnastics.</p>",
            "link": "dex",
            "isLinked": "false",
            "range": "normal",
            "rangeAPs": 0,
            "baseCost": 15,
            "totalCost": 15,
            "factorCost": 7,
            "aps": 0,
            "type": "dice",
            "useUnskilled": "true",
            "linked": false,
            "unskilled": true
        }    },
    {
        "name": "Animal Handling",
        "type": "skill",
        "img": "animal-handling.png",
        "system": {
            "description": "<p>The Animal Handling Skill has two Subskills: Animal Training and Riding. The Animal Training Subskill of Animal&nbsp;Handling cannot be used Unskilled.&nbsp;</p>",
            "link": "infl",
            "isLinked": "false",
            "range": "self",
            "rangeAPs": 0,
            "baseCost": 5,
            "totalCost": 5,
            "factorCost": 4,
            "aps": 0,
            "type": "both",
            "useUnskilled": "true",
            "linked": false,
            "unskilled": true
        }
    },
    {
        "name": "Artist",
        "type": "skill",
        "img": "artist.png",
        "system": {
            "description": "<p>The Artist Skill has seven Subskills: Actor, Dancer, Musician, Painter, Photographer, Sculptor, and Writer, each of which has the potential to please an audience; these Subskills will only impress willing and interested viewers.</p>\n<p>When a Character uses Artist to perform or produce a work, OV/RVs are at 4/4 unless performed or produced for a specific person, in which case that person's INFLISPIRIT acts as OV/RVs. If the person possesses the Artist Skill, the APs of Artist will act as OV/RV to the attempt. Multi-Attack penalties for Artist attempts are not applicable. RAPs on an Artist attempt indicate the following effects:</p>\n<table style=\"width: 100.041%;\" border=\"1\"><colgroup><col style=\"width: 16.5548%;\"><col style=\"width: 83.404%;\"></colgroup>\n<tbody>\n<tr>\n<td style=\"text-align: center;\">1-2</td>\n<td>The performance or work is accepted.</td>\n</tr>\n<tr>\n<td style=\"text-align: center;\">3-5</td>\n<td>The performance or work is well received.</td>\n</tr>\n<tr>\n<td style=\"text-align: center;\">6-9</td>\n<td>The artist receives critical acclaim (equal to a standing ovation if it is a performance).</td>\n</tr>\n<tr>\n<td style=\"text-align: center;\">10+</td>\n<td>The artist gives an immortal performance or creates a masterpiece which the audience will never forget.</td>\n</tr>\n</tbody>\n</table>\n<p>An audience which liked a Character's performance or work will be Friendly toward the Artist. Utilizing Artist in this fashion during combat will be ineffectual.</p>\n<p>A Character should remember that great works of art are not produced hourly. While no fixed time exists for the fruition of genius, a standard guideline is two months (21 APs) per major work. Saleable art works may be produced in the minimum times listed in the associated Subskills.</p>",
            "link": "infl",
            "isLinked": false,
            "range": "self",
            "rangeAPs": 0,
            "baseCost": 5,
            "totalCost": 5,
            "factorCost": 8,
            "aps": 0,
            "type": "dice",
            "useUnskilled": "false",
            "linked": false,
            "unskilled": true
        }
    },
    {
        "name": "Charisma",
        "type": "skill",
        "img": "charisma.png",
        "system": {
            "description": "<p>Charisma has three Subskills: Interrogation, Intimidation and Persuasion. The use of Charisma is often a struggle of Mental or Mystical strength made between Characters.<br><br>A Character with Charisma can use their AP's of the Skill as both the AV and the EV for all Character Interaction attempts in place of the usual Infl/Aura. To use Charisma in this manner, a Character must possess the appropriate Charismatic Subskill which corresponds the the type of Character Interaction which is being attempted (see page 109.)</p>",
            "link": "infl",
            "isLinked": "false",
            "range": "self",
            "rangeAPs": 0,
            "baseCost": 20,
            "totalCost": 20,
            "factorCost": 6,
            "aps": 0,
            "type": "dice",
            "useUnskilled": "false",
            "linked": false,
            "unskilled": true
        }
    },
    {
        "name": "Detective",
        "type": "skill",
        "img": "detective.png",
        "system": {
            "description": "<p>The Detective Skill possesses five separate Subskills. These&nbsp;are Clue Analysis, Counterfeit Recognition, Identification Systems, Law, and Police Procedure.</p>",
            "link": "int",
            "isLinked": "false",
            "range": "self",
            "rangeAPs": 0,
            "baseCost": 10,
            "totalCost": 10,
            "factorCost": 7,
            "aps": 0,
            "type": "dice",
            "useUnskilled": "true",
            "linked": false,
            "unskilled": true
        }
    },
    {
        "name": "Gadgetry",
        "type": "skill",
        "img": "gadgetry.png",
        "system": {
            "description": "<p>Gadgetry is the ability to build, identify, and use technological devices. The Gadgetry Skill consists of two separate Subskills: Build Gadget and Identify Gadget.</p>",
            "link": "int",
            "isLinked": false,
            "range": "self",
            "rangeAPs": 0,
            "baseCost": 25,
            "totalCost": 25,
            "factorCost": 8,
            "aps": 0,
            "type": "dice",
            "useUnskilled": "true",
            "linked": false,
            "unskilled": true
        }
    },
    {
        "name": "Martial Artist",
        "type": "skill",
        "img": "martial-artist.png",
        "system": {
            "description": "<p>A Character with the Martial Artist Skill is extremely proficient in hand-to-hand combat. Not all Characters who possess this Skill are actually trained in the Oriental Martial Arts; some merely excel in hand-to-hand combat or possess a unique fighting prowess.</p>\n<p>Possession of the Martial Artist Skill bestows two abilities on the Character:</p>\n<ul>\n<li>The Martial Artist is allowed to permanently add two points (+2) to his Initiative score, an addition which reflects the Martial Artist's extreme physical agility and finely tuned presence.</li>\n<li>The Martial Artist is allowed to substitute his APs of Skill for either AV, EV, OV, or RV when engaged in hand-to-hand combat. The Martial Artist may only substitute his APs of Skill for one of these values each phase and must declare for which value (if any) he will substitute during the upcoming phase. Substitutions of this nature only affect hand-to-hand combat and attacks made with melee weapons (knives, swords, staves, etc.).</li>\n</ul>\n<p>Example: A Martial Artist who had chosen to substitute APs of Skill for his RV is attacked by an Energy Blast; since this attack is neither hand-to-hand nor melee combat, he would defend with his normal RV, not with the APs of Martial Artist. Similarly, if the Martial Artist was planning to fire an Energy Blast during the upcoming phase, he could not use his APs of Skill as the AV or EV of the attack.</p>\n<p>Note: A Character substituting Martial Artist APs for any value can only spend a number of Hero Points equal to his substituted Attribute value on the attempt. For example, if the Batman (STR of 5 APs, and Martial Artist of 9 APs) were to substitute his APs of Martial Artist for his EV, he could spend a maximum of 5 Hero Points on his EV, as this figure was the AP level of his substituted Attribute (STR).</p>",
            "link": "dex",
            "isLinked": false,
            "range": "self",
            "rangeAPs": 0,
            "baseCost": 25,
            "totalCost": 25,
            "factorCost": 6,
            "aps": 0,
            "type": "dice",
            "useUnskilled": "true",
            "linked": false,
            "unskilled": true
        }
    },
    {
        "name": "Medicine",
        "type": "skill",
        "img": "medicine.png",
        "system": {
            "description": "<p>The Medicine Skill is composed of four Subskills; these are First Aid, Forensics, Medical Treatment, and Surgery. First Aid and Surgery are only useful toward healing damage done to the BODY of a Character. Medical Treatment may be used to heal BODY, MIND, or SPIRIT. First Aid is the only Subskill of Medicine which may be attempted through Unskilled Use.</p>",
            "link": "int",
            "isLinked": false,
            "range": "self",
            "rangeAPs": 0,
            "baseCost": 5,
            "totalCost": 5,
            "factorCost": 6,
            "aps": 0,
            "type": "dice",
            "useUnskilled": "true",
            "linked": false,
            "unskilled": true
        }
    },
    {
        "name": "Military Science",
        "type": "skill",
        "img": "military%20science.png",
        "system": {
            "description": "<p>Military Science possesses six basic Subskills: Camouflage, Cartography, Danger Recognition, Demolition, Field Command, and Tracking. Camouflage, Cartography, and Tracking are the only Subskills of Military Science which may be attempted through Unskilled Use.</p>",
            "link": "int",
            "isLinked": false,
            "range": "self",
            "rangeAPs": 0,
            "baseCost": 10,
            "totalCost": 10,
            "factorCost": 8,
            "aps": 0,
            "type": "dice",
            "useUnskilled": "true",
            "linked": false,
            "unskilled": true
        }
    },
    {
        "name": "Occultist",
        "type": "skill",
        "img": "occultist.png",
        "system": {
            "description": "<p>Characters with the Occultist Skill are intimately familiar with the world of the supernatural and all its paraphernalia. Skilled Occultists can identify and create mystical objects, perform magic rituals, and sense mystic energy. Occultist consists of five separate Subskills: Create Artifact, Identify Artifact, Occult Knowledge, Ritual Magic, and Premonition. None of these may be attempted with Unskilled Use.</p>\n<p>Note: For a more detailed treatment of this Skill and magic in general, consult the Magic sourcebook.</p>",
            "link": "infl",
            "isLinked": false,
            "range": "self",
            "rangeAPs": 0,
            "baseCost": 20,
            "totalCost": 20,
            "factorCost": 9,
            "aps": 0,
            "type": "dice",
            "useUnskilled": "false",
            "linked": false,
            "unskilled": true
        }
    },
    {
        "name": "Scientist",
        "type": "skill",
        "img": "scientist.png",
        "system": {
            "description": "<p>The scientist skill possesses two distinct Subskills: Analysis and Drawing Plans.</p>",
            "link": "int",
            "isLinked": "false",
            "range": "self",
            "rangeAPs": 0,
            "baseCost": 10,
            "totalCost": 10,
            "factorCost": 5,
            "aps": 0,
            "type": "dice",
            "useUnskilled": "true",
            "linked": false,
            "unskilled": true
        }
    },
    {
        "name": "Thief",
        "type": "skill",
        "img": "thief.png",
        "system": {
            "description": "<p>The Thief Skill possesses six specific Subskills, which are Escape Artist, Forgery, Locks and Safes, Pickpocketing, Security Systems, and Stealth.</p>",
            "link": "dex",
            "isLinked": false,
            "range": "self",
            "rangeAPs": 0,
            "baseCost": 10,
            "totalCost": 10,
            "factorCost": 8,
            "aps": 0,
            "type": "dice",
            "useUnskilled": "true",
            "linked": false,
            "unskilled": true
        }
    },
    {
        "name": "Vehicles",
        "type": "skill",
        "img": "vehicles.png",
        "system": {
            "description": "<p>Vehicles has four Subskills: Air Vehicles, Land Vehicles, Water Vehicles, and Space Craft. Each Subskill functions in an identical manner with the exception or the type of craft controllable through use of the Subskill.</p>\n<p>Each Vehicle Subskill enables a Character to safely operate the respective vehicle under normal conditions. Use of on-board weaponry while operating a vehicle has an AV equal to the operating Character's Vehicles Skill. If firing at another vehicle, the OV equals the Vehicles Skill of the opposing operator.</p>\n<p>A Character who attempts a trick maneuver, such as leaping a canyon or avoiding a collision in an asteroid field receives a Column Shift modifier to the OV for the Vehicles attempt based on the Universal Modifier Table. A +1 Column Shift would modify a simple motorcycle jump over a car, while a +7 Column shuft would modify a flight on the event horizon of a black hole.</p>",
            "link": "dex",
            "isLinked": false,
            "range": "self",
            "rangeAPs": 0,
            "baseCost": 5,
            "totalCost": 5,
            "factorCost": 5,
            "aps": 0,
            "type": "dice",
            "useUnskilled": "true",
            "linked": false,
            "unskilled": true
        }
    },
    {
        "name": "Weaponry",
        "type": "skill",
        "img": "weaponry.png",
        "system": {
            "description": "<p>Weaponry has five Subskills: Firearms, Exotic Weapons, Melee Weapons, Missile Weapons, and Heavy Weapons. Each Subskill functions in an identical manner with the exception of the type of weapon wieldable through use of the Subskill. Unskilled Characters may not use the Exotic Weapons subskill.</p>\n<p>The AVs for attacks made with Weaponry equal a Character's APs of the Skill, substituted for DEX, with EVs equal to damage inflicted by the weapon itself. Weaponry Skill also enables a Character to repair weapons which become damaged or malfunction; a gun which jams or a bowstring which breaks may automatically be repaired by such a Character in one minute (4 APs)</p>",
            "link": "dex",
            "isLinked": false,
            "range": "self",
            "rangeAPs": 0,
            "baseCost": 5,
            "totalCost": 5,
            "factorCost": 6,
            "aps": 0,
            "type": "dice",
            "useUnskilled": "true",
            "linked": false,
            "unskilled": true
        }
    }
    ];

    // create skills
    let skillIds = [];
    for (let i of skillsJson) {
      const itemData = { ...i };
      delete itemData._id;
      itemData.img =  itemData.img ? 'systems/megs/assets/images/icons/skillls/' + itemData.img : 'systems/megs/assets/images/icons/skillls/skill.png';
      const item = await MEGSItem.create(itemData, {});
      skillIds.push(item._id);
    }
    const skills = await Promise.all(skillIds.map(async (i) => (await game.items.get(i)).toObject()));
    this.updateSource({ items: skills });
    for (let itemId of skillIds) {
      game.items.get(itemId).delete();
    }
  
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
