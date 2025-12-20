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
                            isTrained: true,
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

        // Ensure attributes exist and have valid values (for actors created before template updates)
        if (!this.system.attributes) {
            this.system.attributes = {};
        }

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

        for (const [key, defaultAttr] of Object.entries(defaultAttributes)) {
            if (!this.system.attributes[key]) {
                this.system.attributes[key] = { ...defaultAttr };
            } else if (this.system.attributes[key].value === undefined || this.system.attributes[key].value === null) {
                this.system.attributes[key].value = 0;
            }
        }

        // Ensure current condition tracks exist
        if (!this.system.currentBody) {
            this.system.currentBody = { value: 0, min: 0, max: 60 };
        }
        if (!this.system.currentMind) {
            this.system.currentMind = { value: 0, min: 0, max: 60 };
        }
        if (!this.system.currentSpirit) {
            this.system.currentSpirit = { value: 0, min: 0, max: 60 };
        }

        // Ensure creation budget exists
        if (!this.system.creationBudget) {
            this.system.creationBudget = { base: 450 };
        }
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

        // Recalculate costs for powers/skills with modifiers
        this._recalculateItemCosts();

        // Calculate Hero Point budget and spending
        this._calculateHeroPointBudget();

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
     * Recalculate item costs for powers and skills, accounting for modifiers
     * This must run before _calculateHeroPointBudget() to ensure accurate costs
     */
    _recalculateItemCosts() {
        if (!this.items) return;

        // Get all powers and skills (subskills no longer have costs)
        const itemsWithCosts = this.items.filter(item =>
            (item.type === MEGS.itemTypes.power || item.type === MEGS.itemTypes.skill) &&
            item.system.hasOwnProperty('baseCost') &&
            item.system.hasOwnProperty('factorCost') &&
            item.system.hasOwnProperty('aps')
        );

        itemsWithCosts.forEach(item => {
            const systemData = item.system;

            // Calculate effective Factor Cost
            let effectiveFC = systemData.factorCost || 0;

            // Special handling for skills: reduce FC based on unchecked subskills
            if (item.type === MEGS.itemTypes.skill) {
                // Count unchecked subskills (isTrained = false or undefined)
                const uncheckedCount = this.items.filter(i =>
                    i.type === MEGS.itemTypes.subskill &&
                    i.system.parent === item._id &&
                    !i.system.isTrained
                ).length;

                // Reduced FC = Base FC - unchecked subskills
                effectiveFC = Math.max(1, effectiveFC - uncheckedCount);
            }

            // Apply linking reduction (-2, minimum 1) for powers
            if (item.type === MEGS.itemTypes.power && (systemData.isLinked === 'true' || systemData.isLinked === true)) {
                effectiveFC = Math.max(1, effectiveFC - 2);
            }

            // Add modifiers from bonuses/limitations (powers only)
            if (item.type === MEGS.itemTypes.power) {
                this.items.forEach(modifier => {
                    if ((modifier.type === MEGS.itemTypes.bonus || modifier.type === MEGS.itemTypes.limitation) &&
                        modifier.system.parent === item._id &&
                        modifier.system.factorCostMod) {
                        effectiveFC += modifier.system.factorCostMod;
                    }
                });
            }

            // Ensure minimum FC of 1
            effectiveFC = Math.max(1, effectiveFC);

            // Calculate total cost
            if ((systemData.aps || 0) === 0) {
                systemData.totalCost = 0;
            } else {
                const apCost = (MEGS.getAPCost && typeof MEGS.getAPCost === 'function')
                    ? MEGS.getAPCost(systemData.aps || 0, effectiveFC)
                    : (effectiveFC * (systemData.aps || 0)); // Fallback
                systemData.totalCost = systemData.baseCost + apCost;
            }
        });
    }

    /**
     * Calculate Hero Point budget tracking for character creation
     */
    _calculateHeroPointBudget() {
        // Base budget from character creation (defaults to 450 HP for standard characters)
        const baseBudget = this.system.creationBudget?.base ?? 450;

        // Calculate HP spent on attributes
        let attributesCost = 0;
        const attributes = this.system.attributes;

        if (attributes) {
            // Physical attributes
            attributesCost += MEGS.getAPCost(attributes.dex?.value ?? 0, 7) || 0;  // DEX is FC 7
            attributesCost += MEGS.getAPCost(attributes.str?.value ?? 0, 6) || 0;  // STR is FC 6
            attributesCost += MEGS.getAPCost(attributes.body?.value ?? 0, 6) || 0; // BODY is FC 6

            // Mental attributes
            attributesCost += MEGS.getAPCost(attributes.int?.value ?? 0, 7) || 0;  // INT is FC 7
            attributesCost += MEGS.getAPCost(attributes.will?.value ?? 0, 6) || 0; // WILL is FC 6
            attributesCost += MEGS.getAPCost(attributes.mind?.value ?? 0, 6) || 0; // MIND is FC 6

            // Mystical attributes
            attributesCost += MEGS.getAPCost(attributes.infl?.value ?? 0, 7) || 0;  // INFL is FC 7
            attributesCost += MEGS.getAPCost(attributes.aura?.value ?? 0, 6) || 0;  // AURA is FC 6
            attributesCost += MEGS.getAPCost(attributes.spirit?.value ?? 0, 6) || 0; // SPIRIT is FC 6
        }

        // Calculate HP spent on wealth (FC 2)
        const wealthCost = MEGS.getAPCost(this.system.wealth ?? 0, 2) || 0;

        // Calculate HP spent on items (powers, skills, advantages, gadgets, drawbacks)
        let itemsCost = 0;
        let powersCost = 0;
        let skillsCost = 0;
        let advantagesCost = 0;
        let gadgetsCost = 0;
        let drawbacksCost = 0;

        if (this.items) {
            this.items.forEach(item => {
                // Only count top-level items (child items are counted in their parent's cost)
                if (item.system.totalCost && item.type !== MEGS.itemTypes.subskill && !item.system.parent) {
                    let cost = item.system.totalCost;

                    // Ensure drawbacks are always negative (they reduce HP spent)
                    if (item.type === MEGS.itemTypes.drawback && cost > 0) {
                        cost = -cost;
                    }

                    // Track item types separately for character creator display
                    if (item.type === MEGS.itemTypes.power) {
                        powersCost += cost;
                    } else if (item.type === MEGS.itemTypes.skill) {
                        skillsCost += cost;
                    } else if (item.type === MEGS.itemTypes.advantage) {
                        advantagesCost += cost;
                    } else if (item.type === MEGS.itemTypes.gadget) {
                        gadgetsCost += cost;
                    } else if (item.type === MEGS.itemTypes.drawback) {
                        drawbacksCost += cost; // Negative value
                    }

                    // Add to total items cost (drawbacks will reduce it since they're negative)
                    itemsCost += cost;
                }
            });
        }

        // Calculate totals - drawbacks are already negative, so simple addition works
        const totalBudget = baseBudget;
        const totalSpent = attributesCost + wealthCost + itemsCost;
        const remaining = totalBudget - totalSpent;

        // Debug logging for HP budget calculation
        console.log(`HP Budget Debug for ${this.name}:`, {
            baseBudget,
            attributesCost,
            wealthCost,
            itemsCost,
            drawbacksCost,
            totalSpent,
            totalBudget,
            remaining,
            'Math check': `${totalBudget} - ${totalSpent} = ${totalBudget - totalSpent}`
        });

        // Calculate net traits cost (advantages + drawbacks, where drawbacks are negative)
        const traitsCost = advantagesCost + drawbacksCost;

        // Store in actor system data for display
        this.system.heroPointBudget = {
            base: baseBudget,
            drawbacks: drawbacksCost, // Negative value shows it reduces cost
            total: totalBudget,
            attributesCost: attributesCost,
            wealthCost: wealthCost,
            powersCost: powersCost,
            skillsCost: skillsCost,
            advantagesCost: advantagesCost,
            traitsCost: traitsCost,
            gadgetsCost: gadgetsCost,
            itemsCost: itemsCost,
            totalSpent: totalSpent,
            remaining: remaining
        };
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
