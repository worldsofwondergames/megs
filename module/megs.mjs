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
//import MEGSCombatTracker from './combat/combatTracker';

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
    rollItemMacro
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

  // load sklls
  _loadData('systems/megs/assets/data/skills.json').then(async (response) => {
    console.log(`Received response for skills data: ${response.status}`);

    for (const skillData of response.skills) {

      const subskills = skillData.subskills;
      delete skillData.subskills;
      console.error(subskills);
      const skill = await MEGSItem.create({
        name: skillData.name,
        type:  MEGS.itemTypes.skill,
        img: skillData.img ? 'icons/svg/' + skillData.img + '.png' : 'item-bag.svg'
      }, {});
      console.error (skill);
      
/*      console.error(skill)
      let skillObj = new MEGSItem()
      
      skill.subskills.forEach(subskill => {
        console.error(subskill)

      })
        */
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
  _loadData('systems/megs/assets/data/combatManeuvers.json').then((response) => {
    console.log(`Received response for combat maneuvers data: ${response.status}`);
    CONFIG.combatManeuvers = response;
  });

  // Active Effects are never copied to the Actor,
  // but will still apply to the Actor from within the Item
  // if the transfer property on the Active Effect is true.
  CONFIG.ActiveEffect.legacyTransferral = false;

  // Register sheet application classes
  Actors.unregisterSheet('core', ActorSheet);
  Actors.registerSheet('megs', MEGSActorSheet, {
    makeDefault: true,
    label: 'MEGS.SheetLabels.Actor',
  });
  Actors.registerSheet('megs', MEGSCharacterBuilderSheet, {
    makeDefault: false,
    label: 'MEGS.SheetLabels.CharacterBuilder',
  })
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

// If you need to add Handlebars helpers, here is a useful example:
Handlebars.registerHelper('toLowerCase', function (str) {
  return str.toLowerCase();
});

Handlebars.registerHelper('sum', function () {
  return Array.prototype.slice.call(arguments, 0, -1).reduce((acc, num) => acc += num);
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
      return (v1 === v2);
    case '==':
        return (v1 == v2);
    case '===':
        return (v1 === v2);
    case '!=':
        return (v1 != v2);
    case '!==':
        return (v1 !== v2);
    case '<':
        return (v1 < v2);
    case '<=':
        return (v1 <= v2);
    case '>':
        return (v1 > v2);
    case '>=':
        return (v1 >= v2);
    case '&&':
        return (v1 && v2);
    case '||':
        return (v1 || v2);
    default:
        return options.inverse(this);
  }
});

Handlebars.registerHelper('getSelectedSkillRange', function(skillName) {
  for (let i of game.items) {
    if (i.type === MEGS.itemTypes.skill) { 
      if (i.name === skillName) {
        return i.system.range;
      }
    }
  }
  return "N/A";
});

Handlebars.registerHelper('getSelectedSkillType', function(skillName) {
  for (let i of game.items) {
    if (i.type === MEGS.itemTypes.skill) { 
      if (i.name === skillName) {
        return i.system.type;
      }
    }
  }
  return "N/A";
});

Handlebars.registerHelper('getSelectedSkillLink', function(skillName) {
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

  return "N/A";
});

Handlebars.registerHelper('getSkillDisplayName', function(skill) {
  let displayName = skill.name;
  if (skill.system.aps === 0 && skill.subskills && skill.subskills.length > 0) {
    let subskillText = " ("
    skill.subskills.forEach((subskill, index) => {
      if (subskill.system.aps > 0) {
        if (subskillText !== " (") { subskillText += " ,"; }
        // No need to show " Weapons" after every weapon type
        subskillText += subskill.name.replace(' Weapons', '') + " " + subskill.system.aps;
      }
    });
    subskillText += ")";
    if (subskillText !== " ()") {
      displayName += subskillText;
    }
  }
  if (skill.system.isLinked === "true") {
    displayName += "*";
  }
  return displayName;
});

Handlebars.registerHelper('getGadgetDescription', function(gadget) {
  let description = "";

  if (gadget.system.isOmni) {
    description = gadget.system.aps + " AP ";
    Object.keys(gadget.system.omniClasses).forEach(key => {
      if (gadget.system.omniClasses[key]) {
        description += key.toUpperCase();
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
            description += ", ";
          }
          description += attributeName.toUpperCase() + " " + attribute.value;
        }
    }
  }

  const owner = game.actors.get(gadget.ownerId);
  if (!owner) {
    console.error("Owner actor not returned for ID " + gadget.ownerId);
    // TODO this is probably related to compendium; research storing items as well?
    // https://foundryvtt.com/api/classes/client.CompendiumCollection.html
  }

  if (owner && owner.items) {
    // powers
    for (let i of owner.items) {
      if (i.type === MEGS.itemTypes.power && i.system.parent === gadget._id) { 
        if (description) {
          description += ", ";
        }
        description += i.name + " " + i.system.aps;
      }
    }

    // skills
    for (let i of owner.items) {
      if (i.type === MEGS.itemTypes.skill && i.system.parent === gadget._id && i.system.aps > 0) { 
        if (description) {
          description += ", ";
        }
        description += i.name + " " + i.system.aps;
      } else if (i.type === MEGS.itemTypes.subskill && i.system.parent === gadget._id && i.system.aps > 0) {
        if (description) {
          description += ", ";
        }
        // TODO multiple subskills: Skill (subskill) #
        description += i.linkedSkill + " (" + i.name + ") " + i.system.aps
      }
    }
  }

  // AV & EV
  if (gadget.system.actionValue > 0) {
    if (description) {
      description += ", ";
    }
    description += "AV " + gadget.system.actionValue;
  }
  if (gadget.system.effectValue > 0) {
    if (description) {
      description += ", ";
    }
    description += "EV " + gadget.system.effectValue;
  }

  // range
  if (gadget.system.weapon.isWeapon && gadget.system.weapon.range > 0) {
    if (description) {
      description += ", ";
    }
    description += "Range " + gadget.system.weapon.range;
  }

  // ammo
  if (gadget.system.weapon.isWeapon && gadget.system.weapon.ammo > 0) {
    if (description) {
      description += ", ";
    }
    description += "Ammo " + gadget.system.weapon.ammo;
  }

  // reliability
  if (gadget.system.reliability > 0) {
    if (description) {
      description += ", ";
    }
    description += "R # " + gadget.system.reliability;
  }

  return description;
});

/* -------------------------------------------- */
/*  Handlebars Partials                         */
/* -------------------------------------------- */
Handlebars.registerPartial('plusMinusInput', function(args) {
  const classes = args.classes ? args.classes : '';
  const max = (args.max && !isNaN(args.max)) ? args.max : '';
  const min = args.min === '0' ? 0 : (args.min && !isNaN(args.min)) ? args.min : '';
  const valueTag = args.hasValue ? ".value" : "";
  const value = (args.value && !isNaN(args.value)) ? args.value : '0';

  return '<div class="quantity ' + classes + '">' + 
    '<button class="minus" aria-label="Decrease" onClick="'+args.id+'Input.value = parseInt('+args.id+'Input.value) - 1">&minus;</button>' +
    '<input id="'+args.id+'Input" name="system.'+args.id + valueTag +'" type="number" class="input-box" value="'+value+'" min="'+min+'" max="'+max+'" data-dtype="Number">' +
    '<button class="plus" aria-label="Increase" onClick="'+args.id+'Input.value = parseInt('+args.id+'Input.value)+ 1 ">&plus;</button>' +
    '</div>'
});

/* -------------------------------------------- */
/*  Ready Hook                                  */
/* -------------------------------------------- */

Hooks.once('ready', function () {
  // Wait to register hotbar drop hook on ready so that modules could register earlier if they want to
  Hooks.on('hotbarDrop', (bar, data, slot) => createItemMacro(data, slot));
  Hooks.on('chatMessage', (log, message, data) => interceptMegsRoll(message, data));
});

function interceptMegsRoll(message, data) {
  if (message === "/r megs" || message === "/megs") {
    const rollValues = new RollValues("", '', 100, 0, 0,0, 0, '1d10 + 1d10', false);
    const rollTables = new MegsTableRolls(rollValues);
    rollTables.roll(undefined, 100).then((response) => {
    })

    return true;
  }
}

/* -------------------------------------------- */
/*  Load JSON data                              */
/* -------------------------------------------- */

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
async function createItemMacro(data, slot) {

  console.error("createItemMacro")
  console.error(data); // TODO delete

  // First, determine if this is a valid owned item.
  if (data.type !== 'Item') return;
  if (!data.uuid.includes('Actor.') && !data.uuid.includes('Token.')) {
    return ui.notifications.warn(
      'You can only create macro buttons for owned Items'
    );
  }


  // If it is, retrieve it based on the uuid.
  const item = await Item.fromDropData(data);

  // Create the macro command using the uuid.
  const command = `game.megs.rollItemMacro("${data.uuid}");`;

  let macro = game.macros.find(
    (m) => m.name === item.name && m.command === command
  );
  if (!macro) {
    macro = await Macro.create({
      name: item.name,
      type: 'script',
      img: item.img,
      command: command,
      flags: { 'megs.itemMacro': true },
    });
  }
  game.user.assignHotbarMacro(macro, slot);
  return false;
}

/**
 * Create a Macro from an Item drop.
 * Get an existing item macro if one exists, otherwise create a new one.
 * @param {string} itemUuid
 */
function rollItemMacro(itemUuid) {
  // Reconstruct the drop data so that we can load the item.
  const dropData = {
    type: 'Item',
    uuid: itemUuid,
  };
  // Load the item from the uuid.
  Item.fromDropData(dropData).then((item) => {
    // Determine if the item loaded and if it's an owned item.
    if (!item || !item.parent) {
      const itemName = item?.name ?? itemUuid;
      return ui.notifications.warn(
        `Could not find item ${itemName}. You may need to delete and recreate this macro.`
      );
    }

    console.error(item); // TODO delete

    // Trigger the item roll
    item.roll();
  });
}

function registerSystemSettings() {
  game.settings.register("megs", "showHeroPointCosts", {
    config: true,
    scope: "client",
    name: "SETTINGS.showHeroPointCosts.name",
    hint: "SETTINGS.showHeroPointCosts.label",
    type: Boolean,
    default: false
  });
  game.settings.register("megs", "showActiveEffects", {
    config: true,
    scope: "client",
    name: "SETTINGS.showActiveEffects.name",
    hint: "SETTINGS.showActiveEffects.label",
    type: Boolean,
    default: false
  });
}