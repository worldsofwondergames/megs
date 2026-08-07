// Import document classes.
import { MEGSActor } from './documents/actor.mjs';
import { MEGSItem } from './documents/item.mjs';
// Import sheet classes.
import { MEGSActorSheet } from './sheets/actor-sheet.mjs';
import { MEGSCharacterBuilderSheet } from './sheets/character-creator-sheet.mjs';
import { MEGSItemSheet } from './sheets/item-sheet.mjs';
import { MEGSGadgetBuilderSheet } from './sheets/gadget-builder-sheet.mjs';
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
    //
    // RollValues and MegsTableRolls are part of this surface deliberately: they
    // are what an outside integration needs in order to make an attribute roll
    // go through the system's own roll path -- hero point dialog, doubles
    // prompt, column shifts and chat formatting included -- instead of
    // reimplementing it. Treat the shape of this object as a public API and do
    // not change it without a version bump. See issue #156.
    game.megs = {
        MEGSActor,
        MEGSItem,
        rollItemMacro,
        RollValues,
        MegsTableRolls,
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

    Hooks.on('renderChatMessage', (message, html) => {
        const { scene: sceneId, token: tokenId, actor: actorId } = message.speaker;
        const actor = game.scenes?.get(sceneId)?.tokens.get(tokenId)?.actor ??
            game.actors?.get(actorId);
        if (!actor) return;

        const tokenImg = game.scenes?.get(sceneId)?.tokens.get(tokenId)?.texture.src ??
            actor.prototypeToken?.texture?.src ??
            actor.img;
        if (!tokenImg) return;

        const header = html[0]?.querySelector?.('.message-header') ?? html.querySelector?.('.message-header');
        if (!header) return;

        const sender = header.querySelector('.message-sender');
        if (!sender || sender.querySelector('.megs-chat-avatar')) return;

        const tokenName = game.scenes?.get(sceneId)?.tokens.get(tokenId)?.name ??
            actor.prototypeToken?.name;
        if (tokenName && tokenName !== actor.name) {
            sender.textContent = sender.textContent.replace(actor.name, tokenName);
        }

        const img = document.createElement('img');
        img.classList.add('megs-chat-avatar');
        img.src = tokenImg;
        img.alt = tokenName || actor.name;
        sender.prepend(img);
    });

    // Load MEGS tables
    _loadData('systems/megs/assets/data/tables.json').then((data) => {
        if (data) {
            CONFIG.tables = data;
        } else {
            console.error('[MEGS] Failed to set CONFIG.tables - data is null/undefined');
        }
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
        .then((data) => {
            if (data) {
                CONFIG.combatManeuvers = data;
            } else {
                console.error('[MEGS] Failed to load combat maneuvers');
            }
        })
        .catch((error) => {
            console.error('[MEGS] Error loading combat maneuvers:', error);
        });

    _loadData('systems/megs/assets/data/motivations.json')
        .then((data) => {
            if (data) {
                CONFIG.motivations = data;
            } else {
                console.error('[MEGS] Failed to load motivations');
            }
        })
        .catch((error) => {
            console.error('[MEGS] Error loading motivations:', error);
        });

    _loadData('systems/megs/assets/data/skills.json')
        .then((data) => {
            if (data) {
                CONFIG.skills = data;
            } else {
                console.error('[MEGS] Failed to load skills');
            }
        })
        .catch((error) => {
            console.error('[MEGS] Error loading skills:', error);
        });

    _loadData('systems/megs/assets/data/apCostChart.json')
        .then((data) => {
            if (data) {
                CONFIG.apCostChart = data;
            } else {
                console.error('[MEGS] Failed to load AP cost chart');
            }
        })
        .catch((error) => {
            console.error('[MEGS] Error loading AP cost chart:', error);
        });

    _loadData('systems/megs/assets/data/wealth.json')
        .then((data) => {
            if (data) {
                CONFIG.wealth = data;
            } else {
                console.error('[MEGS] Failed to load wealth');
            }
        })
        .catch((error) => {
            console.error('[MEGS] Error loading wealth:', error);
        });

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
    console.log('[MEGS] Registering MEGSGadgetBuilderSheet for gadget items...');
    Items.registerSheet('megs', MEGSGadgetBuilderSheet, {
        types: ['gadget'],
        makeDefault: false,
        label: 'MEGS.SheetLabels.GadgetBuilder',
    });
    console.log('[MEGS] MEGSGadgetBuilderSheet registered successfully');

    // Preload Handlebars templates.
    preloadHandlebarsTemplates();

    registerSystemSettings();
});

Hooks.once('setup', function () {
    delete game.model.Actor.pet;
    delete CONFIG.Actor.typeLabels.pet;
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
    if (!CONFIG.MEGS || !CONFIG.MEGS.getAPCost) {
        return 0;
    }
    return CONFIG.MEGS.getAPCost(Number(aps) || 0, Number(factorCost) || 0) || 0;
});

Handlebars.registerHelper('getAPCost', function (aps, factorCost) {
    if (!CONFIG.MEGS || !CONFIG.MEGS.getAPCost) {
        return 0;
    }
    return CONFIG.MEGS.getAPCost(Number(aps) || 0, Number(factorCost) || 0) || 0;
});

Handlebars.registerHelper('trueFalseToYesNo', function (str) {
    return str === 'true' ? game.i18n.localize('Yes') : game.i18n.localize('No');
});

Handlebars.registerHelper('isTrue', function (value) {
    // Convert string 'true'/'false' or boolean to boolean for checkbox checked attribute
    return value === 'true' || value === true;
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

Handlebars.registerHelper('compare', function (v1, operator, v2, options) {
    switch (operator) {
    case 'eq':
        return v1 === v2;
    case '==':
        return v1 == v2; // eslint-disable-line eqeqeq -- '==' is the operator being tested
    case '===':
        return v1 === v2;
    case '!=':
        return v1 != v2; // eslint-disable-line eqeqeq -- '!=' is the operator being tested
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
    for (const i of game.items) {
        if (i.type === MEGS.itemTypes.skill) {
            if (i.name === skillName) {
                return i.system.range;
            }
        }
    }
    return 'N/A';
});

Handlebars.registerHelper('getSelectedSkillType', function (skillName) {
    for (const i of game.items) {
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
        for (const i of game.items) {
            if (i.type === MEGS.itemTypes.skill) {
                if (i.name === skillName) {
                    return game.i18n.localize(CONFIG.MEGS.attributes[i.system.link.toLowerCase()]);
                }
            }
        }
    } else {
        console.error('Returned undefined for game.items!');
    }
    return 'N/A';
});

Handlebars.registerHelper('getSkillDisplayName', function (skill) {
    let displayName = skill.name;

    // Add asterisk for linked skills
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

Handlebars.registerHelper('isLinkedSkillMismatch', function (skill, actor) {
    // Check if skill is linked
    if (!skill.system.isLinked || skill.system.isLinked === false || skill.system.isLinked === 'false') {
        return false;
    }

    // Check if link is valid
    const link = skill.system.link;
    if (!link || link === 'none' || link === 'special' || link === '') {
        return false;
    }

    // Get the linked attribute value from the actor
    if (!actor || !actor.system || !actor.system.attributes || !actor.system.attributes[link]) {
        return false;
    }

    const attributeValue = actor.system.attributes[link].value || 0;
    const skillAPs = skill.system.aps || 0;

    // Return true if there's a mismatch
    return attributeValue !== skillAPs;
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

Handlebars.registerHelper('getPowerBonuses', function (powerId, items) {
    // Filter and sort bonuses for this power alphabetically
    if (!items) return [];

    const bonuses = [];
    items.forEach(item => {
        if (item.type === 'bonus' && item.system.parent === powerId) {
            bonuses.push(item);
        }
    });

    return bonuses.sort((a, b) => a.name.localeCompare(b.name));
});

Handlebars.registerHelper('getPowerLimitations', function (powerId, items) {
    // Filter and sort limitations for this power alphabetically
    if (!items) return [];

    const limitations = [];
    items.forEach(item => {
        if (item.type === 'limitation' && item.system.parent === powerId) {
            limitations.push(item);
        }
    });

    return limitations.sort((a, b) => a.name.localeCompare(b.name));
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

Handlebars.registerHelper('powerHasModifiers', function (powerId, items) {
    // Check if this power has any bonuses or limitations
    if (!items) return false;

    return items.some(item =>
        (item.type === 'bonus' || item.type === 'limitation') &&
        item.system.parent === powerId
    );
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
    // FC = Base FC - (number of unchecked subskills) - (linking bonus)
    // Minimum FC is always 1
    const baseFc = skill.system.factorCost || 0;
    let effectiveFc = baseFc;

    // Apply linking reduction (-2, minimum 1)
    if (skill.system.isLinked === 'true' || skill.system.isLinked === true) {
        effectiveFc = Math.max(1, effectiveFc - 2);
    }

    if (!items) return effectiveFc;

    // Count unchecked subskills (isTrained = false or undefined)
    const uncheckedCount = items.filter(item =>
        item.type === 'subskill' &&
        item.system.parent === skill._id &&
        !item.system.isTrained
    ).length;

    return Math.max(1, effectiveFc - uncheckedCount);
});

Handlebars.registerHelper('getSkillTotalCost', function (skill, items) {
    // Calculate total cost for a skill using effective Factor Cost
    const baseCost = skill.system.baseCost || 0;
    const aps = skill.system.aps || 0;

    // Get effective FC (with linking and subskill reductions)
    const effectiveFc = Handlebars.helpers.getSkillEffectiveFactorCost(skill, items);

    // Calculate total cost
    if (aps === 0) {
        return 0;
    } else if (effectiveFc > 0) {
        // Use AP Purchase Chart
        const apCost = (MEGS.getAPCost && typeof MEGS.getAPCost === 'function')
            ? MEGS.getAPCost(aps, effectiveFc)
            : (effectiveFc * aps); // Fallback
        return baseCost + apCost;
    } else {
        return baseCost;
    }
});

Handlebars.registerHelper('getTotalSkillsCost', function (skills, items) {
    // Calculate total cost for all skills (excluding gadget skills)
    if (!skills || !Array.isArray(skills)) return 0;

    return skills.reduce((total, skill) => {
        if (skill.system.parent) return total; // Skip gadget skills
        const cost = Handlebars.helpers.getSkillTotalCost(skill, items);
        return total + cost;
    }, 0);
});

Handlebars.registerHelper('getSkillFactorCostTooltip', function (skill, items) {
    // Generate tooltip text explaining the Factor Cost calculation for skills
    const baseFc = skill.system.factorCost || 0;
    let tooltip = `Base FC: ${baseFc}`;
    let effectiveFc = baseFc;

    // Check if linked
    const isLinked = skill.system.isLinked === 'true' || skill.system.isLinked === true;
    if (isLinked) {
        tooltip += '\nLinked: -2';
        effectiveFc = Math.max(1, effectiveFc - 2);
    }

    if (!items) {
        tooltip += `\nEffective FC: ${effectiveFc}`;
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
        effectiveFc = Math.max(1, effectiveFc - uncheckedCount);
    }

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

Handlebars.registerHelper('getHPSpentTooltip', function (budget) {
    // Generate tooltip text explaining the HP Spent calculation
    if (!budget) return '';

    const attrs = budget.attributesCost || 0;
    const wealth = budget.wealthCost || 0;
    const powers = budget.powersCost || 0;
    const skills = budget.skillsCost || 0;
    const advantages = budget.advantagesCost || 0;
    const drawbacks = budget.drawbacks || 0;
    const gadgets = budget.gadgetsCost || 0;
    const total = budget.totalSpent || 0;

    let tooltip = 'HP Spent Breakdown:\n';
    tooltip += `Attributes: ${attrs} HP\n`;
    tooltip += `Wealth: ${wealth} HP\n`;
    tooltip += `Powers: ${powers} HP\n`;
    tooltip += `Skills: ${skills} HP\n`;
    tooltip += `Advantages: ${advantages} HP\n`;
    tooltip += `Drawbacks: ${drawbacks} HP\n`;
    tooltip += `Gadgets: ${gadgets} HP\n`;
    tooltip += '─────────────────\n';
    tooltip += `Total: ${total} HP`;

    return tooltip;
});

Handlebars.registerHelper('getEffectiveFactorCost', function (power, items) {
    // Calculate the effective Factor Cost including linking and modifiers
    const baseFc = power.system.factorCost || 0;
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

    if (gadget.system.isOmni === true || gadget.system.isOmni === 'true') {
        description = gadget.system.aps + ' ' + game.i18n.localize('MEGS.APs') + ' ';
        Object.keys(gadget.system.omniClasses).forEach((key) => {
            if (gadget.system.omniClasses[key] === true || gadget.system.omniClasses[key] === 'true') {
                description += key.toUpperCase();
                description += ' (' + MEGS.omniRanges[key.toUpperCase()] + ')';
            }
        });
        return description;
    }

    // attributes first
    for (const attributeName in gadget.system.attributes) {
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
        for (const i of owner.items) {
            if (i.type === MEGS.itemTypes.power && i.system.parent === gadget._id) {
                if (description) {
                    description += ', ';
                }
                description += i.name + ' ' + i.system.aps;
            }
        }

        // skills
        for (const i of owner.items) {
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

    // reliability (don't display if R# is 0)
    if (gadget.system.reliability != null && gadget.system.reliability !== '') {
        const rNumber = CONFIG.reliabilityScores[gadget.system.reliability];
        if (rNumber > 0) {
            if (description) {
                description += ', ';
            }
            description += 'R#' + rNumber;
        }
    }

    // Return empty string if description is empty or just whitespace
    return description.trim();
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

    // Calculate attribute costs
    let attributesCost = 0;
    if (systemData.attributes) {
        for (const [key, attr] of Object.entries(systemData.attributes)) {
            if (attr.value > 0) {
                let fc = (Number(attr.factorCost) || 0) + reliabilityMod;
                if (attr.alwaysSubstitute) {
                    fc += 2;
                }
                if (key === 'body' && (systemData.hasHardenedDefenses === true || systemData.hasHardenedDefenses === 'true')) {
                    fc += 2;
                }
                fc = Math.min(10, Math.max(1, fc));
                attributesCost += MEGS.getAPCost(attr.value, fc) || 0;
            }
        }
    }
    if (attributesCost > 0) {
        tooltip += 'Attributes: ' + attributesCost + '\n';
        totalBeforeBonus += attributesCost;
    }

    // Calculate AV cost
    if (systemData.actionValue > 0) {
        const fc = Math.max(1, 1 + reliabilityMod);
        const avCost = 5 + (MEGS.getAPCost(systemData.actionValue, fc) || 0);
        tooltip += `AV: ${avCost}\n`;
        totalBeforeBonus += avCost;
    }

    // Calculate EV cost
    if (systemData.effectValue > 0) {
        const fc = Math.max(1, 1 + reliabilityMod);
        const evCost = 5 + (MEGS.getAPCost(systemData.effectValue, fc) || 0);
        tooltip += 'EV: ' + evCost + '\n';
        totalBeforeBonus += evCost;
    }

    // Calculate Range cost (check both systemData.range and systemData.weapon.range)
    const rangeValue = systemData.range || systemData.weapon?.range || 0;
    if (rangeValue > 0) {
        const fc = Math.max(1, 1 + reliabilityMod);
        const rangeCost = 5 + (MEGS.getAPCost(rangeValue, fc) || 0);
        tooltip += 'Range: ' + rangeCost + '\n';
        totalBeforeBonus += rangeCost;
    }

    // Add child item costs
    const owner = game.actors.get(gadget.ownerId);
    if (owner && owner.items) {
        let powersCost = 0;
        let skillsCost = 0;
        let advantagesCost = 0;
        let drawbacksCost = 0;
        const subGadgetEntries = [];

        owner.items.forEach(item => {
            if (item.system.parent === gadget._id) {
                if (item.type === MEGS.itemTypes.power && item.system.totalCost) {
                    powersCost += item.system.totalCost;
                } else if (item.type === MEGS.itemTypes.skill && item.system.totalCost) {
                    skillsCost += item.system.totalCost;
                } else if (item.type === MEGS.itemTypes.advantage && item.system.totalCost) {
                    advantagesCost += item.system.totalCost;
                } else if (item.type === MEGS.itemTypes.drawback && item.system.totalCost) {
                    drawbacksCost += item.system.totalCost;
                } else if (item.type === MEGS.itemTypes.gadget) {
                    const cost = item.system.totalCost || 0;
                    if (cost !== 0) {
                        subGadgetEntries.push({ name: item.name, cost: cost });
                    }
                }
            }
        });

        if (powersCost > 0) {
            tooltip += 'Powers: ' + powersCost + '\n';
            totalBeforeBonus += powersCost;
        }
        if (skillsCost > 0) {
            tooltip += 'Skills: ' + skillsCost + '\n';
            totalBeforeBonus += skillsCost;
        }
        if (advantagesCost > 0) {
            tooltip += 'Advantages: ' + advantagesCost + '\n';
            totalBeforeBonus += advantagesCost;
        }
        if (drawbacksCost > 0) {
            tooltip += 'Drawbacks: -' + drawbacksCost + '\n';
            totalBeforeBonus -= drawbacksCost;
        }
        for (const entry of subGadgetEntries) {
            tooltip += entry.name + ': ' + entry.cost + '\n';
            totalBeforeBonus += entry.cost;
        }
    }

    // Add total before bonus
    tooltip += '---\n';
    tooltip += 'Total before bonus: ' + totalBeforeBonus + '\n';

    // Add gadget bonus (divide by 4 if can be Taken Away, 2 if cannot)
    const gadgetBonus = systemData.canBeTakenAway ? 4 : 2;
    tooltip += 'Gadget Bonus: ÷' + gadgetBonus + '\n';

    // Add final cost
    const finalCost = Math.ceil(totalBeforeBonus / gadgetBonus);
    tooltip += 'Final Cost: ' + finalCost;

    return tooltip;
});

Handlebars.registerHelper('getGadgetAttributeCost', function (aps, baseFc, reliabilityIndex, hasHardenedDefenses, attrKey) {
    aps = Number(aps) || 0;
    if (aps === 0) return 0;

    baseFc = Number(baseFc) || 0;
    const table = { 0: 3, 2: 2, 3: 1, 5: 0, 7: -1, 9: -2, 11: -3 };
    const reliability = CONFIG.reliabilityScores?.[Number(reliabilityIndex)] ?? 5;
    const reliabilityMod = table[reliability] ?? 0;

    let fc = baseFc + reliabilityMod;
    if (attrKey === 'body' && (hasHardenedDefenses === true || hasHardenedDefenses === 'true')) {
        fc += 2;
    }
    fc = Math.min(10, Math.max(1, fc));

    return MEGS.getAPCost(aps, fc) || 0;
});

Handlebars.registerHelper('getGadgetBudgetTooltip', function (budget) {
    if (!budget) return '';

    const attrs = budget.attributesCost || 0;
    const avEv = budget.avEvCost || 0;
    const powers = budget.powersCost || 0;
    const skills = budget.skillsCost || 0;
    const advantages = budget.advantagesCost || 0;
    const drawbacks = budget.drawbacksCost || 0;
    const totalBeforeBonus = budget.totalBeforeBonus || 0;
    const total = budget.totalSpent || 0;

    let tooltip = 'HP Spent Breakdown:\n';
    if (attrs > 0) tooltip += `Attributes: ${attrs} HP\n`;
    if (avEv > 0) tooltip += `AV/EV: ${avEv} HP\n`;
    if (powers > 0) tooltip += `Powers: ${powers} HP\n`;
    if (skills > 0) tooltip += `Skills: ${skills} HP\n`;
    if (advantages > 0) tooltip += `Advantages: ${advantages} HP\n`;
    if (drawbacks !== 0) tooltip += `Drawbacks: ${drawbacks} HP\n`;
    tooltip += '─────────────────\n';
    tooltip += `Subtotal: ${totalBeforeBonus} HP\n`;
    const subGadgetsCost = budget.subGadgetsCost || 0;
    const ownCost = total - subGadgetsCost;
    const gadgetBonus = totalBeforeBonus > 0 && ownCost > 0
        ? Math.round(totalBeforeBonus / ownCost)
        : 4;
    tooltip += `Gadget Bonus: ÷${gadgetBonus}\n`;
    if (budget.subGadgetEntries) {
        for (const entry of budget.subGadgetEntries) {
            if (entry.cost !== 0) {
                tooltip += `${entry.name}: +${entry.cost} HP\n`;
            }
        }
    }
    tooltip += '─────────────────\n';
    tooltip += `Total: ${total} HP`;

    return tooltip;
});

/**
 * Calculate the adjusted gadget cost (divided by Can Be Taken Away factor)
 * Returns the adjusted value as a number (rounded up)
 */
Handlebars.registerHelper('getGadgetAdjustedCost', function (rawCost, canBeTakenAway) {
    const cost = Number(rawCost) || 0;
    if (cost === 0) return 0;

    const divisor = (canBeTakenAway === true || canBeTakenAway === 'true') ? 4 : 2;
    return Math.ceil(cost / divisor);
});

/**
 * Get tooltip explaining how a raw cost is adjusted by the Can Be Taken Away divisor
 */
Handlebars.registerHelper('getGadgetAdjustedCostTooltip', function (rawCost, canBeTakenAway) {
    const cost = Number(rawCost) || 0;
    if (cost === 0) return '';

    const divisor = (canBeTakenAway === true || canBeTakenAway === 'true') ? 4 : 2;
    const adjustedCost = Math.ceil(cost / divisor);
    const takenAwayText = divisor === 4 ? 'Can Be Taken Away (÷4)' : 'Cannot Be Taken Away (÷2)';

    return `Raw Cost: ${cost} HP\n${takenAwayText}\nAdjusted: ${adjustedCost} HP`;
});

Handlebars.registerHelper('getPowerFactorCostTooltip', function (power) {
    if (!power || !power.system) return '';

    const systemData = power.system;
    let tooltip = '';

    // Base Factor Cost
    const baseFactor = systemData.factorCost || 0;
    tooltip += 'Base Factor Cost: ' + baseFactor + '\n';

    // Bonuses
    const bonusMod = systemData.bonusMod || 0;
    if (bonusMod !== 0) {
        tooltip += 'Bonuses: ' + (bonusMod > 0 ? '+' : '') + bonusMod + '\n';
    }

    // Limitations
    const limitationMod = systemData.limitationMod || 0;
    if (limitationMod !== 0) {
        tooltip += 'Limitations: ' + (limitationMod > 0 ? '+' : '') + limitationMod + '\n';
    }

    // Show calculation if there are modifiers
    if (bonusMod !== 0 || limitationMod !== 0) {
        tooltip += '---\n';
        const effectiveFactor = systemData.effectiveFactorCost || baseFactor;
        tooltip += 'Effective Factor Cost: ' + effectiveFactor;
    }

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

async function _verifyCompendiumPacks() {
    console.log('[MEGS] ===========================================');
    console.log('[MEGS] Compendium Pack Verification Starting...');
    console.log('[MEGS] ===========================================');

    try {
        console.log(`[MEGS] Total packs in game.packs: ${game.packs.size}`);

        const megsPacks = game.packs.filter(pack => pack.metadata.system === 'megs');
        console.log(`[MEGS] Found ${megsPacks.length} MEGS compendium packs`);

        if (megsPacks.length === 0) {
            console.error('[MEGS] NO MEGS PACKS FOUND! Listing all available packs:');
            game.packs.forEach(pack => {
                console.log(`[MEGS]   - ${pack.collection} (system: ${pack.metadata.system})`);
            });
        }

        for (const pack of megsPacks) {
            console.log(`[MEGS] --- Pack: ${pack.metadata.label} (${pack.metadata.name}) ---`);
            console.log(`[MEGS]   Collection: ${pack.collection}`);
            console.log(`[MEGS]   Path: ${pack.metadata.path}`);
            console.log(`[MEGS]   Type: ${pack.metadata.type}`);
            console.log(`[MEGS]   Locked: ${pack.locked}`);

            try {
                console.log('[MEGS]   Attempting to get index...');
                const index = await pack.getIndex();
                console.log(`[MEGS]   Index retrieved. Items in index: ${index.size}`);

                if (index.size > 0) {
                    const sampleItems = Array.from(index.values()).slice(0, 3);
                    console.log('[MEGS]   Sample items:');
                    sampleItems.forEach(item => {
                        console.log(`[MEGS]     - ${item.name} (${item._id}, type: ${item.type})`);
                    });
                } else {
                    console.error(`[MEGS]   *** ERROR: Pack "${pack.metadata.label}" has NO ITEMS in index! ***`);
                }
            } catch (error) {
                console.error(`[MEGS]   *** ERROR loading pack "${pack.metadata.label}":`, error);
                console.error('[MEGS]   Error details:', error.message, error.stack);
            }
        }

        console.log('[MEGS] ===========================================');
        console.log('[MEGS] Compendium Pack Verification Complete');
        console.log('[MEGS] ===========================================');
    } catch (error) {
        console.error('[MEGS] CRITICAL ERROR during compendium verification:', error);
        console.error('[MEGS] Error details:', error.message, error.stack);
    }
}

Hooks.once('ready', async function () {
    // Re-prepare gadget items now that CONFIG.apCostChart is guaranteed loaded
    if (CONFIG.apCostChart?.chart) {
        for (const actor of game.actors) {
            for (const item of actor.items) {
                if (item.type === 'gadget') {
                    item.prepareDerivedData();
                }
            }
        }
    }

    if (game.settings.get('megs', 'debugLogging')) {
        await _verifyCompendiumPacks();
    }

    // Wait to register hotbar drop hook on ready so that modules could register earlier if they want to
    Hooks.on('hotbarDrop', (bar, data, slot) => {
        const item = fromUuidSync(data.uuid);
        if (item && item.system) {
            createMegsMacro(item, slot);
            return false;
        }
    });
    Hooks.on('chatMessage', (log, message, data) => interceptMegsRoll(message, data));

    // Hook to preserve gadget power/skill data when dragging from sidebar to actor
    Hooks.on('preCreateItem', (item, data, options, userId) => {
        if (item.type === 'gadget' && item.parent && data.flags?.megs?._transferData) {
            const transferData = data.flags.megs._transferData;
            if (game.settings.get('megs', 'debugLogging')) {
                console.log('[MEGS] preCreateItem hook: Found gadget with transfer data');
                console.log('[MEGS] powerAPs:', transferData.powerAPs);
            }

            // Store in global cache using a combination of parent ID and item name
            if (!globalThis.MEGS_TRANSFER_CACHE) globalThis.MEGS_TRANSFER_CACHE = {};
            const cacheKey = `${item.parent.id}_${item.name}_${Date.now()}`;
            globalThis.MEGS_TRANSFER_CACHE[cacheKey] = {
                transferData,
                itemName: item.name,
                parentId: item.parent.id
            };

            // Store the cache key in options so _onCreate can find it
            options.megsCacheKey = cacheKey;

            if (game.settings.get('megs', 'debugLogging')) {
                console.log('[MEGS] Stored in cache with key:', cacheKey);
            }
        }
    });
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
 * Check if debug logging is enabled
 * @returns {boolean}
 */
function _isDebugEnabled() {
    try {
        return game.settings.get('megs', 'debugLogging');
    } catch {
        return false;
    }
}

/**
 * Grab the JSON from a file and place it in an object.
 * @param {Object} jsonPath     The path in the Foundry Data directory to the JSON asset
 * @returns {Promise}
 */
async function _loadData(jsonPath) {
    const debug = _isDebugEnabled();
    if (debug) console.log(`[MEGS] _loadData: Fetching ${jsonPath}`);
    try {
        const response = await fetch(jsonPath);
        if (debug) console.log(`[MEGS] _loadData: Fetch response status: ${response.status}, ok: ${response.ok}`);
        if (!response.ok) {
            console.error(`[MEGS] _loadData: Failed to fetch ${jsonPath} - HTTP ${response.status}`);
            return null;
        }
        const contents = await response.json();
        if (debug) console.log(`[MEGS] _loadData: Parsed JSON from ${jsonPath}, keys:`, contents ? Object.keys(contents) : 'null');
        return contents;
    } catch (error) {
        console.error(`[MEGS] _loadData: Error loading ${jsonPath}:`, error);
        return null;
    }
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
    if (!item) {
        return ui.notifications.warn(
            `Could not find item with UUID ${uuid}. You may need to delete and recreate this macro.`
        );
    }

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
    game.settings.register('megs', 'debugLogging', {
        config: true,
        scope: 'client',
        name: 'SETTINGS.debugLogging.name',
        hint: 'SETTINGS.debugLogging.label',
        type: Boolean,
        default: false,
    });
    game.settings.register('megs', 'allowSkillDeletion', {
        config: true,
        scope: 'world',
        name: 'SETTINGS.allowSkillDeletion.name',
        hint: 'SETTINGS.allowSkillDeletion.label',
        type: Boolean,
        default: true,
        onChange: () => {
            // Re-render all open actor and item sheets when setting changes
            Object.values(ui.windows).forEach(app => {
                if (app instanceof ActorSheet || app instanceof ItemSheet) {
                    app.render(false);
                }
            });
        }
    });
}
