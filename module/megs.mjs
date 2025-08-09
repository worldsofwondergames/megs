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
import { MegsTableRolls, RollValues } from './dice.mjs';

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
            if (subskill.system.aps > 0) {
                if (subskillText !== ' (') {
                    subskillText += ' ,';
                }
                // No need to show " Weapons" after every weapon type
                subskillText += subskill.name.replace(' Weapons', '') + ' ' + subskill.system.aps;
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
    if (gadget.system.reliability > 0) {
        if (description) {
            description += ', ';
        }
        description += 'R # ' + CONFIG.reliabilityScores[gadget.system.reliability];
    }

    return description;
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
