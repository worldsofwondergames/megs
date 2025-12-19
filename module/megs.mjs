// Import document classes.
import { MEGSActor } from './documents/actor.mjs';
import { MEGSItem } from './documents/item.mjs';
// Import sheet classes.
import { MEGSActorSheet } from './sheets/actor-sheet.mjs';
import { MEGSCharacterBuilderSheet } from './sheets/character-creator-sheet.mjs';
import { MEGSItemSheet } from './sheets/item-sheet.mjs';
// Import helper/utility classes and constants.
import { preloadHandlebarsTemplates } from './helpers/templates.mjs';
import { MEGS } from './helpers/config.mjs';

import MEGSCombat from './combat/combat.js';
import MEGSCombatTracker from './combat/combatTracker.js';
import MEGSCombatant from './combat/combatant.js';
import { MegsRoll, MegsTableRolls, RollValues } from './dice.mjs';

// Turn on hooks logging for debugging
// CONFIG.debug.hooks = true;

/* -------------------------------------------- */
/*  Init Hook                                   */
/* -------------------------------------------- */

Hooks.once('init', function () {
    // Add utility classes to the global game object so that they're more easily
    // accessible in global contexts.
    game.megs = {
        MEGSActor,
        MEGSItem,
        rollItemMacro,
    };

    // Add custom constants for configuration.
    CONFIG.MEGS = MEGS;

    // Define custom Document classes
    CONFIG.Actor.documentClass = MEGSActor;
    CONFIG.Item.documentClass = MEGSItem;
    CONFIG.Combat.documentClass = MEGSCombat;
    CONFIG.ui.combat = MEGSCombatTracker;
    CONFIG.Combatant.documentClass = MEGSCombatant;

    // Register custom Roll class
    CONFIG.Dice.rolls.push(MegsRoll);

    // Load MEGS tables
    _loadData('systems/megs/assets/data/tables.json').then((response) => {
        console.log(`Received response for tables data: ${response.status}`);
        CONFIG.tables = response;
    });

    /**
     * Set an initiative formula for the system
     * @type {String}
     */
    CONFIG.Combat.initiative = {
        formula: '1d10',
        decimals: 0,
    };

    // Combat maneuvers
    _loadData('systems/megs/assets/data/combatManeuvers.json')
        .then((response) => {
            console.log(`Received response for combat maneuvers data: ${response.status}`);
            CONFIG.combatManeuvers = response;
        })
        .catch((error) => {
            console.error(`Error loading combat manuevers: ${error.message}`);
        });

    _loadData('systems/megs/assets/data/motivations.json')
        .then((response) => {
            console.log(`Received response for motivations data: ${response.status}`);
            CONFIG.motivations = response;
        })
        .catch((error) => {
            console.error(`Error loading motivations data: ${error.message}`);
        });

    _loadData('systems/megs/assets/data/skills.json')
        .then((response) => {
            console.log(`Received response for skills data: ${response.status}`);
            CONFIG.skills = response;
        })
        .catch((error) => {
            console.error(`Error loading skills data: ${error.message}`);
        });

    _loadData('systems/megs/assets/data/apCostChart.json')
        .then((response) => {
            console.log(`Received response for AP cost chart data: ${response.status}`);
            CONFIG.apCostChart = response;
        })
        .catch((error) => {
            console.error(`Error loading AP cost chart data: ${error.message}`);
        });

    _loadData('systems/megs/assets/data/wealth.json')
        .then((response) => {
            console.log(`Received response for wealth data: ${response.status}`);
            CONFIG.wealth = response;
        })
        .catch((error) => {
            console.error(`Error loading wealth data: ${error.message}`);
        });

    // Active Effects are never copied to the Actor,
    // but will still apply to the Actor from within the Item
    // if the transfer property on the Active Effect is true.
    CONFIG.ActiveEffect.legacyTransferral = false;

    CONFIG.reliabilityScores = [0, 2, 3, 5, 7, 9, 11];

    // Register sheet application classes
    Actors.unregisterSheet('core', ActorSheet);
    Actors.registerSheet('megs', MEGSActorSheet, {
        makeDefault: true,
        label: 'MEGS.SheetLabels.Actor',
    });
    Actors.registerSheet('megs', MEGSCharacterBuilderSheet, {
        makeDefault: false,
        label: 'MEGS.SheetLabels.CharacterBuilder',
    });
    Items.unregisterSheet('core', ItemSheet);
    Items.registerSheet('megs', MEGSItemSheet, {
        makeDefault: true,
        label: 'MEGS.SheetLabels.Item',
    });

    // Preload Handlebars templates.
    preloadHandlebarsTemplates();

    registerSystemSettings();
});

/* -------------------------------------------- */
/*  Handlebars Helpers                          */
/* -------------------------------------------- */

/* -------------------------------------------- */
// General purpose                              */
/* -------------------------------------------- */
Handlebars.registerHelper('toLowerCase', function (str) {
    return str.toLowerCase();
});

Handlebars.registerHelper('getAttributeCost', function (aps, factorCost) {
    // Validate inputs before calling getAPCost
    if (!CONFIG.MEGS || !CONFIG.MEGS.getAPCost) {
        return 0;
    }

    // Ensure aps and factorCost are valid numbers (not undefined/null)
    const validAPs = (aps !== undefined && aps !== null) ? aps : 0;
    const validFC = (factorCost !== undefined && factorCost !== null) ? factorCost : 0;

    return CONFIG.MEGS.getAPCost(validAPs, validFC) || 0;
});

Handlebars.registerHelper('getAPCost', function (aps, factorCost) {
    // Validate inputs before calling getAPCost
    if (!CONFIG.MEGS || !CONFIG.MEGS.getAPCost) {
        return 0;
    }

    // Ensure aps and factorCost are valid numbers (not undefined/null)
    const validAPs = (aps !== undefined && aps !== null) ? aps : 0;
    const validFC = (factorCost !== undefined && factorCost !== null) ? factorCost : 0;

    return CONFIG.MEGS.getAPCost(validAPs, validFC) || 0;
});

Handlebars.registerHelper('trueFalseToYesNo', function (str) {
    return str === 'true' ? game.i18n.localize('Yes') : game.i18n.localize('No');
});

Handlebars.registerHelper('sum', function () {
    return Array.prototype.slice.call(arguments, 0, -1).reduce((acc, num) => (acc += num));
});

Handlebars.registerHelper('multiply', function (num1, num2) {
    return num1 * num2;
});

Handlebars.registerHelper('isDivisor', function (num1, num2) {
    return num1 !== 0 && num2 % num1 === 0;
});

Handlebars.registerHelper('compare', function (v1, operator, v2) {
    switch (operator) {
        case 'eq':
            return v1 === v2;
        case '==':
            return v1 == v2;
        case '===':
            return v1 === v2;
        case '!=':
            return v1 != v2;
        case '!==':
            return v1 !== v2;
        case '<':
            return v1 < v2;
        case '<=':
            return v1 <= v2;
        case '>':
            return v1 > v2;
        case '>=':
            return v1 >= v2;
        case '&&':
            return v1 && v2;
        case '||':
            return v1 || v2;
        default:
            return options.inverse(this);
    }
});

Handlebars.registerHelper('trueFalseToYesNo', function (str) {
    return str === 'true' ? 'Yes' : 'No';
});

/* -------------------------------------------- */
// skill-related
/* -------------------------------------------- */
Handlebars.registerHelper('getSelectedSkillRange', function (skillName) {
    for (let i of game.items) {
        if (i.type === MEGS.itemTypes.skill) {
            if (i.name === skillName) {
                return i.system.range;
            }
        }
    }
    return 'N/A';
});

Handlebars.registerHelper('getSelectedSkillType', function (skillName) {
    for (let i of game.items) {
        if (i.type === MEGS.itemTypes.skill) {
            if (i.name === skillName) {
                return i.system.type;
            }
        }
    }
    return 'N/A';
});

Handlebars.registerHelper('getSelectedSkillLink', function (skillName) {
    if (game.items) {
        for (let i of game.items) {
            if (i.type === MEGS.itemTypes.skill) {
                if (i.name === skillName) {
                    return game.i18n.localize(CONFIG.MEGS.attributes[i.system.link.toLowerCase()]);
                }
            }
        }
    } else {
        console.error(`Returned undefined for game.items!`);
    }
    return 'N/A';
});

Handlebars.registerHelper('getSkillDisplayName', function (skill) {
    let displayName = skill.name;
    if (skill.system.aps === 0 && skill.subskills && skill.subskills.length > 0) {
        let subskillText = ' (';
        skill.subskills.forEach((subskill) => {
            if (subskill.system.isTrained) {
                if (subskillText !== ' (') {
                    subskillText += ', ';
                }
                // No need to show " Weapons" after every weapon type
                subskillText += subskill.name.replace(' Weapons', '');
            }
        });
        subskillText += ')';
        if (subskillText !== ' ()') {
            displayName += subskillText;
        }
    }
    if (skill.system.isLinked === 'true') {
        displayName += '*';
    }
    return displayName;
});

/* -------------------------------------------- */
/* powers-related                               */
/* -------------------------------------------- */
Handlebars.registerHelper('getAttributeText', function (key, labels) {
    return labels[key];
});

Handlebars.registerHelper('getPowerDisplayName', function (power) {
    let displayName = power.name;
    if (power.system.isLinked === 'true') {
        displayName += '*';
    }
    return displayName;
});

Handlebars.registerHelper('isLinkedPowerMismatch', function (power, actor) {
    // Check if power is linked
    if (!power.system.isLinked || power.system.isLinked === false || power.system.isLinked === 'false') {
        return false;
    }

    // Check if link is valid
    const link = power.system.link;
    if (!link || link === 'none' || link === 'special' || link === '') {
        return false;
    }

    // Get the linked attribute value from the actor
    if (!actor || !actor.system || !actor.system.attributes || !actor.system.attributes[link]) {
        return false;
    }

    const attributeValue = actor.system.attributes[link].value || 0;
    const powerAPs = power.system.aps || 0;

    // Return true if there's a mismatch
    return attributeValue !== powerAPs;
});

Handlebars.registerHelper('getPowerModifiers', function (powerId, items) {
    // Filter items to find bonuses and limitations that belong to this power
    if (!items) return [];

    const modifiers = [];
    items.forEach(item => {
        if ((item.type === 'bonus' || item.type === 'limitation') && item.system.parent === powerId) {
            modifiers.push(item);
        }
    });

    return modifiers;
});

Handlebars.registerHelper('getSkillSubskills', function (skillId, items) {
    // Filter items to find subskills that belong to this skill
    if (!items) return [];

    const subskills = [];
    items.forEach(item => {
        if (item.type === 'subskill' && item.system.parent === skillId) {
            subskills.push(item);
        }
    });

    return subskills;
});

Handlebars.registerHelper('skillHasSubskillsWithAPs', function (skillId, items) {
    // Check if this skill has any subskills with APs > 0
    if (!items) return false;

    return items.some(item =>
        item.type === 'subskill' &&
        item.system.parent === skillId &&
        (item.system.aps || 0) > 0
    );
});

Handlebars.registerHelper('skillIsIndependentSubskillMode', function (skill, items) {
    // Check if skill is in independent subskill mode:
    // - Skill has 0 APs
    // - At least one subskill has APs > 0
    if (!items || (skill.system.aps || 0) > 0) return false;

    return items.some(item =>
        item.type === 'subskill' &&
        item.system.parent === skill._id &&
        (item.system.aps || 0) > 0
    );
});

Handlebars.registerHelper('getIndependentSubskillReducedFC', function (skill, items) {
    // Calculate reduced FC when purchasing independent subskills
    // FC = Normal FC - (number of subskills with 0 APs)
    if (!items) return 0;

    // Count subskills with 0 APs
    const subskillsWithZeroAPs = items.filter(item =>
        item.type === 'subskill' &&
        item.system.parent === skill._id &&
        (item.system.aps || 0) === 0
    ).length;

    const normalFC = skill.system.factorCost || 0;
    return Math.max(1, normalFC - subskillsWithZeroAPs);
});

Handlebars.registerHelper('getIndependentSubskillTotalCost', function (skill, items) {
    // Calculate total cost when purchasing independent subskills
    // This is the sum of all subskill costs
    if (!items) return 0;

    const subskills = items.filter(item =>
        item.type === 'subskill' &&
        item.system.parent === skill._id
    );

    let totalCost = 0;
    subskills.forEach(subskill => {
        totalCost += subskill.system.totalCost || 0;
    });

    return totalCost;
});

Handlebars.registerHelper('subskillParentHasAPs', function (subskill, items) {
    // Check if this subskill's parent skill has APs > 0
    if (!items || !subskill.system.parent) return false;

    const parentSkill = items.find(item =>
        item.type === 'skill' &&
        item._id === subskill.system.parent
    );

    return parentSkill && (parentSkill.system.aps || 0) > 0;
});

Handlebars.registerHelper('subskillParentIsIndependentMode', function (subskill, items) {
    // Check if this subskill's parent is in independent subskill mode
    if (!items || !subskill.system.parent) return false;

    const parentSkill = items.find(item =>
        item.type === 'skill' &&
        item._id === subskill.system.parent
    );

    if (!parentSkill || (parentSkill.system.aps || 0) > 0) return false;

    // Check if any subskill of parent has APs > 0
    return items.some(item =>
        item.type === 'subskill' &&
        item.system.parent === parentSkill._id &&
        (item.system.aps || 0) > 0
    );
});

Handlebars.registerHelper('getSubskillBaseCost', function (subskill, items) {
    // Subskills inherit base cost from parent skill
    if (!items || !subskill.system.parent) return 0;

    // Find parent skill
    const parentSkill = items.find(item =>
        item.type === 'skill' &&
        item._id === subskill.system.parent
    );

    return parentSkill ? (parentSkill.system.baseCost || 0) : 0;
});

Handlebars.registerHelper('getSubskillReducedFC', function (subskill, items) {
    // Calculate reduced Factor Cost for independently purchased subskill
    // FC = Skill's base FC - (number of unused subskills)
    if (!items || !subskill.system.parent) return 0;

    // Find parent skill
    const parentSkill = items.find(item =>
        item.type === 'skill' &&
        item._id === subskill.system.parent
    );

    if (!parentSkill) return 0;

    // Count how many subskills have 0 APs (unused)
    const unusedSubskills = items.filter(item =>
        item.type === 'subskill' &&
        item.system.parent === parentSkill._id &&
        (item.system.aps || 0) === 0
    ).length;

    // Reduced FC = Parent Skill FC - unused subskills
    const baseFc = parentSkill.system.factorCost || 0;
    const reducedFc = Math.max(1, baseFc - unusedSubskills);

    return reducedFc;
});

/* -------------------------------------------- */
// New simplified subskill system helpers
/* -------------------------------------------- */
Handlebars.registerHelper('getSkillEffectiveFactorCost', function (skill, items) {
    // Calculate effective Factor Cost for a skill
    // FC = Base FC - (number of unchecked subskills)
    // Minimum FC is always 1
    const baseFc = skill.system.factorCost || 0;

    if (!items) return baseFc;

    // Count unchecked subskills (isTrained = false or undefined)
    const uncheckedCount = items.filter(item =>
        item.type === 'subskill' &&
        item.system.parent === skill._id &&
        !item.system.isTrained
    ).length;

    return Math.max(1, baseFc - uncheckedCount);
});

Handlebars.registerHelper('getSkillFactorCostTooltip', function (skill, items) {
    // Generate tooltip text explaining the Factor Cost calculation for skills
    const baseFc = skill.system.factorCost || 0;
    let tooltip = `Base FC: ${baseFc}`;

    if (!items) {
        return tooltip;
    }

    // Count unchecked subskills
    const uncheckedCount = items.filter(item =>
        item.type === 'subskill' &&
        item.system.parent === skill._id &&
        !item.system.isTrained
    ).length;

    if (uncheckedCount > 0) {
        tooltip += `\nUnchecked subskills: -${uncheckedCount}`;
    }

    const effectiveFc = Math.max(1, baseFc - uncheckedCount);
    tooltip += `\nEffective FC: ${effectiveFc}`;

    return tooltip;
});

Handlebars.registerHelper('formatSigned', function (number) {
    // Format a number with a sign (+ or -)
    const num = Number(number) || 0;
    if (num > 0) {
        return '+' + num;
    } else if (num < 0) {
        return String(num); // negative sign already included
    } else {
        return '+0';
    }
});

Handlebars.registerHelper('subtract', function (a, b) {
    // Subtract two numbers
    return (Number(a) || 0) - (Number(b) || 0);
});

Handlebars.registerHelper('negate', function (number) {
    // Negate a number (make it negative)
    return -(Number(number) || 0);
});

Handlebars.registerHelper('formatNumber', function (number) {
    // Format a number with comma separators
    const num = Number(number) || 0;
    return num.toLocaleString('en-US');
});

Handlebars.registerHelper('default', function (value, defaultValue) {
    // Return value if it exists, otherwise return defaultValue
    return (value !== undefined && value !== null) ? value : defaultValue;
});

Handlebars.registerHelper('debugLog', function (label, value) {
    // Debug helper to log values in templates
    console.log('Template debug -', label + ':', value, 'type:', typeof value);
    return value;
});

Handlebars.registerHelper('getEffectiveFactorCost', function (power, items) {
    // Calculate the effective Factor Cost including linking and modifiers
    let baseFc = power.system.factorCost || 0;
    let effectiveFc = baseFc;

    // Apply linking reduction (-2, minimum 1)
    if (power.system.isLinked === 'true' || power.system.isLinked === true) {
        effectiveFc = Math.max(1, effectiveFc - 2);
    }

    // Add modifiers from bonuses/limitations
    if (items) {
        items.forEach(item => {
            if ((item.type === 'bonus' || item.type === 'limitation') &&
                item.system.parent === power._id &&
                item.system.factorCostMod) {
                effectiveFc += item.system.factorCostMod;
            }
        });
    }

    return Math.max(1, effectiveFc); // Minimum FC is always 1
});

Handlebars.registerHelper('getFactorCostTooltip', function (power, items) {
    // Generate tooltip text explaining the Factor Cost calculation
    const baseFc = power.system.factorCost || 0;
    let tooltip = `Base FC: ${baseFc}`;
    let effectiveFc = baseFc;

    // Check if linked
    const isLinked = power.system.isLinked === 'true' || power.system.isLinked === true;
    if (isLinked) {
        tooltip += '\nLinked: -2';
        effectiveFc = Math.max(1, effectiveFc - 2);
    }

    // Check for modifiers
    if (items) {
        items.forEach(item => {
            if ((item.type === 'bonus' || item.type === 'limitation') &&
                item.system.parent === power._id &&
                item.system.factorCostMod) {
                const mod = item.system.factorCostMod;
                const sign = mod > 0 ? '+' : '';
                tooltip += `\n${item.name}: ${sign}${mod}`;
                effectiveFc += mod;
            }
        });
    }

    effectiveFc = Math.max(1, effectiveFc);
    tooltip += `\nTotal: ${effectiveFc}`;

    return tooltip;
});

Handlebars.registerHelper('getTotalCostTooltip', function (power, items) {
    // Generate tooltip text explaining the Total Cost calculation
    const baseCost = power.system.baseCost || 0;
    const aps = power.system.aps || 0;

    if (aps === 0) {
        return 'Not purchased (0 APs)';
    }

    // Calculate effective FC
    let effectiveFc = power.system.factorCost || 0;
    const isLinked = power.system.isLinked === 'true' || power.system.isLinked === true;
    if (isLinked) {
        effectiveFc = Math.max(1, effectiveFc - 2);
    }

    // Add modifiers
    if (items) {
        items.forEach(item => {
            if ((item.type === 'bonus' || item.type === 'limitation') &&
                item.system.parent === power._id &&
                item.system.factorCostMod) {
                effectiveFc += item.system.factorCostMod;
            }
        });
    }
    effectiveFc = Math.max(1, effectiveFc);

    // Get AP cost from chart
    const apCost = MEGS.getAPCost ? MEGS.getAPCost(aps, effectiveFc) : (effectiveFc * aps);

    let tooltip = `Base Cost: ${baseCost}`;
    tooltip += `\nAP Cost (${aps} APs @ FC ${effectiveFc}): ${apCost}`;
    tooltip += `\nTotal: ${baseCost + apCost}`;

    return tooltip;
});

/* -------------------------------------------- */
// gadget-related
/* -------------------------------------------- */
Handlebars.registerHelper('getGadgetDescription', function (gadget) {
    let description = '';

    if (gadget.system.isOmni) {
        description = gadget.system.aps + ' AP ';
        Object.keys(gadget.system.omniClasses).forEach((key) => {
            if (gadget.system.omniClasses[key]) {
                description += key.toUpperCase();
                description += ' (' + MEGS.omniRanges[key.toUpperCase()] + ')';
            }
        });
        return description;
    }

    // attributes first
    for (let attributeName in gadget.system.attributes) {
        if (Object.prototype.hasOwnProperty.call(gadget.system.attributes, attributeName)) {
            const attribute = gadget.system.attributes[attributeName];
            if (attribute.value > 0) {
                if (description) {
                    description += ', ';
                }
                description += attributeName.toUpperCase() + ' ' + attribute.value;
            }
        }
    }

    const owner = game.actors.get(gadget.ownerId);
    if (!owner) {
        console.error('Owner actor not returned for ID ' + gadget.ownerId);
        // TODO this is probably related to compendium; research storing items as well?
        // https://foundryvtt.com/api/classes/client.CompendiumCollection.html
    }

    if (owner && owner.items) {
        // powers
        for (let i of owner.items) {
            if (i.type === MEGS.itemTypes.power && i.system.parent === gadget._id) {
                if (description) {
                    description += ', ';
                }
                description += i.name + ' ' + i.system.aps;
            }
        }

        // skills
        for (let i of owner.items) {
            if (
                i.type === MEGS.itemTypes.skill &&
                i.system.parent === gadget._id &&
                i.system.aps > 0
            ) {
                if (description) {
                    description += ', ';
                }
                description += i.name + ' ' + i.system.aps;
            } else if (
                i.type === MEGS.itemTypes.subskill &&
                i.system.parent === gadget._id &&
                i.system.aps > 0
            ) {
                if (description) {
                    description += ', ';
                }
                // TODO multiple subskills: Skill (subskill) #
                description += i.linkedSkill + ' (' + i.name + ') ' + i.system.aps;
            }
        }
    }

    // AV & EV
    if (gadget.system.actionValue > 0) {
        if (description) {
            description += ', ';
        }
        description += 'AV ' + gadget.system.actionValue;
    }
    if (gadget.system.effectValue > 0) {
        if (description) {
            description += ', ';
        }
        description += 'EV ' + gadget.system.effectValue;
    }

    // range
    if (gadget.system.weapon.isWeapon && gadget.system.weapon.range > 0) {
        if (description) {
            description += ', ';
        }
        description += 'Range ' + gadget.system.weapon.range;
    }

    // ammo
    if (gadget.system.weapon.isWeapon && gadget.system.weapon.ammo > 0) {
        if (description) {
            description += ', ';
        }
        description += 'Ammo ' + gadget.system.weapon.ammo;
    }

    // reliability
    if (gadget.system.reliability != null && gadget.system.reliability !== '') {
        if (description) {
            description += ', ';
        }
        description += 'R # ' + CONFIG.reliabilityScores[gadget.system.reliability];
    }

    return description;
});

Handlebars.registerHelper('getGadgetCostTooltip', function (gadget) {
    if (!gadget || !gadget.system) return '';

    const systemData = gadget.system;
    let tooltip = '';
    let totalBeforeBonus = 0;

    // Helper function to get reliability modifier
    const getReliabilityMod = (reliability) => {
        const table = { 0: 3, 2: 2, 3: 1, 5: 0, 7: -1, 9: -2, 11: -3 };
        return table[reliability] ?? 0;
    };

    // reliability is stored as an index into CONFIG.reliabilityScores array
    const reliabilityIndex = systemData.reliability ?? 3; // Default to index 3 (R# 5)
    const reliability = CONFIG.reliabilityScores?.[reliabilityIndex] ?? 5;
    const reliabilityMod = getReliabilityMod(reliability);

    // Debug: Show what reliability value we're reading
    console.log(`[${gadget.name}] Reliability Index: ${systemData.reliability}, R#: ${reliability}, Mod: ${reliabilityMod}`);

    // Calculate attribute costs
    let attributesCost = 0;
    if (systemData.attributes) {
        for (const [key, attr] of Object.entries(systemData.attributes)) {
            if (attr.value > 0) {
                let fc = attr.factorCost + reliabilityMod;
                console.log(`  ${key.toUpperCase()}: base FC=${attr.factorCost}, +reliabilityMod(${reliabilityMod})`);
                if (attr.alwaysSubstitute) {
                    fc += 2;
                    console.log(`    +2 for alwaysSubstitute`);
                }
                if (key === 'body' && (systemData.hasHardenedDefenses === true || systemData.hasHardenedDefenses === 'true')) {
                    fc += 2;
                    console.log(`    +2 for Hardened Defenses`);
                }
                fc = Math.max(1, fc);
                const attrCost = MEGS.getAPCost(attr.value, fc) || 0;
                console.log(`    Final: ${attr.value} APs @ FC ${fc} = ${attrCost} HP`);
                attributesCost += attrCost;
            }
        }
    }
    if (attributesCost > 0) {
        console.log(`  Total Attributes: ${attributesCost} HP`);
        tooltip += 'Attributes: ' + attributesCost + '\\n';
        totalBeforeBonus += attributesCost;
    }

    // Calculate AV cost
    if (systemData.actionValue > 0) {
        const fc = Math.max(1, 1 + reliabilityMod);
        const chartCost = MEGS.getAPCost(systemData.actionValue, fc) || 0;
        const avCost = 5 + chartCost;
        console.log(`  AV: 5 (base) + ${systemData.actionValue} APs @ FC ${fc} = ${chartCost} HP → Total: ${avCost} HP`);
        tooltip += `AV: ${avCost}\\n`;
        totalBeforeBonus += avCost;
    }

    // Calculate EV cost
    if (systemData.effectValue > 0) {
        const fc = Math.max(1, 1 + reliabilityMod);
        const evCost = 5 + (MEGS.getAPCost(systemData.effectValue, fc) || 0);
        tooltip += 'EV: ' + evCost + '\\n';
        totalBeforeBonus += evCost;
    }

    // Calculate Range cost (check both systemData.range and systemData.weapon.range)
    const rangeValue = systemData.range || systemData.weapon?.range || 0;
    if (rangeValue > 0) {
        const fc = Math.max(1, 1 + reliabilityMod);
        const rangeCost = 5 + (MEGS.getAPCost(rangeValue, fc) || 0);
        tooltip += 'Range: ' + rangeCost + '\\n';
        totalBeforeBonus += rangeCost;
    }

    // Add child item costs
    const owner = game.actors.get(gadget.ownerId);
    if (owner && owner.items) {
        let powersCost = 0;
        let skillsCost = 0;
        let advantagesCost = 0;
        let drawbacksCost = 0;

        owner.items.forEach(item => {
            if (item.system.parent === gadget._id && item.system.totalCost) {
                if (item.type === MEGS.itemTypes.power) {
                    powersCost += item.system.totalCost;
                } else if (item.type === MEGS.itemTypes.skill) {
                    skillsCost += item.system.totalCost;
                } else if (item.type === MEGS.itemTypes.advantage) {
                    advantagesCost += item.system.totalCost;
                } else if (item.type === MEGS.itemTypes.drawback) {
                    drawbacksCost += item.system.totalCost;
                }
            }
        });

        if (powersCost > 0) {
            tooltip += 'Powers: ' + powersCost + '\\n';
            totalBeforeBonus += powersCost;
        }
        if (skillsCost > 0) {
            tooltip += 'Skills: ' + skillsCost + '\\n';
            totalBeforeBonus += skillsCost;
        }
        if (advantagesCost > 0) {
            tooltip += 'Advantages: ' + advantagesCost + '\\n';
            totalBeforeBonus += advantagesCost;
        }
        if (drawbacksCost > 0) {
            tooltip += 'Drawbacks: -' + drawbacksCost + '\\n';
            totalBeforeBonus -= drawbacksCost;
        }
    }

    // Add total before bonus
    tooltip += '---\\n';
    tooltip += 'Total before bonus: ' + totalBeforeBonus + '\\n';

    // Add gadget bonus (divide by 4 if can be Taken Away, 2 if cannot)
    const gadgetBonus = systemData.canBeTakenAway ? 4 : 2;
    console.log(`  Total before bonus: ${totalBeforeBonus} HP`);
    console.log(`  Gadget Bonus: ÷${gadgetBonus}`);
    tooltip += 'Gadget Bonus: ÷' + gadgetBonus + '\\n';

    // Add final cost
    const finalCost = Math.ceil(totalBeforeBonus / gadgetBonus);
    console.log(`  Final Cost: ${totalBeforeBonus} ÷ ${gadgetBonus} = ${finalCost} HP`);
    tooltip += 'Final Cost: ' + finalCost;

    return tooltip;
});

Handlebars.registerHelper('shouldShowRow', function (index, hasAttributes, options) {
    if (index < 3 && hasAttributes?.physical) {
        return options.fn(this);
    } else if (index > 2 && index < 6 && hasAttributes?.mental) {
        return options.fn(this);
    } else if (index > 5 && index < 9 && hasAttributes?.mystical) {
        return options.fn(this);
    }
    return options.inverse(this);
});

Handlebars.registerHelper('shouldShowGadgetAttributesDetails', function (hasAttributes, options) {
    if (hasAttributes?.physical || hasAttributes?.mental || hasAttributes?.mystical) {
        return options.fn(this);
    }
    return options.inverse(this);
});

Handlebars.registerHelper('getVehicleOwnerName', function (ownerId, characters) {
    return characters[ownerId] || '-';
});

Handlebars.registerHelper('getLinkedVehicleItemName', function (vehicleId, vehicles) {
    return Object.keys(vehicles).find((key) => vehicles[key] === vehicleId);
});

/* -------------------------------------------- */
// description
/* -------------------------------------------- */
Handlebars.registerHelper('getMotivation', function (descriptionIndex, descriptions) {
    return descriptions[descriptionIndex];
});

/* -------------------------------------------- */
/*  Handlebars Partials                         */
/* -------------------------------------------- */
Handlebars.registerPartial('plusMinusInput', function (args) {
    const classes = args.classes ? args.classes : '';
    const max = args.max && !isNaN(args.max) ? args.max : '';
    //  const min = args.min === '0' ? 0 : (args.min && !isNaN(args.min)) ? args.min : '';
    let min = 0;
    if (args.min && !isNaN(args.min)) {
        min = args.min;
    } else if (args.minPos && !isNaN(args.minPos)) {
        min = '-' + args.minPos;
    }

    const valueTag = args.hasValue ? '.value' : '';
    const value = args.value && !isNaN(args.value) ? args.value : '0';
    const tabindex = args.tabindex ? 'tablindex="' + args.tabindex + '"' : '';

    return (
        '<div class="quantity ' +
        classes +
        '">' +
        '<button class="minus" aria-label="Decrease" onClick="' +
        args.id +
        'Input.value = parseInt(' +
        args.id +
        'Input.value) - 1">&minus;</button>' +
        '<input id="' +
        args.id +
        'Input" name="system.' +
        args.id +
        valueTag +
        '" type="number" class="input-box" value="' +
        value +
        '" min="' +
        min +
        '" max="' +
        max +
        '" data-dtype="Number"' +
        tabindex +
        '>' +
        '<button class="plus" aria-label="Increase" onClick="' +
        args.id +
        'Input.value = parseInt(' +
        args.id +
        'Input.value)+ 1 ">&plus;</button>' +
        '</div>'
    );
});

/* -------------------------------------------- */
/*  Ready Hook                                  */
/* -------------------------------------------- */

Hooks.once('ready', function () {
    // Wait to register hotbar drop hook on ready so that modules could register earlier if they want to
    Hooks.on('hotbarDrop', (bar, data, slot) => {
        let item = fromUuidSync(data.uuid);
        if (item && item.system) {
            createMegsMacro(item, slot);
            return false;
        }
    });
    Hooks.on('chatMessage', (log, message, data) => interceptMegsRoll(message, data));
});

/**
 * interceptMegsRoll makes a basic 2d10 roll
 * @param message
 * @param data
 * @returns {boolean}
 */
function interceptMegsRoll(message, data) {
    if (message === '/r megs' || message === '/megs') {
        console.info('Rolling from megs.interceptMegsRoll');
        const rollValues = new RollValues('', '', 100, 0, 0, 0, 0, '1d10 + 1d10', false);
        const rollTables = new MegsTableRolls(rollValues);
        rollTables.roll(undefined, 100).then((response) => {});

        return true;
    }
}

/* -------------------------------------------- */
/*  Load JSON data                              */
/* -------------------------------------------- */

/**
 * Grab the JSON from a file and place it in an object.
 * @param {Object} jsonPath     The path in the Foundry Data directory to the JSON asset
 * @returns {Promise}
 */
async function _loadData(jsonPath) {
    const response = await fetch(jsonPath);
    const contents = await response.json();
    return contents;
}

/* -------------------------------------------- */
/*  Hotbar Macros                               */
/* -------------------------------------------- */

/**
 * Create a Macro from an Item drop.
 * Get an existing item macro if one exists, otherwise create a new one.
 * @param {Object} data     The dropped data
 * @param {number} slot     The hotbar slot to use
 * @returns {Promise}
 */
async function createMegsMacro(item, slot) {
    const folder = game.folders
        .filter((f) => f.type === 'Macro')
        .find((f) => f.name === 'MEGS RPG System Macros');

    // Create the macro command
    const command = `game.megs.rollItemMacro("${item.uuid}");`;
    let macro = game.macros.find(
        (m) =>
            m.name === item.name &&
            m.command === command &&
            (m.author === game.user.id ||
                m.ownership.default >= CONST.DOCUMENT_OWNERSHIP_LEVELS.OBSERVER ||
                m.ownership[game.user.id] >= CONST.DOCUMENT_OWNERSHIP_LEVELS.OBSERVER)
    );
    if (!macro) {
        macro = await Macro.create({
            name: item.name,
            type: 'script',
            img: item.img,
            command: command,
            flags: { 'megs.itemMacro': true },
            folder: folder?.id,
            'ownership.default': CONST.DOCUMENT_OWNERSHIP_LEVELS.OBSERVER,
        });
    }
    game.user.assignHotbarMacro(macro, slot);
}

/**
 * Create a Macro from an Item drop.
 * Get an existing item macro if one exists, otherwise create a new one.
 * @param {string} itemName
 * @return {Promise}
 */
function rollItemMacro(uuid) {
    const actorId = uuid.match(/^Actor\.([A-Za-z0-9]+)\.Item\..+/)[1];
    const actor = game.actors.get(actorId);
    const item = actor ? actor.items.find((i) => i.uuid === uuid) : null;
    if (!item)
        return ui.notifications.warn(
            `Could not find item with UUID ${uuid}. You may need to delete and recreate this macro.`
        );

    // Trigger the item roll
    return item.roll();
}

function registerSystemSettings() {
    game.settings.register('megs', 'showHeroPointCosts', {
        config: true,
        scope: 'client',
        name: 'SETTINGS.showHeroPointCosts.name',
        hint: 'SETTINGS.showHeroPointCosts.label',
        type: Boolean,
        default: false,
    });
    game.settings.register('megs', 'showActiveEffects', {
        config: true,
        scope: 'client',
        name: 'SETTINGS.showActiveEffects.name',
        hint: 'SETTINGS.showActiveEffects.label',
        type: Boolean,
        default: false,
    });
}
