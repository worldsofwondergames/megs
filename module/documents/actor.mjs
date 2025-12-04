import { MEGS } from '../helpers/config.mjs';
import { MEGSItem } from './item.mjs';

/**
 * Extend the base Actor document by defining a custom roll data structure which is ideal for the Simple system.
 * @extends {Actor}
 */
export class MEGSActor extends Actor {
    async _preCreate(data, options, user) {
        await super._preCreate(data, options, user);

        if (this._stats.compendiumSource || this._stats.duplicateSource) return;

        await this._getSkills();
    }

    async _getSkills() {
        const skillsJson = await _loadData('systems/megs/assets/data/skills.json');

        let skills = [];
        let subskills = [];
        for (let i of skillsJson) {
            i.img = i.img
                ? 'systems/megs/assets/images/icons/skillls/' + i.img
                : 'systems/megs/assets/images/icons/skillls/skill.png';
            const item = { ...new MEGSItem(i) };
            delete item.system.subskills;
            delete item._id;
            delete item.effects;
            skills.push(item);

            if (i.system.subskills) {
                for (let j of i.system.subskills) {
                    const subskillObj = {
                        name: j.name,
                        type: 'subskill',
                        img: j.img
                            ? 'systems/megs/assets/images/icons/subskillls/' + j.img
                            : 'systems/megs/assets/images/icons/skillls/skill.png',
                        system: {
                            baseCost: 0,
                            totalCost: 0,
                            factorCost: 0,
                            aps: 0,
                            parent: '',
                            type: j.type,
                            linkedSkill: i.name,
                            useUnskilled: j.useUnskilled,
                        },
                    };
                    subskills.push(subskillObj);
                }
            }
        }

        this.updateSource({ items: skills });

        let actorSkills = {};
        this.items.forEach((skill) => {
            actorSkills[skill.name] = skill._id;
        });

        for (let i of subskills) {
            i.system.parent = actorSkills[i.system.linkedSkill];
        }
        this.updateSource({ items: subskills });
    }

    /** @override */
    prepareData() {
        // Prepare data for the actor. Calling the super version of this executes
        // the following, in order: data reset (to clear active effects),
        // prepareBaseData(), prepareEmbeddedDocuments() (including active effects),
        // prepareDerivedData().
        super.prepareData();

        if (this.items) {
            this.items.forEach((item) => {
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

        if (this.type === MEGS.characterTypes.hero || this.type === MEGS.characterTypes.villain) {
            const merge = (a, b, predicate = (a, b) => a === b) => {
                const c = [...a]; // copy to avoid side effects
                // add all items from B to copy C if they're not already present
                b.forEach((bItem) =>
                    c.some((cItem) => predicate(bItem, cItem)) ? null : c.push(bItem)
                );
                return c;
            };
            this.system.motivations = merge(
                CONFIG.motivations[this.type],
                CONFIG.motivations.antihero
            );
        }
    }

    /**
     *
     * @returns
     */
    _calculateInitiativeBonus() {
        // TODO replace all of this with effects?

        // calculate initiativeBonus
        let initiativeBonus =
            this.system.attributes.dex.value +
            this.system.attributes.int.value +
            this.system.attributes.infl.value;

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
        array.forEach((attribute) => {
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
        array.forEach((attribute) => {
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
