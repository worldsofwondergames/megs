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
    toObject(source = true) {
        const data = super.toObject(source);

        if (this.type === MEGS.itemTypes.gadget) {
            if (this.parent) {
                // Gadget on character - serialize child items
                if (MEGS.debug.enabled) {
                    console.log(`[MEGS] toObject() called for gadget ${this.name} on actor ${this.parent.name}`);
                }

                const skillData = {};
                const subskillData = {};
                const subskillTrainingData = {};
                // Flatten power data to primitives only (like skills)
                const powerAPs = {};
                const powerBaseCosts = {};
                const powerFactorCosts = {};
                const powerRanges = {};
                const powerIsLinked = {};
                const powerLinks = {};
                const traitData = {};

                // Get all child items
                const childItems = this.parent.items.filter(i => i.system.parent === this.id);
                if (MEGS.debug.enabled) {
                    console.log(`[MEGS] Found ${childItems.length} child items to serialize`);
                }

                for (let item of childItems) {
                    if (item.type === MEGS.itemTypes.skill) {
                        skillData[item.name] = item.system.aps;
                    } else if (item.type === MEGS.itemTypes.subskill) {
                        subskillData[item.name] = item.system.aps;
                        // Preserve training status
                        subskillTrainingData[item.name] = item.system.isTrained;
                    } else if (item.type === MEGS.itemTypes.power) {
                        if (MEGS.debug.enabled) {
                            console.log(`[MEGS] Serializing power: ${item.name}`);
                        }
                        // Store each property in separate flat fields (primitives only)
                        powerAPs[item.name] = item.system.aps || 0;
                        powerBaseCosts[item.name] = item.system.baseCost || 0;
                        powerFactorCosts[item.name] = item.system.factorCost || 0;
                        powerRanges[item.name] = item.system.range || '';
                        powerIsLinked[item.name] = item.system.isLinked || false;
                        powerLinks[item.name] = item.system.link || '';
                    } else if (item.type === MEGS.itemTypes.advantage || item.type === MEGS.itemTypes.drawback) {
                        if (MEGS.debug.enabled) {
                            console.log(`[MEGS] Serializing trait: ${item.name}`);
                        }
                        // Store full trait data as object (matching item-sheet format)
                        traitData[item.name] = {
                            name: item.name,
                            type: item.type,
                            img: item.img,
                            system: {
                                baseCost: item.system.baseCost || 0,
                                text: item.system.text || ''
                            }
                        };
                    }
                }

                if (MEGS.debug.enabled) {
                    console.log(`[MEGS] Serialized ${Object.keys(powerAPs).length} powers, ${Object.keys(skillData).length} skills`);
                }

                // Store in both FLAGS and system
                // FLAGS preserves data when dragging to sidebar, system for in-world items
                data.flags = data.flags || {};
                data.flags.megs = data.flags.megs || {};
                data.flags.megs._transferData = {
                    skillData: skillData,
                    subskillData: subskillData,
                    subskillTrainingData: subskillTrainingData,
                    powerAPs: powerAPs,
                    powerBaseCosts: powerBaseCosts,
                    powerFactorCosts: powerFactorCosts,
                    powerRanges: powerRanges,
                    powerIsLinked: powerIsLinked,
                    powerLinks: powerLinks,
                    traitData: traitData
                };

                // Also store in system for direct access
                data.system.skillData = skillData;
                data.system.subskillData = subskillData;
                data.system.subskillTrainingData = subskillTrainingData;
                data.system.powerAPs = powerAPs;
                data.system.powerBaseCosts = powerBaseCosts;
                data.system.powerFactorCosts = powerFactorCosts;
                data.system.powerRanges = powerRanges;
                data.system.powerIsLinked = powerIsLinked;
                data.system.powerLinks = powerLinks;
                data.system.traitData = traitData;
            } else {
                // Standalone gadget - ensure virtual data is preserved during drag
                if (MEGS.debug.enabled) {
                    console.log(`[MEGS] toObject() called for standalone gadget ${this.name}`);
                    console.log(`[MEGS] Preserving powerAPs:`, Object.keys(this.system.powerAPs || {}).length);
                    console.log(`[MEGS] Preserving skillData:`, Object.keys(this.system.skillData || {}).length);
                    console.log(`[MEGS] powerAPs data:`, this.system.powerAPs);
                    console.log(`[MEGS] skillData data:`, this.system.skillData);
                }

                // Store in FLAGS during drag - Foundry strips system data when creating on actors
                // but preserves flags, then _onCreate will move to system
                data.flags = data.flags || {};
                data.flags.megs = data.flags.megs || {};
                data.flags.megs._transferData = {
                    skillData: this.system.skillData || {},
                    subskillData: this.system.subskillData || {},
                    subskillTrainingData: this.system.subskillTrainingData || {},
                    powerAPs: this.system.powerAPs || {},
                    powerBaseCosts: this.system.powerBaseCosts || {},
                    powerFactorCosts: this.system.powerFactorCosts || {},
                    powerRanges: this.system.powerRanges || {},
                    powerIsLinked: this.system.powerIsLinked || {},
                    powerLinks: this.system.powerLinks || {},
                    traitData: this.system.traitData || {}
                };

                // Also keep in system for standalone gadgets
                data.system.skillData = this.system.skillData || {};
                data.system.subskillData = this.system.subskillData || {};
                data.system.subskillTrainingData = this.system.subskillTrainingData || {};
                data.system.powerAPs = this.system.powerAPs || {};
                data.system.powerBaseCosts = this.system.powerBaseCosts || {};
                data.system.powerFactorCosts = this.system.powerFactorCosts || {};
                data.system.powerRanges = this.system.powerRanges || {};
                data.system.powerIsLinked = this.system.powerIsLinked || {};
                data.system.powerLinks = this.system.powerLinks || {};
                data.system.traitData = this.system.traitData || {};
            }
        }

        return data;
    }

    /** @override */
    async _preCreate(data, options, userId) {
        await super._preCreate(data, options, userId);

        // For gadgets being created on actors, check if we have power/skill data in the source
        if (this.type === MEGS.itemTypes.gadget && data.flags?.megs?._transferData) {
            const transferData = data.flags.megs._transferData;
            if (MEGS.debug.enabled) {
                console.log(`[MEGS] _preCreate: Found transfer data in creation data`);
                console.log(`[MEGS] _preCreate powerAPs:`, transferData.powerAPs);
                console.log(`[MEGS] _preCreate skillData:`, transferData.skillData);
            }

            // Store in a global temporary cache that _onCreate can access
            if (!globalThis.MEGS_TRANSFER_CACHE) globalThis.MEGS_TRANSFER_CACHE = {};
            // Use the item ID as the cache key since it's available
            const cacheKey = this.id;
            globalThis.MEGS_TRANSFER_CACHE[cacheKey] = transferData;

            if (MEGS.debug.enabled) {
                console.log(`[MEGS] _preCreate: Stored data in global cache with item ID:`, cacheKey);
            }
        }
    }

    /** @override */
    async _onCreate(data, options, userId) {
        await super._onCreate(data, options, userId);

        // Only process new gadgets
        if (this.type !== MEGS.itemTypes.gadget) return;

        if (this.parent) {
            if (MEGS.debug.enabled) {
                console.log(`[MEGS] Gadget ${this.name} (${this.id}) added to actor ${this.parent.name}`);
            }

            // Check if we have a cache key from the preCreateItem hook (passed via options)
            let transferData = null;
            const cacheKey = options.megsCacheKey;

            if (cacheKey && globalThis.MEGS_TRANSFER_CACHE?.[cacheKey]) {
                const cached = globalThis.MEGS_TRANSFER_CACHE[cacheKey];
                transferData = cached.transferData;
                if (MEGS.debug.enabled) {
                    console.log(`[MEGS] Retrieved transfer data from global cache using options key:`, cacheKey);
                    console.log(`[MEGS] Cache powerAPs:`, transferData.powerAPs);
                    console.log(`[MEGS] Cache skillData:`, transferData.skillData);
                }
                // Clean up the cache
                delete globalThis.MEGS_TRANSFER_CACHE[cacheKey];
            } else {
                if (MEGS.debug.enabled) {
                    console.log(`[MEGS] No cache key in options. Key:`, cacheKey);
                    console.log(`[MEGS] Global cache keys:`, Object.keys(globalThis.MEGS_TRANSFER_CACHE || {}));
                }
            }

            if (transferData) {
                if (MEGS.debug.enabled) {
                    console.log(`[MEGS] Found transfer data in flags, restoring to system`);
                    console.log(`[MEGS] - powerAPs:`, Object.keys(transferData.powerAPs || {}).length);
                    console.log(`[MEGS] - skillData:`, Object.keys(transferData.skillData || {}).length);
                }

                // Update system fields with transfer data
                // Note: We update this.system directly first, then persist to DB
                this.system.skillData = transferData.skillData || {};
                this.system.subskillData = transferData.subskillData || {};
                this.system.subskillTrainingData = transferData.subskillTrainingData || {};
                this.system.powerAPs = transferData.powerAPs || {};
                this.system.powerBaseCosts = transferData.powerBaseCosts || {};
                this.system.powerFactorCosts = transferData.powerFactorCosts || {};
                this.system.powerRanges = transferData.powerRanges || {};
                this.system.powerIsLinked = transferData.powerIsLinked || {};
                this.system.powerLinks = transferData.powerLinks || {};
                this.system.traitData = transferData.traitData || {};

                // Persist to database and remove transfer flag
                await this.update({
                    'system.skillData': this.system.skillData,
                    'system.subskillData': this.system.subskillData,
                    'system.subskillTrainingData': this.system.subskillTrainingData,
                    'system.powerAPs': this.system.powerAPs,
                    'system.powerBaseCosts': this.system.powerBaseCosts,
                    'system.powerFactorCosts': this.system.powerFactorCosts,
                    'system.powerRanges': this.system.powerRanges,
                    'system.powerIsLinked': this.system.powerIsLinked,
                    'system.powerLinks': this.system.powerLinks,
                    'system.traitData': this.system.traitData,
                    'flags.megs.-=_transferData': null  // Remove transfer flag
                });
                if (MEGS.debug.enabled) {
                    console.log(`[MEGS] Transfer complete, data restored to system`);
                }
            }

            if (MEGS.debug.enabled) {
                console.log(`[MEGS] powerAPs keys:`, Object.keys(this.system.powerAPs || {}));
                console.log(`[MEGS] skillData keys:`, Object.keys(this.system.skillData || {}));
            }

            // Gadget owned by actor - create actual skill, power, and trait items
            const existingItems = this.parent.items.filter(i => i.system.parent === this.id);
            if (MEGS.debug.enabled) {
                console.log(`[MEGS] Found ${existingItems.length} existing child items`);
            }
            if (existingItems.length > 0) return;

            await this._addSkillsToGadget();
            await this._addPowersToGadget();
            await this._addTraitsToGadget();
        } else {
            if (MEGS.debug.enabled) {
                console.log(`[MEGS] Standalone gadget ${this.name} (${this.id}) created`);
                console.log(`[MEGS] Existing powerAPs:`, Object.keys(this.system.powerAPs || {}).length);
                console.log(`[MEGS] Existing skillData:`, Object.keys(this.system.skillData || {}).length);
            }

            // Standalone gadget - initialize skillData only if not already populated
            // (data comes from toObject() when dragging from character to sidebar)
            const hasPowerData = this.system.powerAPs && Object.keys(this.system.powerAPs).length > 0;
            const hasSkillData = this.system.skillData && Object.keys(this.system.skillData).length > 0;

            if (!hasPowerData && !hasSkillData) {
                if (MEGS.debug.enabled) {
                    console.log(`[MEGS] No existing data found, initializing with defaults`);
                }
                await this._initializeSkillData();
            } else {
                if (MEGS.debug.enabled) {
                    console.log(`[MEGS] Existing data found (from toObject), persisting to database`);
                }
                // Data came from toObject() but needs to be explicitly saved
                await this.update({
                    'system.skillData': this.system.skillData || {},
                    'system.subskillData': this.system.subskillData || {},
                    'system.subskillTrainingData': this.system.subskillTrainingData || {},
                    'system.powerAPs': this.system.powerAPs || {},
                    'system.powerBaseCosts': this.system.powerBaseCosts || {},
                    'system.powerFactorCosts': this.system.powerFactorCosts || {},
                    'system.powerRanges': this.system.powerRanges || {},
                    'system.powerIsLinked': this.system.powerIsLinked || {},
                    'system.powerLinks': this.system.powerLinks || {},
                    'system.traitData': this.system.traitData || {}
                });
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
        // Get virtual power data from flattened system fields
        const powerAPs = this.system.powerAPs || {};
        const powerBaseCosts = this.system.powerBaseCosts || {};
        const powerFactorCosts = this.system.powerFactorCosts || {};
        const powerRanges = this.system.powerRanges || {};
        const powerIsLinked = this.system.powerIsLinked || {};
        const powerLinks = this.system.powerLinks || {};

        if (MEGS.debug.enabled) {
            console.log(`[MEGS] _addPowersToGadget called for ${this.name}, found ${Object.keys(powerAPs).length} powers`);
        }

        // If no powers to add, return early
        if (Object.keys(powerAPs).length === 0) return;

        let powers = [];

        // Iterate over power names
        for (let powerName in powerAPs) {
            if (MEGS.debug.enabled) {
                console.log(`[MEGS] Adding power: ${powerName}`);
            }
            const powerObj = {
                name: powerName,
                type: 'power',
                img: 'systems/megs/assets/images/icons/power.png',
                system: {
                    parent: this.id,  // Set parent to this gadget's ID
                    aps: powerAPs[powerName] || 0,
                    baseCost: powerBaseCosts[powerName] || 0,
                    factorCost: powerFactorCosts[powerName] || 0,
                    range: powerRanges[powerName] || '',
                    isLinked: powerIsLinked[powerName] || false,
                    link: powerLinks[powerName] || ''
                }
            };
            powers.push(powerObj);
        }

        // Create powers on the parent actor
        if (MEGS.debug.enabled) {
            console.log(`[MEGS] Creating ${powers.length} power items on actor`);
        }
        await this.parent.createEmbeddedDocuments('Item', powers);
    }

    async _addTraitsToGadget() {
        // Get virtual trait data from system (same as skills)
        const traitData = this.system.traitData || {};

        // If no traits to add, return early
        if (Object.keys(traitData).length === 0) return;

        let traits = [];

        // Iterate over trait keys (keys may include timestamp for uniqueness)
        for (let traitKey in traitData) {
            const trait = traitData[traitKey];
            const traitObj = {
                name: trait.name || traitKey,  // Use trait.name if available, fallback to key
                type: trait.type || 'advantage',
                img: trait.img || (trait.type === 'drawback' ? 'icons/svg/degen.svg' : 'icons/svg/regen.svg'),
                system: {
                    parent: this.id,  // Set parent to this gadget's ID
                    baseCost: trait.system?.baseCost || trait.baseCost || 0,  // Handle both formats
                    text: trait.system?.text || trait.text || ''  // Handle both formats
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
