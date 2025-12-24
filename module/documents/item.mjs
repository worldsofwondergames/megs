import { MEGS } from '../helpers/config.mjs';
import { MegsTableRolls, RollValues } from '../dice.mjs';
import { Utils } from '../utils.js';

/**
 * Extend the basic Item with some very simple modifications.
 * @extends {Item}
 */
export class MEGSItem extends Item {
    /** @override */
    constructor(data, context) {
        super(data, context);
    }

    /** @override */
    async _preCreate(data, options, user) {
        await super._preCreate(data, options, user);

        // Log creation data for all gadgets
        if (this.type === MEGS.itemTypes.gadget) {
            const hasParent = !!this.parent;
            const parentName = this.parent?.name || 'none';
            const flagsData = data.flags?.megs?.powerData || [];
            console.log(`[MEGS] _preCreate for gadget, parent: ${parentName}`);
            console.log(`[MEGS] - flags.megs.powerData in creation data:`, flagsData.length);
            console.log(`[MEGS] - Full flags object:`, data.flags);
        }
    }

    /** @override */
    toObject(source = true) {
        const data = super.toObject(source);

        // If this is a gadget with a parent (on a character), serialize child items
        if (this.type === MEGS.itemTypes.gadget && this.parent) {
            console.log(`[MEGS] toObject() called for gadget ${this.name} on actor ${this.parent.name}`);

            const skillData = {};
            const subskillData = {};
            const subskillTrainingData = {};
            const powerData = [];  // Changed to array
            const traitData = [];  // Changed to array

            // Get all child items
            const childItems = this.parent.items.filter(i => i.system.parent === this.id);
            console.log(`[MEGS] Found ${childItems.length} child items to serialize`);

            for (let item of childItems) {
                if (item.type === MEGS.itemTypes.skill) {
                    skillData[item.name] = item.system.aps;
                } else if (item.type === MEGS.itemTypes.subskill) {
                    subskillData[item.name] = item.system.aps;
                    // Preserve training status
                    subskillTrainingData[item.name] = item.system.isTrained;
                } else if (item.type === MEGS.itemTypes.power) {
                    console.log(`[MEGS] Serializing power: ${item.name}`);
                    // Store ONLY essential data, not the entire complex system object
                    // System field has too many nested structures that get stripped
                    powerData.push({
                        id: item.id,
                        name: item.name,
                        type: item.type,
                        img: item.img,
                        // Store only the key system fields we need
                        aps: item.system.aps,
                        baseCost: item.system.baseCost,
                        factorCost: item.system.factorCost,
                        powerType: item.system.powerType,
                        powerSource: item.system.powerSource,
                        range: item.system.range,
                        isLinked: item.system.isLinked,
                        link: item.system.link
                    });
                } else if (item.type === MEGS.itemTypes.advantage || item.type === MEGS.itemTypes.drawback) {
                    console.log(`[MEGS] Serializing trait: ${item.name}`);
                    // Store as array element
                    const itemData = item.toObject();
                    traitData.push({
                        id: item.id,
                        name: itemData.name,
                        type: itemData.type,
                        img: itemData.img,
                        system: itemData.system
                    });
                }
            }

            console.log(`[MEGS] Serialized ${powerData.length} powers, ${Object.keys(skillData).length} skills`);

            // Store complex data in flags instead of system - Foundry strips complex objects from system
            // Flags are designed for arbitrary data and bypass schema validation
            data.flags = data.flags || {};
            data.flags.megs = data.flags.megs || {};
            data.flags.megs.powerData = powerData;
            data.flags.megs.traitData = traitData;

            // Simple key-value data can stay in system
            data.system.skillData = skillData;
            data.system.subskillData = subskillData;
            data.system.subskillTrainingData = subskillTrainingData;
        }

        return data;
    }

    /** @override */
    async _onCreate(data, options, userId) {
        await super._onCreate(data, options, userId);

        // Only process new gadgets
        if (this.type !== MEGS.itemTypes.gadget) return;

        if (this.parent) {
            console.log(`[MEGS] Gadget ${this.name} (${this.id}) added to actor ${this.parent.name}`);
            const flagPowerData = this.getFlag('megs', 'powerData') || [];
            console.log(`[MEGS] powerData in flags:`, flagPowerData.length);
            console.log(`[MEGS] skillData keys:`, Object.keys(this.system.skillData || {}));

            // Gadget owned by actor - create actual skill, power, and trait items
            const existingItems = this.parent.items.filter(i => i.system.parent === this.id);
            console.log(`[MEGS] Found ${existingItems.length} existing child items`);
            if (existingItems.length > 0) return;

            await this._addSkillsToGadget();
            await this._addPowersToGadget();
            await this._addTraitsToGadget();
        } else {
            console.log(`[MEGS] Standalone gadget ${this.name} (${this.id}) created, duplicateSource:`, this._stats.duplicateSource);
            const flagPowerData = this.getFlag('megs', 'powerData') || [];
            console.log(`[MEGS] Existing powerData in flags:`, flagPowerData.length);
            console.log(`[MEGS] Existing skillData:`, Object.keys(this.system.skillData || {}).length);

            // Standalone gadget - initialize skillData/subskillData only if not already populated
            // (e.g., from toObject() when dragging from character to sidebar)
            const hasPowerData = flagPowerData.length > 0;
            const hasSkillData = this.system.skillData && Object.keys(this.system.skillData).length > 0;

            if (!hasPowerData && !hasSkillData) {
                console.log(`[MEGS] No existing data found, initializing with defaults`);
                await this._initializeSkillData();
            } else {
                console.log(`[MEGS] Existing data found, preserving it`);
                // The data from toObject() is in memory but needs to be persisted to the database
                // This ensures it's saved and available when the gadget is later dragged to a character
                const updateData = {};
                if (this.system.powerData) updateData['system.powerData'] = this.system.powerData;
                if (this.system.skillData) updateData['system.skillData'] = this.system.skillData;
                if (this.system.subskillData) updateData['system.subskillData'] = this.system.subskillData;
                if (this.system.subskillTrainingData) updateData['system.subskillTrainingData'] = this.system.subskillTrainingData;
                if (this.system.traitData) updateData['system.traitData'] = this.system.traitData;

                if (Object.keys(updateData).length > 0) {
                    console.log(`[MEGS] Persisting data to database:`, Object.keys(updateData));
                    console.log(`[MEGS] powerData being saved:`, Object.keys(this.system.powerData || {}).length, 'powers');
                    await this.update(updateData);
                    console.log(`[MEGS] Update complete. Verifying data...`);
                    console.log(`[MEGS] After update - powerData:`, Object.keys(this.system.powerData || {}).length);
                    console.log(`[MEGS] After update - skillData:`, Object.keys(this.system.skillData || {}).length);
                }
            }
        }
    }

    /** @override */
    async _onUpdate(changed, options, userId) {
        await super._onUpdate(changed, options, userId);

        // When a skill's APs reach 0, set all subskills to isTrained = true
        if (this.type === MEGS.itemTypes.skill && changed.system?.aps === 0 && this.parent) {
            const subskills = this.parent.items.filter(i =>
                i.type === MEGS.itemTypes.subskill && i.system.parent === this.id
            );

            // Update all subskills to trained
            const updates = subskills.map(subskill => ({
                _id: subskill.id,
                'system.isTrained': true
            }));

            if (updates.length > 0) {
                await this.parent.updateEmbeddedDocuments('Item', updates);
            }
        }
    }


    async _initializeSkillData() {
        const skillsJson = await _loadData('systems/megs/assets/data/skills.json');

        const skillData = {};
        const subskillData = {};

        for (let skill of skillsJson) {
            // Initialize skill with 0 APs
            skillData[skill.name] = 0;

            // Initialize subskills with 0 APs
            if (skill.system.subskills) {
                for (let subskill of skill.system.subskills) {
                    subskillData[subskill.name] = 0;
                }
            }
        }

        await this.update({
            'system.skillData': skillData,
            'system.subskillData': subskillData
        });
    }

    async _addSkillsToGadget() {
        const skillsJson = await _loadData('systems/megs/assets/data/skills.json');

        // Get virtual skill data if it exists
        const skillData = this.system.skillData || {};
        const subskillData = this.system.subskillData || {};
        const subskillTrainingData = this.system.subskillTrainingData || {};

        let skills = [];
        let subskills = [];

        for (let i of skillsJson) {
            const skillImg = i.img
                ? 'systems/megs/assets/images/icons/skillls/' + i.img
                : 'systems/megs/assets/images/icons/skillls/skill.png';
            const item = { ...new MEGSItem(i) };
            delete item.system.subskills;
            delete item._id;
            delete item.effects;
            // Set parent to this gadget's ID
            item.system.parent = this.id;
            // Use virtual skill APs if available, otherwise default to 0
            item.system.aps = skillData[i.name] || 0;
            // Ensure the correct icon is set
            item.img = skillImg;
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
                            aps: subskillData[j.name] || 0,
                            parent: '', // Will be set after skills are created
                            type: j.type,
                            linkedSkill: i.name,
                            useUnskilled: j.useUnskilled,
                            isTrained: subskillTrainingData[j.name] !== undefined ? subskillTrainingData[j.name] : true,
                        },
                    };
                    subskills.push(subskillObj);
                }
            }
        }

        // Create skills on the parent actor
        const createdSkills = await this.parent.createEmbeddedDocuments('Item', skills);

        // Now link subskills to their parent skills
        let skillMap = {};
        createdSkills.forEach((skill) => {
            skillMap[skill.name] = skill.id;
        });

        for (let i of subskills) {
            i.system.parent = skillMap[i.system.linkedSkill];
        }

        // Create subskills on the parent actor
        await this.parent.createEmbeddedDocuments('Item', subskills);
    }

    async _addPowersToGadget() {
        // Get virtual power data from flags (complex data)
        const powerData = this.getFlag('megs', 'powerData') || [];

        console.log(`[MEGS] _addPowersToGadget called for ${this.name}, found ${powerData.length} powers`);

        // If no powers to add, return early
        if (powerData.length === 0) return;

        let powers = [];

        for (let power of powerData) {
            console.log(`[MEGS] Adding power: ${power.name}`);
            const powerObj = {
                name: power.name,
                type: power.type || 'power',
                img: power.img || Item.DEFAULT_ICON,
                system: {
                    parent: this.id,  // Set parent to this gadget's ID
                    aps: power.aps || 0,
                    baseCost: power.baseCost || 0,
                    factorCost: power.factorCost || 0,
                    powerType: power.powerType || '',
                    powerSource: power.powerSource || '',
                    range: power.range || '',
                    isLinked: power.isLinked || false,
                    link: power.link || ''
                }
            };
            powers.push(powerObj);
        }

        // Create powers on the parent actor
        console.log(`[MEGS] Creating ${powers.length} power items on actor`);
        await this.parent.createEmbeddedDocuments('Item', powers);
    }

    async _addTraitsToGadget() {
        // Get virtual trait data from flags (complex data)
        const traitData = this.getFlag('megs', 'traitData') || [];

        // If no traits to add, return early
        if (traitData.length === 0) return;

        let traits = [];

        for (let trait of traitData) {
            const traitObj = {
                name: trait.name,
                type: trait.type,
                img: trait.img || Item.DEFAULT_ICON,
                system: {
                    ...trait.system,
                    parent: this.id  // Set parent to this gadget's ID
                }
            };
            traits.push(traitObj);
        }

        // Create traits on the parent actor
        await this.parent.createEmbeddedDocuments('Item', traits);
    }

    /**
     * Get Factor Cost modifier based on Reliability Number
     * @param {number} reliability - The R# value
     * @returns {number} Factor Cost modifier
     * @private
     */
    _getReliabilityModifier(reliability) {
        const reliabilityTable = {
            0: 3,
            2: 2,
            3: 1,
            5: 0,
            7: -1,
            9: -2,
            11: -3
        };
        return reliabilityTable[reliability] ?? 0;
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
        if (itemData.img === 'icons/svg/item-bag.svg') {
            if (systemData.img !== '') {
                this.img = systemData.img;
            }
        }

        // Import constants for all item types (including subskills)
        systemData.powerTypes = MEGS.powerTypes;
        systemData.powerSources = MEGS.powerSources;
        systemData.ranges = MEGS.ranges;
        systemData.yesNoOptions = MEGS.yesNoOptions;

        systemData.attributesForLink = {};
        for (const [key, value] of Object.entries(MEGS.attributeLabels)) {
            systemData.attributesForLink[key] = game.i18n.localize(value);
        }

        // Subskills don't have costs - skip all cost calculations
        if (this.type === MEGS.itemTypes.subskill) {
            return;
        }

        // Calculate gadget total cost
        if (this.type === MEGS.itemTypes.gadget) {
            let totalCost = 0;

            // Get Reliability Number modifier for Factor Cost
            // reliability is stored as an index into CONFIG.reliabilityScores array
            const reliabilityIndex = systemData.reliability ?? 3; // Default to index 3 (R# 5)
            const reliability = CONFIG.reliabilityScores?.[reliabilityIndex] ?? 5;
            const reliabilityMod = this._getReliabilityModifier(reliability);

            if (MEGS.debug.enabled) {
                console.log(`[${this.name}] Cost Calculation - Reliability Index: ${reliabilityIndex}, R#: ${reliability}, Mod: ${reliabilityMod}`);
            }

            // Calculate attribute costs
            if (systemData.attributes) {
                for (const [key, attr] of Object.entries(systemData.attributes)) {
                    if (attr.value > 0) {
                        if (MEGS.debug.enabled) {
                            console.log(`  ${key.toUpperCase()}: value=${attr.value}, base FC=${attr.factorCost}`);
                        }
                        let fc = attr.factorCost + reliabilityMod;
                        if (MEGS.debug.enabled) {
                            console.log(`    After reliability mod: FC=${fc}`);
                        }

                        // Italicized attributes (alwaysSubstitute) add +2 FC
                        if (attr.alwaysSubstitute) {
                            fc += 2;
                            if (MEGS.debug.enabled) {
                                console.log(`    +2 for alwaysSubstitute → FC=${fc}`);
                            }
                        }

                        // Hardened Defenses add +2 to BODY FC
                        if (key === 'body' && (systemData.hasHardenedDefenses === true || systemData.hasHardenedDefenses === 'true')) {
                            fc += 2;
                            if (MEGS.debug.enabled) {
                                console.log(`    +2 for Hardened Defenses → FC=${fc}`);
                            }
                        }

                        fc = Math.max(1, fc); // Minimum FC of 1
                        const attrCost = MEGS.getAPCost(attr.value, fc) || 0;
                        if (MEGS.debug.enabled) {
                            console.log(`    Final: ${attr.value} APs @ FC ${fc} = ${attrCost} HP`);
                        }
                        totalCost += attrCost;
                    }
                }
            }

            // Calculate AV cost (actionValue) - Base Cost 5, FC 1
            if (systemData.actionValue > 0) {
                const fc = Math.max(1, 1 + reliabilityMod);
                totalCost += 5; // Base cost
                totalCost += MEGS.getAPCost(systemData.actionValue, fc) || 0;
            }

            // Calculate EV cost (effectValue) - Base Cost 5, FC 1
            if (systemData.effectValue > 0) {
                const fc = Math.max(1, 1 + reliabilityMod);
                totalCost += 5; // Base cost
                totalCost += MEGS.getAPCost(systemData.effectValue, fc) || 0;
            }

            // Calculate Range cost (if exists) - Base Cost 5, FC 1
            // Check both systemData.range and systemData.weapon.range for compatibility
            const rangeValue = systemData.range || systemData.weapon?.range || 0;
            if (rangeValue > 0) {
                const fc = Math.max(1, 1 + reliabilityMod);
                totalCost += 5; // Base cost
                totalCost += MEGS.getAPCost(rangeValue, fc) || 0;
            }

            // Add child item costs (only direct children: powers, skills, advantages, drawbacks)
            // Bonuses, limitations, and subskills are counted as part of their parent item's cost
            if (MEGS.debug.enabled) {
                console.log(`  Checking for child items - has parent: ${!!this.parent}, has parent.items: ${!!this.parent?.items}`);
            }
            if (this.parent && this.parent.items) {
                if (MEGS.debug.enabled) {
                    console.log(`  Parent has ${this.parent.items.size} items`);
                }
                let childItemsFound = 0;
                this.parent.items.forEach(item => {
                    if (item.system.parent === this.id) {
                        childItemsFound++;

                        // Calculate cost directly for powers and skills (don't rely on totalCost being ready)
                        let itemCost = 0;
                        if ((item.type === MEGS.itemTypes.power || item.type === MEGS.itemTypes.skill) &&
                            item.system.aps > 0) {
                            // Check if factorCost is missing or invalid
                            if (item.system.factorCost === undefined || item.system.factorCost === null || item.system.factorCost === 0) {
                                console.error(`  ❌ ${item.name} has invalid factorCost: ${item.system.factorCost} (APs: ${item.system.aps})`);
                                if (MEGS.debug.enabled) {
                                    console.log(`     Full system data:`, item.system);
                                }
                            }

                            // Calculate effective FC (with linking bonus if applicable)
                            let effectiveFC = item.system.factorCost;
                            if (item.system.isLinked === 'true' || item.system.isLinked === true) {
                                effectiveFC = Math.max(1, effectiveFC - 2);
                            }
                            itemCost = (item.system.baseCost || 0) + (MEGS.getAPCost(item.system.aps, effectiveFC) || 0);
                        } else if (item.type === MEGS.itemTypes.advantage || item.type === MEGS.itemTypes.drawback) {
                            // For advantages/drawbacks, use their totalCost or baseCost
                            itemCost = item.system.totalCost || item.system.baseCost || 0;

                            // Ensure drawbacks are always negative
                            if (item.type === MEGS.itemTypes.drawback) {
                                if (itemCost === 0) {
                                    console.error(`Drawback "${item.name}" has zero cost - this is likely a configuration error`);
                                } else if (itemCost > 0) {
                                    itemCost = -itemCost;
                                }
                            }
                        }

                        if (MEGS.debug.enabled) {
                            console.log(`    Found child: ${item.name} (${item.type}) - calculated cost: ${itemCost}`);
                        }

                        // Add all child items (drawbacks are negative, so they reduce cost automatically)
                        if (item.type === MEGS.itemTypes.power ||
                            item.type === MEGS.itemTypes.skill ||
                            item.type === MEGS.itemTypes.advantage ||
                            item.type === MEGS.itemTypes.drawback) {
                            totalCost += itemCost;
                        }
                    }
                });
                if (MEGS.debug.enabled) {
                    console.log(`  Total child items found: ${childItemsFound}`);
                }
            } else {
                if (MEGS.debug.enabled) {
                    console.log(`  Cannot check child items - parent or parent.items not available`);
                }
            }

            // Apply Gadget Bonus (divide by 4 if can be Taken Away, 2 if cannot)
            const gadgetBonus = systemData.canBeTakenAway ? 4 : 2;
            if (MEGS.debug.enabled) {
                console.log(`  Subtotal: ${totalCost} HP`);
                console.log(`  Gadget Bonus: ÷${gadgetBonus}`);
            }
            totalCost = Math.ceil(totalCost / gadgetBonus);
            if (MEGS.debug.enabled) {
                console.log(`  Final Cost: ${totalCost} HP`);
            }

            systemData.totalCost = totalCost;
            this.totalCost = totalCost;
        }
        // Calculate total cost for powers, skills, advantages, drawbacks (but not gadgets or subskills)
        else if (systemData.hasOwnProperty('baseCost')) {
            if (systemData.hasOwnProperty('factorCost') && systemData.hasOwnProperty('aps')) {
                // Subskills don't have costs - skip validation and calculation for them
                // Only validate factorCost for actual powers and skills
                if (this.type !== MEGS.itemTypes.subskill &&
                    (systemData.factorCost === 0 || systemData.factorCost === undefined || systemData.factorCost === null)) {
                    console.error(`❌ ${this.name} (${this.type}) has invalid factorCost: ${systemData.factorCost}, APs: ${systemData.aps}`);
                }

                // For skills with subskills, calculate effective Factor Cost
                // Formula: Base Factor Cost - (Number of Untrained Subskills)
                let effectiveFC = systemData.factorCost;
                if (this.type === MEGS.itemTypes.skill && this.parent) {
                    const subskills = this.parent.items.filter(i =>
                        i.type === MEGS.itemTypes.subskill && i.system.parent === this.id
                    );
                    if (subskills.length > 0) {
                        const trainedCount = subskills.filter(s => s.system.isTrained).length;
                        const untrainedCount = subskills.length - trainedCount;
                        effectiveFC = systemData.factorCost - untrainedCount;
                    }
                }

                // Check if power/skill is linked to an attribute
                // Linking reduces Factor Cost by 2 (minimum 1)
                if (systemData.isLinked === 'true' || systemData.isLinked === true) {
                    effectiveFC = Math.max(1, effectiveFC - 2);
                }

                // Calculate total cost using AP Purchase Chart
                // If APs == 0: Total Cost = 0 (not purchased yet)
                // If APs > 0 and FC > 0: Total Cost = Base Cost + AP Purchase Chart(APs, Factor Cost)
                // If APs > 0 and FC == 0: Base cost only power (e.g., Self-Link)
                if ((systemData.aps || 0) === 0) {
                    systemData.totalCost = 0;
                } else if (effectiveFC > 0) {
                    // Use AP Purchase Chart for APs cost
                    const apCost = (MEGS.getAPCost && typeof MEGS.getAPCost === 'function')
                        ? MEGS.getAPCost(systemData.aps || 0, effectiveFC)
                        : (effectiveFC * (systemData.aps || 0)); // Fallback to linear if chart not available
                    systemData.totalCost = systemData.baseCost + apCost;
                } else {
                    // Base cost only power (no Factor Cost or FC is 0)
                    systemData.totalCost = systemData.baseCost || 0;
                }
            } else {
                systemData.totalCost = systemData.baseCost;
            }

            // Drawbacks should always have negative costs (they reduce HP spent)
            if (this.type === MEGS.itemTypes.drawback) {
                if (systemData.totalCost === 0) {
                    console.error(`Drawback "${this.name}" has zero cost - this is likely a configuration error`);
                } else if (systemData.totalCost > 0) {
                    // Positive cost, make it negative
                    systemData.totalCost = -systemData.totalCost;
                }
                // If already negative, leave it as-is
            }

            this.totalCost = systemData.totalCost;
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

        if (
            this.type === MEGS.itemTypes.skill ||
            this.type === MEGS.itemTypes.subskill ||
            this.type === MEGS.itemTypes.power
        ) {
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
                    console.error('No linked type for this item');
                }
            } else {
                console.error('No linked attribute for this item');
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
            label = this.parent.name + ' - ' + label;
        }

        console.info('Rolling from item.rollMegs()');
        const isUnskilled = this.system.aps === 0;
        const rollValues = new RollValues(
            label,
            this.type,
            this.system.aps,
            actionValue,
            opposingValue,
            effectValue,
            resistanceValue,
            '1d10 + 1d10',
            isUnskilled
        );
        const speaker = ChatMessage.getSpeaker({ actor: this.parent });
        const rollTables = new MegsTableRolls(rollValues, speaker);
        rollTables.roll(null, this.parent.system.heroPoints.value).then((response) => {
            // no handling happens
        });
    }

    /** @override */
    static async create(data, context = {}) {
        const createData = data instanceof Array ? data : [data];
        const created = await this.createDocuments(createData, context);
        return data instanceof Array ? created : created.shift();
    }

    /** @override */
    getEmbeddedCollection(embeddedName) {
        const collectionName = this.constructor.getCollectionName(embeddedName);
        if (!collectionName) {
            throw new Error(
                `${embeddedName} is not a valid embedded Document within the ${this.documentName} Document`
            );
        }
        const field = this.constructor.hierarchy[collectionName];
        return field.getCollection(this);
    }
}

async function _loadData(jsonPath) {
    const response = await fetch(jsonPath);
    const contents = await response.json();
    return contents;
}
