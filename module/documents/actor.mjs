import { MEGS } from "../helpers/config.mjs";
import { MEGSItem } from "./item.mjs";

/**
 * Extend the base Actor document by defining a custom roll data structure which is ideal for the Simple system.
 * @extends {Actor}
 */
export class MEGSActor extends Actor {

  _preCreate(data, options, user) {
    super._preCreate(data, options, user);

      _loadData('systems/megs/assets/data/skills.json').then((skillsFromJson) => {

          // let allGameSkills = [];
          // for (let i of game.items) {
          //   if (i.type === MEGS.itemTypes.skill) {
          //     allGameSkills.push(i);
          //   }
          // }

          let skills = [
            {
                "folder": "ccsPUuPcI7snbGSw",
                "name": "Acrobatics",
                "type": "skill",
                "img": "systems/megs/assets/images/icons/skillls/acrobatics.png",
                "system": {
                    "name": "",
                    "description": "<p>Acrobatics is composed of three separate Subskills; these are Climbing. Dodging, and Gymnastics.</p>",
                    "attributes": {
                        "dex": {
                            "value": 0,
                            "factorCost": 7,
                            "label": "Dexterity",
                            "type": "physical",
                            "rolls": [
                                "action",
                                "opposing"
                            ],
                            "alwaysSubstitute": false,
                            "isActionAttribute": true
                        },
                        "str": {
                            "value": 0,
                            "factorCost": 6,
                            "label": "Strength",
                            "type": "physical",
                            "rolls": [
                                "effect"
                            ],
                            "alwaysSubstitute": false,
                            "isActionAttribute": false
                        },
                        "body": {
                            "value": 0,
                            "factorCost": 6,
                            "label": "Body",
                            "type": "physical",
                            "rolls": [
                                "resistance"
                            ],
                            "alwaysSubstitute": false,
                            "isActionAttribute": false
                        },
                        "int": {
                            "value": 0,
                            "factorCost": 7,
                            "label": "Intelligence",
                            "type": "mental",
                            "rolls": [
                                "action",
                                "opposing"
                            ],
                            "alwaysSubstitute": false,
                            "isActionAttribute": true
                        },
                        "will": {
                            "value": 0,
                            "factorCost": 6,
                            "label": "Will",
                            "type": "mental",
                            "rolls": [
                                "effect"
                            ],
                            "alwaysSubstitute": false,
                            "isActionAttribute": false
                        },
                        "mind": {
                            "value": 0,
                            "factorCost": 6,
                            "label": "Mind",
                            "type": "mental",
                            "rolls": [
                                "resistance"
                            ],
                            "alwaysSubstitute": false,
                            "isActionAttribute": false
                        },
                        "infl": {
                            "value": 0,
                            "factorCost": 7,
                            "label": "Influence",
                            "type": "mystical",
                            "rolls": [
                                "action",
                                "opposing"
                            ],
                            "alwaysSubstitute": false,
                            "isActionAttribute": true
                        },
                        "aura": {
                            "value": 0,
                            "factorCost": 6,
                            "label": "Aura",
                            "type": "mystical",
                            "rolls": [
                                "effect"
                            ],
                            "alwaysSubstitute": false,
                            "isActionAttribute": false
                        },
                        "spirit": {
                            "value": 0,
                            "factorCost": 6,
                            "label": "Spirit",
                            "type": "mystical",
                            "rolls": [
                                "resistance"
                            ],
                            "alwaysSubstitute": false,
                            "isActionAttribute": false
                        }
                    },
                    "link": "dex",
                    "isLinked": "false",
                    "range": "normal",
                    "rangeAPs": 0,
                    "formula": "",
                    "baseCost": 15,
                    "totalCost": 0,
                    "factorCost": 7,
                    "aps": 0,
                    "parent": "",
                    "type": "dice",
                    "img": "systems/dcheroes/assets/images/icons/power.png",
                    "useUnskilled": "true",
                    "initialName": "",
                    "linked": false,
                    "unskilled": true,
                    "short_description": "",
                    "dex": {
                        "label": "Dexterity",
                        "type": "physical"
                    },
                    "str": {
                        "label": "Strength",
                        "type": "physical"
                    },
                    "body": {
                        "label": "Body",
                        "type": "physical"
                    },
                    "int": {
                        "label": "Intelligence",
                        "type": "mental"
                    },
                    "will": {
                        "label": "Will",
                        "type": "mental"
                    },
                    "mind": {
                        "label": "Mind",
                        "type": "mental"
                    },
                    "infl": {
                        "label": "Influence",
                        "type": "mystical"
                    },
                    "aura": {
                        "label": "Aura",
                        "type": "mystical"
                    },
                    "spirit": {
                        "label": "Spirit",
                        "type": "mystical"
                    },
                    "subskills": [],
                    "base_cost": "",
                    "factor_cost": "",
                    "example": "",
                    "bonuses": [],
                    "limitations": [],
                    "spellLevel": 1
                },
                "effects": [],
                "ownership": {
                    "default": 0,
                    "cClyjo8bEUjusR9T": 3
                },
                "flags": {},
                "_stats": {
                    "compendiumSource": "Compendium.dcheroes3e-shared.items.Item.3NuWHfB2vLfvCj4y",
                    "duplicateSource": null,
                    "coreVersion": "12.330",
                    "systemId": "megs",
                    "systemVersion": "0.4.0",
                    "createdTime": 1723607114740,
                    "modifiedTime": 1733068644431,
                    "lastModifiedBy": "cClyjo8bEUjusR9T"
                },
                "_id": "CPFFAghT6GxzpK6P",
                "sort": 0
            },
            {
                "folder": "ccsPUuPcI7snbGSw",
                "name": "Animal Handling",
                "type": "skill",
                "img": "modules/dcheroes3e-shared/assets/images/icons/skills/animal-handling.png",
                "system": {
                    "name": "",
                    "description": "<p>The Animal Handling Skill has two Subskills: Animal&nbsp;Training and Riding. The Animal Training Subskill of Animal&nbsp;Handling cannot be used Unskilled.&nbsp;</p>",
                    "attributes": {
                        "dex": {
                            "value": 0,
                            "factorCost": 7,
                            "label": "Dexterity",
                            "type": "physical",
                            "rolls": [
                                "action",
                                "opposing"
                            ],
                            "alwaysSubstitute": false,
                            "isActionAttribute": true
                        },
                        "str": {
                            "value": 0,
                            "factorCost": 6,
                            "label": "Strength",
                            "type": "physical",
                            "rolls": [
                                "effect"
                            ],
                            "alwaysSubstitute": false,
                            "isActionAttribute": false
                        },
                        "body": {
                            "value": 0,
                            "factorCost": 6,
                            "label": "Body",
                            "type": "physical",
                            "rolls": [
                                "resistance"
                            ],
                            "alwaysSubstitute": false,
                            "isActionAttribute": false
                        },
                        "int": {
                            "value": 0,
                            "factorCost": 7,
                            "label": "Intelligence",
                            "type": "mental",
                            "rolls": [
                                "action",
                                "opposing"
                            ],
                            "alwaysSubstitute": false,
                            "isActionAttribute": true
                        },
                        "will": {
                            "value": 0,
                            "factorCost": 6,
                            "label": "Will",
                            "type": "mental",
                            "rolls": [
                                "effect"
                            ],
                            "alwaysSubstitute": false,
                            "isActionAttribute": false
                        },
                        "mind": {
                            "value": 0,
                            "factorCost": 6,
                            "label": "Mind",
                            "type": "mental",
                            "rolls": [
                                "resistance"
                            ],
                            "alwaysSubstitute": false,
                            "isActionAttribute": false
                        },
                        "infl": {
                            "value": 0,
                            "factorCost": 7,
                            "label": "Influence",
                            "type": "mystical",
                            "rolls": [
                                "action",
                                "opposing"
                            ],
                            "alwaysSubstitute": false,
                            "isActionAttribute": true
                        },
                        "aura": {
                            "value": 0,
                            "factorCost": 6,
                            "label": "Aura",
                            "type": "mystical",
                            "rolls": [
                                "effect"
                            ],
                            "alwaysSubstitute": false,
                            "isActionAttribute": false
                        },
                        "spirit": {
                            "value": 0,
                            "factorCost": 6,
                            "label": "Spirit",
                            "type": "mystical",
                            "rolls": [
                                "resistance"
                            ],
                            "alwaysSubstitute": false,
                            "isActionAttribute": false
                        }
                    },
                    "link": "infl",
                    "isLinked": "false",
                    "range": "self",
                    "rangeAPs": 0,
                    "formula": "1d10 + 1d10",
                    "baseCost": 5,
                    "totalCost": 0,
                    "factorCost": 4,
                    "aps": 0,
                    "parent": "",
                    "type": "both",
                    "img": "icons/svg/light.svg",
                    "useUnskilled": "true",
                    "initialName": "",
                    "linked": false,
                    "unskilled": true
                },
                "effects": [],
                "ownership": {
                    "default": 0,
                    "cClyjo8bEUjusR9T": 3
                },
                "flags": {},
                "_stats": {
                    "compendiumSource": "Compendium.dcheroes3e-shared.items.Item.6Pqsq8GuYJR4SABG",
                    "duplicateSource": null,
                    "coreVersion": "12.330",
                    "systemId": "megs",
                    "systemVersion": "0.4.0",
                    "createdTime": 1723607114740,
                    "modifiedTime": 1723607114740,
                    "lastModifiedBy": "cClyjo8bEUjusR9T"
                },
                "_id": "WbidLETfF1zhX3VB",
                "sort": 0
            },
            {
                "folder": "ccsPUuPcI7snbGSw",
                "name": "Artist",
                "type": "skill",
                "img": "modules/dcheroes3e-shared/assets/images/icons/skills/artist.png",
                "system": {
                    "name": "",
                    "description": "<p>The Artist Skill has seven Subskills: Actor, Dancer, Musician, Painter, Photographer, Sculptor, and Writer, each of which has the potential to please an audience; these Subskills will only impress willing and interested viewers.</p>\n<p>When a Character uses Artist to perform or produce a work, OV/RVs are at 4/4 unless performed or produced for a specific person, in which case that person's INFLISPIRIT acts as OV/RVs. If the person possesses the Artist Skill, the APs of Artist will act as OV/RV to the attempt. Multi-Attack penalties for Artist attempts are not applicable. RAPs on an Artist attempt indicate the following effects:</p>\n<table style=\"width: 100.041%;\" border=\"1\"><colgroup><col style=\"width: 16.5548%;\"><col style=\"width: 83.404%;\"></colgroup>\n<tbody>\n<tr>\n<td style=\"text-align: center;\">1-2</td>\n<td>The performance or work is accepted.</td>\n</tr>\n<tr>\n<td style=\"text-align: center;\">3-5</td>\n<td>The performance or work is well received.</td>\n</tr>\n<tr>\n<td style=\"text-align: center;\">6-9</td>\n<td>The artist receives critical acclaim (equal to a standing ovation if it is a performance).</td>\n</tr>\n<tr>\n<td style=\"text-align: center;\">10+</td>\n<td>The artist gives an immortal performance or creates a masterpiece which the audience will never forget.</td>\n</tr>\n</tbody>\n</table>\n<p>An audience which liked a Character's performance or work will be Friendly toward the Artist. Utilizing Artist in this fashion during combat will be ineffectual.</p>\n<p>A Character should remember that great works of art are not produced hourly. While no fixed time exists for the fruition of genius, a standard guideline is two months (21 APs) per major work. Saleable art works may be produced in the minimum times listed in the associated Subskills.</p>",
                    "attributes": {
                        "dex": {
                            "value": 0,
                            "factorCost": 7,
                            "label": "Dexterity",
                            "type": "physical",
                            "rolls": [
                                "action",
                                "opposing"
                            ],
                            "alwaysSubstitute": false,
                            "isActionAttribute": true
                        },
                        "str": {
                            "value": 0,
                            "factorCost": 6,
                            "label": "Strength",
                            "type": "physical",
                            "rolls": [
                                "effect"
                            ],
                            "alwaysSubstitute": false,
                            "isActionAttribute": false
                        },
                        "body": {
                            "value": 0,
                            "factorCost": 6,
                            "label": "Body",
                            "type": "physical",
                            "rolls": [
                                "resistance"
                            ],
                            "alwaysSubstitute": false,
                            "isActionAttribute": false
                        },
                        "int": {
                            "value": 0,
                            "factorCost": 7,
                            "label": "Intelligence",
                            "type": "mental",
                            "rolls": [
                                "action",
                                "opposing"
                            ],
                            "alwaysSubstitute": false,
                            "isActionAttribute": true
                        },
                        "will": {
                            "value": 0,
                            "factorCost": 6,
                            "label": "Will",
                            "type": "mental",
                            "rolls": [
                                "effect"
                            ],
                            "alwaysSubstitute": false,
                            "isActionAttribute": false
                        },
                        "mind": {
                            "value": 0,
                            "factorCost": 6,
                            "label": "Mind",
                            "type": "mental",
                            "rolls": [
                                "resistance"
                            ],
                            "alwaysSubstitute": false,
                            "isActionAttribute": false
                        },
                        "infl": {
                            "value": 0,
                            "factorCost": 7,
                            "label": "Influence",
                            "type": "mystical",
                            "rolls": [
                                "action",
                                "opposing"
                            ],
                            "alwaysSubstitute": false,
                            "isActionAttribute": true
                        },
                        "aura": {
                            "value": 0,
                            "factorCost": 6,
                            "label": "Aura",
                            "type": "mystical",
                            "rolls": [
                                "effect"
                            ],
                            "alwaysSubstitute": false,
                            "isActionAttribute": false
                        },
                        "spirit": {
                            "value": 0,
                            "factorCost": 6,
                            "label": "Spirit",
                            "type": "mystical",
                            "rolls": [
                                "resistance"
                            ],
                            "alwaysSubstitute": false,
                            "isActionAttribute": false
                        }
                    },
                    "link": "infl",
                    "isLinked": false,
                    "range": "self",
                    "rangeAPs": 0,
                    "formula": "1d10 + 1d10",
                    "baseCost": 5,
                    "totalCost": 0,
                    "factorCost": 8,
                    "aps": 0,
                    "parent": "",
                    "type": "dice",
                    "img": "icons/svg/light.svg",
                    "useUnskilled": "false",
                    "initialName": "",
                    "linked": false,
                    "unskilled": true
                },
                "effects": [],
                "ownership": {
                    "default": 0,
                    "cClyjo8bEUjusR9T": 3
                },
                "flags": {},
                "_stats": {
                    "compendiumSource": "Compendium.dcheroes3e-shared.items.Item.B8T8RencqehD058v",
                    "duplicateSource": null,
                    "coreVersion": "12.330",
                    "systemId": "megs",
                    "systemVersion": "0.4.0",
                    "createdTime": 1723607114740,
                    "modifiedTime": 1723607114740,
                    "lastModifiedBy": "cClyjo8bEUjusR9T"
                },
                "_id": "HObePCp6J3WW6M6U",
                "sort": 0
            },
            {
                "folder": "ccsPUuPcI7snbGSw",
                "name": "Charisma",
                "type": "skill",
                "img": "modules/dcheroes3e-shared/assets/images/icons/skills/charisma.png",
                "system": {
                    "name": "",
                    "description": "<p>Charisma has three Subskills: Interrogation, Intimidation and Persuasion. The use of Charisma is often a struggle of Mental or Mystical strength made between Characters.<br><br>A Character with Charisma can use their AP's of the Skill as both the AV and the EV for all Character Interaction attempts in place of the usual Infl/Aura. To use Charisma in this manner, a Character must possess the appropriate Charismatic Subskill which corresponds the the type of Character Interaction which is being attempted (see page 109.)</p>",
                    "attributes": {
                        "dex": {
                            "value": 0,
                            "factorCost": 7,
                            "label": "Dexterity",
                            "type": "physical",
                            "rolls": [
                                "action",
                                "opposing"
                            ],
                            "alwaysSubstitute": false,
                            "isActionAttribute": true
                        },
                        "str": {
                            "value": 0,
                            "factorCost": 6,
                            "label": "Strength",
                            "type": "physical",
                            "rolls": [
                                "effect"
                            ],
                            "alwaysSubstitute": false,
                            "isActionAttribute": false
                        },
                        "body": {
                            "value": 0,
                            "factorCost": 6,
                            "label": "Body",
                            "type": "physical",
                            "rolls": [
                                "resistance"
                            ],
                            "alwaysSubstitute": false,
                            "isActionAttribute": false
                        },
                        "int": {
                            "value": 0,
                            "factorCost": 7,
                            "label": "Intelligence",
                            "type": "mental",
                            "rolls": [
                                "action",
                                "opposing"
                            ],
                            "alwaysSubstitute": false,
                            "isActionAttribute": true
                        },
                        "will": {
                            "value": 0,
                            "factorCost": 6,
                            "label": "Will",
                            "type": "mental",
                            "rolls": [
                                "effect"
                            ],
                            "alwaysSubstitute": false,
                            "isActionAttribute": false
                        },
                        "mind": {
                            "value": 0,
                            "factorCost": 6,
                            "label": "Mind",
                            "type": "mental",
                            "rolls": [
                                "resistance"
                            ],
                            "alwaysSubstitute": false,
                            "isActionAttribute": false
                        },
                        "infl": {
                            "value": 0,
                            "factorCost": 7,
                            "label": "Influence",
                            "type": "mystical",
                            "rolls": [
                                "action",
                                "opposing"
                            ],
                            "alwaysSubstitute": false,
                            "isActionAttribute": true
                        },
                        "aura": {
                            "value": 0,
                            "factorCost": 6,
                            "label": "Aura",
                            "type": "mystical",
                            "rolls": [
                                "effect"
                            ],
                            "alwaysSubstitute": false,
                            "isActionAttribute": false
                        },
                        "spirit": {
                            "value": 0,
                            "factorCost": 6,
                            "label": "Spirit",
                            "type": "mystical",
                            "rolls": [
                                "resistance"
                            ],
                            "alwaysSubstitute": false,
                            "isActionAttribute": false
                        }
                    },
                    "link": "infl",
                    "isLinked": "false",
                    "range": "self",
                    "rangeAPs": 0,
                    "formula": "2d10",
                    "baseCost": 20,
                    "totalCost": 0,
                    "factorCost": 6,
                    "aps": 0,
                    "parent": "",
                    "type": "dice",
                    "img": "icons/svg/light.svg",
                    "useUnskilled": "false",
                    "initialName": "",
                    "linked": false,
                    "unskilled": true
                },
                "effects": [],
                "ownership": {
                    "default": 0,
                    "cClyjo8bEUjusR9T": 3
                },
                "flags": {},
                "_stats": {
                    "compendiumSource": "Compendium.dcheroes3e-shared.items.Item.KVFkZpzV2q2Lxp2U",
                    "duplicateSource": null,
                    "coreVersion": "12.330",
                    "systemId": "megs",
                    "systemVersion": "0.4.0",
                    "createdTime": 1723607114858,
                    "modifiedTime": 1723607114858,
                    "lastModifiedBy": "cClyjo8bEUjusR9T"
                },
                "_id": "TAOtXsd0naQC5Tbz",
                "sort": 0
            },
            {
                "folder": "ccsPUuPcI7snbGSw",
                "name": "Detective",
                "type": "skill",
                "img": "modules/dcheroes3e-shared/assets/images/icons/skills/detective.png",
                "system": {
                    "name": "",
                    "description": "<p>The Detective Skill possesses five separate Subskills. These&nbsp;are Clue Analysis, Counterfeit Recognition, Identification Systems, Law, and Police Procedure.</p>",
                    "attributes": {
                        "dex": {
                            "value": 0,
                            "factorCost": 7,
                            "label": "Dexterity",
                            "type": "physical",
                            "rolls": [
                                "action",
                                "opposing"
                            ],
                            "alwaysSubstitute": false,
                            "isActionAttribute": true
                        },
                        "str": {
                            "value": 0,
                            "factorCost": 6,
                            "label": "Strength",
                            "type": "physical",
                            "rolls": [
                                "effect"
                            ],
                            "alwaysSubstitute": false,
                            "isActionAttribute": false
                        },
                        "body": {
                            "value": 0,
                            "factorCost": 6,
                            "label": "Body",
                            "type": "physical",
                            "rolls": [
                                "resistance"
                            ],
                            "alwaysSubstitute": false,
                            "isActionAttribute": false
                        },
                        "int": {
                            "value": 0,
                            "factorCost": 7,
                            "label": "Intelligence",
                            "type": "mental",
                            "rolls": [
                                "action",
                                "opposing"
                            ],
                            "alwaysSubstitute": false,
                            "isActionAttribute": true
                        },
                        "will": {
                            "value": 0,
                            "factorCost": 6,
                            "label": "Will",
                            "type": "mental",
                            "rolls": [
                                "effect"
                            ],
                            "alwaysSubstitute": false,
                            "isActionAttribute": false
                        },
                        "mind": {
                            "value": 0,
                            "factorCost": 6,
                            "label": "Mind",
                            "type": "mental",
                            "rolls": [
                                "resistance"
                            ],
                            "alwaysSubstitute": false,
                            "isActionAttribute": false
                        },
                        "infl": {
                            "value": 0,
                            "factorCost": 7,
                            "label": "Influence",
                            "type": "mystical",
                            "rolls": [
                                "action",
                                "opposing"
                            ],
                            "alwaysSubstitute": false,
                            "isActionAttribute": true
                        },
                        "aura": {
                            "value": 0,
                            "factorCost": 6,
                            "label": "Aura",
                            "type": "mystical",
                            "rolls": [
                                "effect"
                            ],
                            "alwaysSubstitute": false,
                            "isActionAttribute": false
                        },
                        "spirit": {
                            "value": 0,
                            "factorCost": 6,
                            "label": "Spirit",
                            "type": "mystical",
                            "rolls": [
                                "resistance"
                            ],
                            "alwaysSubstitute": false,
                            "isActionAttribute": false
                        }
                    },
                    "link": "int",
                    "isLinked": "false",
                    "range": "self",
                    "rangeAPs": 0,
                    "formula": "2d10",
                    "baseCost": 10,
                    "totalCost": 0,
                    "factorCost": 7,
                    "aps": 0,
                    "parent": "",
                    "type": "dice",
                    "img": "icons/svg/light.svg",
                    "useUnskilled": "true",
                    "initialName": "",
                    "linked": false,
                    "unskilled": true
                },
                "effects": [],
                "ownership": {
                    "default": 0,
                    "cClyjo8bEUjusR9T": 3
                },
                "flags": {},
                "_stats": {
                    "compendiumSource": "Compendium.dcheroes3e-shared.items.Item.h9J1UpMQRRPrB3Y4",
                    "duplicateSource": null,
                    "coreVersion": "12.330",
                    "systemId": "megs",
                    "systemVersion": "0.4.0",
                    "createdTime": 1723607114944,
                    "modifiedTime": 1723607114944,
                    "lastModifiedBy": "cClyjo8bEUjusR9T"
                },
                "_id": "PRBw3LXeH4i79lM1",
                "sort": 0
            },
            {
                "folder": "ccsPUuPcI7snbGSw",
                "name": "Gadgetry",
                "type": "skill",
                "img": "modules/dcheroes3e-shared/assets/images/icons/skills/gadgetry.png",
                "system": {
                    "name": "",
                    "description": "<p>Gadgetry is the ability to build, identify, and use technological devices. The Gadgetry Skill consists of two separate Subskills: Build Gadget and Identify Gadget.</p>",
                    "attributes": {
                        "dex": {
                            "value": 0,
                            "factorCost": 7,
                            "label": "Dexterity",
                            "type": "physical",
                            "rolls": [
                                "action",
                                "opposing"
                            ],
                            "alwaysSubstitute": false,
                            "isActionAttribute": true
                        },
                        "str": {
                            "value": 0,
                            "factorCost": 6,
                            "label": "Strength",
                            "type": "physical",
                            "rolls": [
                                "effect"
                            ],
                            "alwaysSubstitute": false,
                            "isActionAttribute": false
                        },
                        "body": {
                            "value": 0,
                            "factorCost": 6,
                            "label": "Body",
                            "type": "physical",
                            "rolls": [
                                "resistance"
                            ],
                            "alwaysSubstitute": false,
                            "isActionAttribute": false
                        },
                        "int": {
                            "value": 0,
                            "factorCost": 7,
                            "label": "Intelligence",
                            "type": "mental",
                            "rolls": [
                                "action",
                                "opposing"
                            ],
                            "alwaysSubstitute": false,
                            "isActionAttribute": true
                        },
                        "will": {
                            "value": 0,
                            "factorCost": 6,
                            "label": "Will",
                            "type": "mental",
                            "rolls": [
                                "effect"
                            ],
                            "alwaysSubstitute": false,
                            "isActionAttribute": false
                        },
                        "mind": {
                            "value": 0,
                            "factorCost": 6,
                            "label": "Mind",
                            "type": "mental",
                            "rolls": [
                                "resistance"
                            ],
                            "alwaysSubstitute": false,
                            "isActionAttribute": false
                        },
                        "infl": {
                            "value": 0,
                            "factorCost": 7,
                            "label": "Influence",
                            "type": "mystical",
                            "rolls": [
                                "action",
                                "opposing"
                            ],
                            "alwaysSubstitute": false,
                            "isActionAttribute": true
                        },
                        "aura": {
                            "value": 0,
                            "factorCost": 6,
                            "label": "Aura",
                            "type": "mystical",
                            "rolls": [
                                "effect"
                            ],
                            "alwaysSubstitute": false,
                            "isActionAttribute": false
                        },
                        "spirit": {
                            "value": 0,
                            "factorCost": 6,
                            "label": "Spirit",
                            "type": "mystical",
                            "rolls": [
                                "resistance"
                            ],
                            "alwaysSubstitute": false,
                            "isActionAttribute": false
                        }
                    },
                    "link": "int",
                    "isLinked": false,
                    "range": "self",
                    "rangeAPs": 0,
                    "formula": "2d10",
                    "baseCost": 25,
                    "totalCost": 0,
                    "factorCost": 8,
                    "aps": 0,
                    "parent": "",
                    "type": "dice",
                    "img": "icons/svg/light.svg",
                    "useUnskilled": "true",
                    "initialName": "",
                    "linked": false,
                    "unskilled": true
                },
                "effects": [],
                "ownership": {
                    "default": 0,
                    "cClyjo8bEUjusR9T": 3
                },
                "flags": {},
                "_stats": {
                    "compendiumSource": "Compendium.dcheroes3e-shared.items.Item.C7x9dFACutLkq7f4",
                    "duplicateSource": null,
                    "coreVersion": "12.330",
                    "systemId": "megs",
                    "systemVersion": "0.4.0",
                    "createdTime": 1723607114740,
                    "modifiedTime": 1723607114740,
                    "lastModifiedBy": "cClyjo8bEUjusR9T"
                },
                "_id": "HXQwvsOro3tOuZlg",
                "sort": 0
            },
            {
                "folder": "ccsPUuPcI7snbGSw",
                "name": "Martial Artist",
                "type": "skill",
                "img": "modules/dcheroes3e-shared/assets/images/icons/skills/martial-artist.png",
                "system": {
                    "name": "",
                    "description": "<p>A Character with the Martial Artist Skill is extremely proficient in hand-to-hand combat. Not all Characters who possess this Skill are actually trained in the Oriental Martial Arts; some merely excel in hand-to-hand combat or possess a unique fighting prowess.</p>\n<p>Possession of the Martial Artist Skill bestows two abilities on the Character:</p>\n<ul>\n<li>The Martial Artist is allowed to permanently add two points (+2) to his Initiative score, an addition which reflects the Martial Artist's extreme physical agility and finely tuned presence.</li>\n<li>The Martial Artist is allowed to substitute his APs of Skill for either AV, EV, OV, or RV when engaged in hand-to-hand combat. The Martial Artist may only substitute his APs of Skill for one of these values each phase and must declare for which value (if any) he will substitute during the upcoming phase. Substitutions of this nature only affect hand-to-hand combat and attacks made with melee weapons (knives, swords, staves, etc.).</li>\n</ul>\n<p>Example: A Martial Artist who had chosen to substitute APs of Skill for his RV is attacked by an Energy Blast; since this attack is neither hand-to-hand nor melee combat, he would defend with his normal RV, not with the APs of Martial Artist. Similarly, if the Martial Artist was planning to fire an Energy Blast during the upcoming phase, he could not use his APs of Skill as the AV or EV of the attack.</p>\n<p>Note: A Character substituting Martial Artist APs for any value can only spend a number of Hero Points equal to his substituted Attribute value on the attempt. For example, if the Batman (STR of 5 APs, and Martial Artist of 9 APs) were to substitute his APs of Martial Artist for his EV, he could spend a maximum of 5 Hero Points on his EV, as this figure was the AP level of his substituted Attribute (STR).</p>",
                    "attributes": {
                        "dex": {
                            "value": 0,
                            "factorCost": 7,
                            "label": "Dexterity",
                            "type": "physical",
                            "rolls": [
                                "action",
                                "opposing"
                            ],
                            "alwaysSubstitute": false,
                            "isActionAttribute": true
                        },
                        "str": {
                            "value": 0,
                            "factorCost": 6,
                            "label": "Strength",
                            "type": "physical",
                            "rolls": [
                                "effect"
                            ],
                            "alwaysSubstitute": false,
                            "isActionAttribute": false
                        },
                        "body": {
                            "value": 0,
                            "factorCost": 6,
                            "label": "Body",
                            "type": "physical",
                            "rolls": [
                                "resistance"
                            ],
                            "alwaysSubstitute": false,
                            "isActionAttribute": false
                        },
                        "int": {
                            "value": 0,
                            "factorCost": 7,
                            "label": "Intelligence",
                            "type": "mental",
                            "rolls": [
                                "action",
                                "opposing"
                            ],
                            "alwaysSubstitute": false,
                            "isActionAttribute": true
                        },
                        "will": {
                            "value": 0,
                            "factorCost": 6,
                            "label": "Will",
                            "type": "mental",
                            "rolls": [
                                "effect"
                            ],
                            "alwaysSubstitute": false,
                            "isActionAttribute": false
                        },
                        "mind": {
                            "value": 0,
                            "factorCost": 6,
                            "label": "Mind",
                            "type": "mental",
                            "rolls": [
                                "resistance"
                            ],
                            "alwaysSubstitute": false,
                            "isActionAttribute": false
                        },
                        "infl": {
                            "value": 0,
                            "factorCost": 7,
                            "label": "Influence",
                            "type": "mystical",
                            "rolls": [
                                "action",
                                "opposing"
                            ],
                            "alwaysSubstitute": false,
                            "isActionAttribute": true
                        },
                        "aura": {
                            "value": 0,
                            "factorCost": 6,
                            "label": "Aura",
                            "type": "mystical",
                            "rolls": [
                                "effect"
                            ],
                            "alwaysSubstitute": false,
                            "isActionAttribute": false
                        },
                        "spirit": {
                            "value": 0,
                            "factorCost": 6,
                            "label": "Spirit",
                            "type": "mystical",
                            "rolls": [
                                "resistance"
                            ],
                            "alwaysSubstitute": false,
                            "isActionAttribute": false
                        }
                    },
                    "link": "dex",
                    "isLinked": false,
                    "range": "self",
                    "rangeAPs": 0,
                    "formula": "2d10",
                    "baseCost": 25,
                    "totalCost": 0,
                    "factorCost": 6,
                    "aps": 0,
                    "parent": "",
                    "type": "dice",
                    "img": "icons/svg/light.svg",
                    "useUnskilled": "true",
                    "initialName": "",
                    "linked": false,
                    "unskilled": true
                },
                "effects": [],
                "ownership": {
                    "default": 0,
                    "cClyjo8bEUjusR9T": 3
                },
                "flags": {},
                "_stats": {
                    "compendiumSource": "Compendium.dcheroes3e-shared.items.Item.Kol3i2tO1TbhGWuk",
                    "duplicateSource": null,
                    "coreVersion": "12.330",
                    "systemId": "megs",
                    "systemVersion": "0.4.0",
                    "createdTime": 1723607114858,
                    "modifiedTime": 1723607114858,
                    "lastModifiedBy": "cClyjo8bEUjusR9T"
                },
                "_id": "06VsIdBKvAhdBp6R",
                "sort": 0
            },
            {
                "folder": "ccsPUuPcI7snbGSw",
                "name": "Medicine",
                "type": "skill",
                "img": "modules/dcheroes3e-shared/assets/images/icons/skills/medicine.png",
                "system": {
                    "name": "",
                    "description": "<p>The Medicine Skill is composed of four Subskills; these are First Aid, Forensics, Medical Treatment, and Surgery. First Aid and Surgery are only useful toward healing damage done to the BODY of a Character. Medical Treatment may be used to heal BODY, MIND, or SPIRIT. First Aid is the only Subskill of Medicine which may be attempted through Unskilled Use.</p>",
                    "attributes": {
                        "dex": {
                            "value": 0,
                            "factorCost": 7,
                            "label": "Dexterity",
                            "type": "physical",
                            "rolls": [
                                "action",
                                "opposing"
                            ],
                            "alwaysSubstitute": false,
                            "isActionAttribute": true
                        },
                        "str": {
                            "value": 0,
                            "factorCost": 6,
                            "label": "Strength",
                            "type": "physical",
                            "rolls": [
                                "effect"
                            ],
                            "alwaysSubstitute": false,
                            "isActionAttribute": false
                        },
                        "body": {
                            "value": 0,
                            "factorCost": 6,
                            "label": "Body",
                            "type": "physical",
                            "rolls": [
                                "resistance"
                            ],
                            "alwaysSubstitute": false,
                            "isActionAttribute": false
                        },
                        "int": {
                            "value": 0,
                            "factorCost": 7,
                            "label": "Intelligence",
                            "type": "mental",
                            "rolls": [
                                "action",
                                "opposing"
                            ],
                            "alwaysSubstitute": false,
                            "isActionAttribute": true
                        },
                        "will": {
                            "value": 0,
                            "factorCost": 6,
                            "label": "Will",
                            "type": "mental",
                            "rolls": [
                                "effect"
                            ],
                            "alwaysSubstitute": false,
                            "isActionAttribute": false
                        },
                        "mind": {
                            "value": 0,
                            "factorCost": 6,
                            "label": "Mind",
                            "type": "mental",
                            "rolls": [
                                "resistance"
                            ],
                            "alwaysSubstitute": false,
                            "isActionAttribute": false
                        },
                        "infl": {
                            "value": 0,
                            "factorCost": 7,
                            "label": "Influence",
                            "type": "mystical",
                            "rolls": [
                                "action",
                                "opposing"
                            ],
                            "alwaysSubstitute": false,
                            "isActionAttribute": true
                        },
                        "aura": {
                            "value": 0,
                            "factorCost": 6,
                            "label": "Aura",
                            "type": "mystical",
                            "rolls": [
                                "effect"
                            ],
                            "alwaysSubstitute": false,
                            "isActionAttribute": false
                        },
                        "spirit": {
                            "value": 0,
                            "factorCost": 6,
                            "label": "Spirit",
                            "type": "mystical",
                            "rolls": [
                                "resistance"
                            ],
                            "alwaysSubstitute": false,
                            "isActionAttribute": false
                        }
                    },
                    "link": "int",
                    "isLinked": false,
                    "range": "self",
                    "rangeAPs": 0,
                    "formula": "1d10 + 1d10",
                    "baseCost": 5,
                    "totalCost": 0,
                    "factorCost": 6,
                    "aps": 0,
                    "parent": "",
                    "type": "dice",
                    "img": "icons/svg/light.svg",
                    "useUnskilled": "true",
                    "initialName": "",
                    "linked": false,
                    "unskilled": true
                },
                "effects": [],
                "ownership": {
                    "default": 0,
                    "cClyjo8bEUjusR9T": 3
                },
                "flags": {},
                "_stats": {
                    "compendiumSource": "Compendium.dcheroes3e-shared.items.Item.8ihdd77Otgi6aemS",
                    "duplicateSource": null,
                    "coreVersion": "12.330",
                    "systemId": "megs",
                    "systemVersion": "0.4.0",
                    "createdTime": 1723607114740,
                    "modifiedTime": 1723607114740,
                    "lastModifiedBy": "cClyjo8bEUjusR9T"
                },
                "_id": "6dLo1fRrn0UB7GQD",
                "sort": 0
            },
            {
                "folder": "ccsPUuPcI7snbGSw",
                "name": "Military Science",
                "type": "skill",
                "img": "modules/dcheroes3e-shared/assets/images/icons/skills/military%20science.png",
                "system": {
                    "name": "",
                    "description": "<p>Military Science possesses six basic Subskills: Camouflage, Cartography, Danger Recognition, Demolition, Field Command, and Tracking. Camouflage, Cartography, and Tracking are the only Subskills of Military Science which may be attempted through Unskilled Use.</p>",
                    "attributes": {
                        "dex": {
                            "value": 0,
                            "factorCost": 7,
                            "label": "Dexterity",
                            "type": "physical",
                            "rolls": [
                                "action",
                                "opposing"
                            ],
                            "alwaysSubstitute": false,
                            "isActionAttribute": true
                        },
                        "str": {
                            "value": 0,
                            "factorCost": 6,
                            "label": "Strength",
                            "type": "physical",
                            "rolls": [
                                "effect"
                            ],
                            "alwaysSubstitute": false,
                            "isActionAttribute": false
                        },
                        "body": {
                            "value": 0,
                            "factorCost": 6,
                            "label": "Body",
                            "type": "physical",
                            "rolls": [
                                "resistance"
                            ],
                            "alwaysSubstitute": false,
                            "isActionAttribute": false
                        },
                        "int": {
                            "value": 0,
                            "factorCost": 7,
                            "label": "Intelligence",
                            "type": "mental",
                            "rolls": [
                                "action",
                                "opposing"
                            ],
                            "alwaysSubstitute": false,
                            "isActionAttribute": true
                        },
                        "will": {
                            "value": 0,
                            "factorCost": 6,
                            "label": "Will",
                            "type": "mental",
                            "rolls": [
                                "effect"
                            ],
                            "alwaysSubstitute": false,
                            "isActionAttribute": false
                        },
                        "mind": {
                            "value": 0,
                            "factorCost": 6,
                            "label": "Mind",
                            "type": "mental",
                            "rolls": [
                                "resistance"
                            ],
                            "alwaysSubstitute": false,
                            "isActionAttribute": false
                        },
                        "infl": {
                            "value": 0,
                            "factorCost": 7,
                            "label": "Influence",
                            "type": "mystical",
                            "rolls": [
                                "action",
                                "opposing"
                            ],
                            "alwaysSubstitute": false,
                            "isActionAttribute": true
                        },
                        "aura": {
                            "value": 0,
                            "factorCost": 6,
                            "label": "Aura",
                            "type": "mystical",
                            "rolls": [
                                "effect"
                            ],
                            "alwaysSubstitute": false,
                            "isActionAttribute": false
                        },
                        "spirit": {
                            "value": 0,
                            "factorCost": 6,
                            "label": "Spirit",
                            "type": "mystical",
                            "rolls": [
                                "resistance"
                            ],
                            "alwaysSubstitute": false,
                            "isActionAttribute": false
                        }
                    },
                    "link": "int",
                    "isLinked": false,
                    "range": "self",
                    "rangeAPs": 0,
                    "formula": "2d10",
                    "baseCost": 10,
                    "totalCost": 0,
                    "factorCost": 8,
                    "aps": 0,
                    "parent": "",
                    "type": "dice",
                    "img": "icons/svg/light.svg",
                    "useUnskilled": "true",
                    "initialName": "",
                    "linked": false,
                    "unskilled": true
                },
                "effects": [],
                "ownership": {
                    "default": 0,
                    "cClyjo8bEUjusR9T": 3
                },
                "flags": {},
                "_stats": {
                    "compendiumSource": "Compendium.dcheroes3e-shared.items.Item.jYEtkvF03EsUtwOH",
                    "duplicateSource": null,
                    "coreVersion": "12.330",
                    "systemId": "megs",
                    "systemVersion": "0.4.0",
                    "createdTime": 1723607114944,
                    "modifiedTime": 1723607114944,
                    "lastModifiedBy": "cClyjo8bEUjusR9T"
                },
                "_id": "G1Pq6wvecXhGuHdu",
                "sort": 0
            },
            {
                "folder": "ccsPUuPcI7snbGSw",
                "name": "Occultist",
                "type": "skill",
                "img": "modules/dcheroes3e-shared/assets/images/icons/skills/occultist.png",
                "system": {
                    "name": "",
                    "description": "<p>Characters with the Occultist Skill are intimately familiar with the world of the supernatural and all its paraphernalia. Skilled Occultists can identify and create mystical objects, perform magic rituals, and sense mystic energy. Occultist consists of five separate Subskills: Create Artifact, Identify Artifact, Occult Knowledge, Ritual Magic, and Premonition. None of these may be attempted with Unskilled Use.</p>\n<p>Note: For a more detailed treatment of this Skill and magic in general, consult the Magic sourcebook.</p>",
                    "attributes": {
                        "dex": {
                            "value": 0,
                            "factorCost": 7,
                            "label": "Dexterity",
                            "type": "physical",
                            "rolls": [
                                "action",
                                "opposing"
                            ],
                            "alwaysSubstitute": false,
                            "isActionAttribute": true
                        },
                        "str": {
                            "value": 0,
                            "factorCost": 6,
                            "label": "Strength",
                            "type": "physical",
                            "rolls": [
                                "effect"
                            ],
                            "alwaysSubstitute": false,
                            "isActionAttribute": false
                        },
                        "body": {
                            "value": 0,
                            "factorCost": 6,
                            "label": "Body",
                            "type": "physical",
                            "rolls": [
                                "resistance"
                            ],
                            "alwaysSubstitute": false,
                            "isActionAttribute": false
                        },
                        "int": {
                            "value": 0,
                            "factorCost": 7,
                            "label": "Intelligence",
                            "type": "mental",
                            "rolls": [
                                "action",
                                "opposing"
                            ],
                            "alwaysSubstitute": false,
                            "isActionAttribute": true
                        },
                        "will": {
                            "value": 0,
                            "factorCost": 6,
                            "label": "Will",
                            "type": "mental",
                            "rolls": [
                                "effect"
                            ],
                            "alwaysSubstitute": false,
                            "isActionAttribute": false
                        },
                        "mind": {
                            "value": 0,
                            "factorCost": 6,
                            "label": "Mind",
                            "type": "mental",
                            "rolls": [
                                "resistance"
                            ],
                            "alwaysSubstitute": false,
                            "isActionAttribute": false
                        },
                        "infl": {
                            "value": 0,
                            "factorCost": 7,
                            "label": "Influence",
                            "type": "mystical",
                            "rolls": [
                                "action",
                                "opposing"
                            ],
                            "alwaysSubstitute": false,
                            "isActionAttribute": true
                        },
                        "aura": {
                            "value": 0,
                            "factorCost": 6,
                            "label": "Aura",
                            "type": "mystical",
                            "rolls": [
                                "effect"
                            ],
                            "alwaysSubstitute": false,
                            "isActionAttribute": false
                        },
                        "spirit": {
                            "value": 0,
                            "factorCost": 6,
                            "label": "Spirit",
                            "type": "mystical",
                            "rolls": [
                                "resistance"
                            ],
                            "alwaysSubstitute": false,
                            "isActionAttribute": false
                        }
                    },
                    "link": "infl",
                    "isLinked": false,
                    "range": "self",
                    "rangeAPs": 0,
                    "formula": "1d10 + 1d10",
                    "baseCost": 20,
                    "totalCost": 0,
                    "factorCost": 9,
                    "aps": 0,
                    "parent": "",
                    "type": "dice",
                    "img": "icons/svg/light.svg",
                    "useUnskilled": "false",
                    "initialName": "",
                    "linked": false,
                    "unskilled": true
                },
                "effects": [],
                "ownership": {
                    "default": 0,
                    "cClyjo8bEUjusR9T": 3
                },
                "flags": {},
                "_stats": {
                    "compendiumSource": "Compendium.dcheroes3e-shared.items.Item.lFz17oX0z7qvZ8rT",
                    "duplicateSource": null,
                    "coreVersion": "12.330",
                    "systemId": "megs",
                    "systemVersion": "0.4.0",
                    "createdTime": 1723607114944,
                    "modifiedTime": 1723607114944,
                    "lastModifiedBy": "cClyjo8bEUjusR9T"
                },
                "_id": "p1ahKR0hlssuZry9",
                "sort": 0
            },
            {
                "folder": "ccsPUuPcI7snbGSw",
                "name": "Scientist",
                "type": "skill",
                "img": "modules/dcheroes3e-shared/assets/images/icons/skills/scientist.png",
                "system": {
                    "name": "",
                    "description": "<p>The scientist skill possesses two distinct Subskills: Analysis and Drawing Plans.</p>",
                    "attributes": {
                        "dex": {
                            "value": 0,
                            "factorCost": 7,
                            "label": "Dexterity",
                            "type": "physical",
                            "rolls": [
                                "action",
                                "opposing"
                            ],
                            "alwaysSubstitute": false,
                            "isActionAttribute": true
                        },
                        "str": {
                            "value": 0,
                            "factorCost": 6,
                            "label": "Strength",
                            "type": "physical",
                            "rolls": [
                                "effect"
                            ],
                            "alwaysSubstitute": false,
                            "isActionAttribute": false
                        },
                        "body": {
                            "value": 0,
                            "factorCost": 6,
                            "label": "Body",
                            "type": "physical",
                            "rolls": [
                                "resistance"
                            ],
                            "alwaysSubstitute": false,
                            "isActionAttribute": false
                        },
                        "int": {
                            "value": 0,
                            "factorCost": 7,
                            "label": "Intelligence",
                            "type": "mental",
                            "rolls": [
                                "action",
                                "opposing"
                            ],
                            "alwaysSubstitute": false,
                            "isActionAttribute": true
                        },
                        "will": {
                            "value": 0,
                            "factorCost": 6,
                            "label": "Will",
                            "type": "mental",
                            "rolls": [
                                "effect"
                            ],
                            "alwaysSubstitute": false,
                            "isActionAttribute": false
                        },
                        "mind": {
                            "value": 0,
                            "factorCost": 6,
                            "label": "Mind",
                            "type": "mental",
                            "rolls": [
                                "resistance"
                            ],
                            "alwaysSubstitute": false,
                            "isActionAttribute": false
                        },
                        "infl": {
                            "value": 0,
                            "factorCost": 7,
                            "label": "Influence",
                            "type": "mystical",
                            "rolls": [
                                "action",
                                "opposing"
                            ],
                            "alwaysSubstitute": false,
                            "isActionAttribute": true
                        },
                        "aura": {
                            "value": 0,
                            "factorCost": 6,
                            "label": "Aura",
                            "type": "mystical",
                            "rolls": [
                                "effect"
                            ],
                            "alwaysSubstitute": false,
                            "isActionAttribute": false
                        },
                        "spirit": {
                            "value": 0,
                            "factorCost": 6,
                            "label": "Spirit",
                            "type": "mystical",
                            "rolls": [
                                "resistance"
                            ],
                            "alwaysSubstitute": false,
                            "isActionAttribute": false
                        }
                    },
                    "link": "int",
                    "isLinked": "false",
                    "range": "self",
                    "rangeAPs": 0,
                    "formula": "2d10",
                    "baseCost": 10,
                    "totalCost": 0,
                    "factorCost": 5,
                    "aps": 0,
                    "parent": "",
                    "type": "dice",
                    "img": "icons/svg/light.svg",
                    "useUnskilled": "true",
                    "initialName": "",
                    "linked": false,
                    "unskilled": true
                },
                "effects": [],
                "ownership": {
                    "default": 0,
                    "cClyjo8bEUjusR9T": 3
                },
                "flags": {},
                "_stats": {
                    "compendiumSource": "Compendium.dcheroes3e-shared.items.Item.pFgkGFp1NoU7cIbv",
                    "duplicateSource": null,
                    "coreVersion": "12.330",
                    "systemId": "megs",
                    "systemVersion": "0.4.0",
                    "createdTime": 1723607114944,
                    "modifiedTime": 1723607114944,
                    "lastModifiedBy": "cClyjo8bEUjusR9T"
                },
                "_id": "F08rgsOQ2SOzPGSl",
                "sort": 0
            },
            {
                "folder": "ccsPUuPcI7snbGSw",
                "name": "Thief",
                "type": "skill",
                "img": "modules/dcheroes3e-shared/assets/images/icons/skills/thief.png",
                "system": {
                    "name": "",
                    "description": "<p>The Thief Skill possesses six specific Subskills, which are Escape Artist, Forgery, Locks and Safes, Pickpocketing, Security Systems, and Stealth.</p>",
                    "attributes": {
                        "dex": {
                            "value": 0,
                            "factorCost": 7,
                            "label": "Dexterity",
                            "type": "physical",
                            "rolls": [
                                "action",
                                "opposing"
                            ],
                            "alwaysSubstitute": false,
                            "isActionAttribute": true
                        },
                        "str": {
                            "value": 0,
                            "factorCost": 6,
                            "label": "Strength",
                            "type": "physical",
                            "rolls": [
                                "effect"
                            ],
                            "alwaysSubstitute": false,
                            "isActionAttribute": false
                        },
                        "body": {
                            "value": 0,
                            "factorCost": 6,
                            "label": "Body",
                            "type": "physical",
                            "rolls": [
                                "resistance"
                            ],
                            "alwaysSubstitute": false,
                            "isActionAttribute": false
                        },
                        "int": {
                            "value": 0,
                            "factorCost": 7,
                            "label": "Intelligence",
                            "type": "mental",
                            "rolls": [
                                "action",
                                "opposing"
                            ],
                            "alwaysSubstitute": false,
                            "isActionAttribute": true
                        },
                        "will": {
                            "value": 0,
                            "factorCost": 6,
                            "label": "Will",
                            "type": "mental",
                            "rolls": [
                                "effect"
                            ],
                            "alwaysSubstitute": false,
                            "isActionAttribute": false
                        },
                        "mind": {
                            "value": 0,
                            "factorCost": 6,
                            "label": "Mind",
                            "type": "mental",
                            "rolls": [
                                "resistance"
                            ],
                            "alwaysSubstitute": false,
                            "isActionAttribute": false
                        },
                        "infl": {
                            "value": 0,
                            "factorCost": 7,
                            "label": "Influence",
                            "type": "mystical",
                            "rolls": [
                                "action",
                                "opposing"
                            ],
                            "alwaysSubstitute": false,
                            "isActionAttribute": true
                        },
                        "aura": {
                            "value": 0,
                            "factorCost": 6,
                            "label": "Aura",
                            "type": "mystical",
                            "rolls": [
                                "effect"
                            ],
                            "alwaysSubstitute": false,
                            "isActionAttribute": false
                        },
                        "spirit": {
                            "value": 0,
                            "factorCost": 6,
                            "label": "Spirit",
                            "type": "mystical",
                            "rolls": [
                                "resistance"
                            ],
                            "alwaysSubstitute": false,
                            "isActionAttribute": false
                        }
                    },
                    "link": "dex",
                    "isLinked": false,
                    "range": "self",
                    "rangeAPs": 0,
                    "formula": "2d10",
                    "baseCost": 10,
                    "totalCost": 0,
                    "factorCost": 8,
                    "aps": 0,
                    "parent": "",
                    "type": "dice",
                    "img": "icons/svg/light.svg",
                    "useUnskilled": "true",
                    "initialName": "",
                    "linked": false,
                    "unskilled": true
                },
                "effects": [],
                "ownership": {
                    "default": 0,
                    "cClyjo8bEUjusR9T": 3
                },
                "flags": {},
                "_stats": {
                    "compendiumSource": "Compendium.dcheroes3e-shared.items.Item.I31STu150KeN1t3i",
                    "duplicateSource": null,
                    "coreVersion": "12.330",
                    "systemId": "megs",
                    "systemVersion": "0.4.0",
                    "createdTime": 1723607114858,
                    "modifiedTime": 1723607114858,
                    "lastModifiedBy": "cClyjo8bEUjusR9T"
                },
                "_id": "7lZHPn81QL6tr4iJ",
                "sort": 0
            },
            {
                "folder": "ccsPUuPcI7snbGSw",
                "name": "Vehicles",
                "type": "skill",
                "img": "modules/dcheroes3e-shared/assets/images/icons/skills/vehicles.png",
                "system": {
                    "name": "",
                    "description": "<p>Vehicles has four Subskills: Air Vehicles, Land Vehicles, Water Vehicles, and Space Craft. Each Subskill functions in an identical manner with the exception or the type of craft controllable through use of the Subskill.</p>\n<p>Each Vehicle Subskill enables a Character to safely operate the respective vehicle under normal conditions. Use of on-board weaponry while operating a vehicle has an AV equal to the operating Character's Vehicles Skill. If firing at another vehicle, the OV equals the Vehicles Skill of the opposing operator.</p>\n<p>A Character who attempts a trick maneuver, such as leaping a canyon or avoiding a collision in an asteroid field receives a Column Shift modifier to the OV for the Vehicles attempt based on the Universal Modifier Table. A +1 Column Shift would modify a simple motorcycle jump over a car, while a +7 Column shuft would modify a flight on the event horizon of a black hole.</p>",
                    "attributes": {
                        "dex": {
                            "value": 0,
                            "factorCost": 7,
                            "label": "Dexterity",
                            "type": "physical",
                            "rolls": [
                                "action",
                                "opposing"
                            ],
                            "alwaysSubstitute": false,
                            "isActionAttribute": true
                        },
                        "str": {
                            "value": 0,
                            "factorCost": 6,
                            "label": "Strength",
                            "type": "physical",
                            "rolls": [
                                "effect"
                            ],
                            "alwaysSubstitute": false,
                            "isActionAttribute": false
                        },
                        "body": {
                            "value": 0,
                            "factorCost": 6,
                            "label": "Body",
                            "type": "physical",
                            "rolls": [
                                "resistance"
                            ],
                            "alwaysSubstitute": false,
                            "isActionAttribute": false
                        },
                        "int": {
                            "value": 0,
                            "factorCost": 7,
                            "label": "Intelligence",
                            "type": "mental",
                            "rolls": [
                                "action",
                                "opposing"
                            ],
                            "alwaysSubstitute": false,
                            "isActionAttribute": true
                        },
                        "will": {
                            "value": 0,
                            "factorCost": 6,
                            "label": "Will",
                            "type": "mental",
                            "rolls": [
                                "effect"
                            ],
                            "alwaysSubstitute": false,
                            "isActionAttribute": false
                        },
                        "mind": {
                            "value": 0,
                            "factorCost": 6,
                            "label": "Mind",
                            "type": "mental",
                            "rolls": [
                                "resistance"
                            ],
                            "alwaysSubstitute": false,
                            "isActionAttribute": false
                        },
                        "infl": {
                            "value": 0,
                            "factorCost": 7,
                            "label": "Influence",
                            "type": "mystical",
                            "rolls": [
                                "action",
                                "opposing"
                            ],
                            "alwaysSubstitute": false,
                            "isActionAttribute": true
                        },
                        "aura": {
                            "value": 0,
                            "factorCost": 6,
                            "label": "Aura",
                            "type": "mystical",
                            "rolls": [
                                "effect"
                            ],
                            "alwaysSubstitute": false,
                            "isActionAttribute": false
                        },
                        "spirit": {
                            "value": 0,
                            "factorCost": 6,
                            "label": "Spirit",
                            "type": "mystical",
                            "rolls": [
                                "resistance"
                            ],
                            "alwaysSubstitute": false,
                            "isActionAttribute": false
                        }
                    },
                    "link": "dex",
                    "isLinked": false,
                    "range": "self",
                    "rangeAPs": 0,
                    "formula": "2d10",
                    "baseCost": 5,
                    "totalCost": 0,
                    "factorCost": 5,
                    "aps": 0,
                    "parent": "",
                    "type": "dice",
                    "img": "icons/svg/light.svg",
                    "useUnskilled": "true",
                    "initialName": "",
                    "linked": false,
                    "unskilled": true
                },
                "effects": [],
                "ownership": {
                    "default": 0,
                    "cClyjo8bEUjusR9T": 3
                },
                "flags": {},
                "_stats": {
                    "compendiumSource": "Compendium.dcheroes3e-shared.items.Item.EfqITqbksQMi9E1G",
                    "duplicateSource": null,
                    "coreVersion": "12.330",
                    "systemId": "megs",
                    "systemVersion": "0.4.0",
                    "createdTime": 1723607114740,
                    "modifiedTime": 1723607114740,
                    "lastModifiedBy": "cClyjo8bEUjusR9T"
                },
                "_id": "P6eUrEoCOe8Djwzu",
                "sort": 0
            },
            {
                "folder": "ccsPUuPcI7snbGSw",
                "name": "Weaponry",
                "type": "skill",
                "img": "modules/dcheroes3e-shared/assets/images/icons/skills/weaponry.png",
                "system": {
                    "name": "",
                    "description": "<p>Weaponry has five Subskills: Firearms, Exotic Weapons, Melee Weapons, Missile Weapons, and Heavy Weapons. Each Subskill functions in an identical manner with the exception of the type of weapon wieldable through use of the Subskill. Unskilled Characters may not use the Exotic Weapons subskill.</p>\n<p>The AVs for attacks made with Weaponry equal a Character's APs of the Skill, substituted for DEX, with EVs equal to damage inflicted by the weapon itself. Weaponry Skill also enables a Character to repair weapons which become damaged or malfunction; a gun which jams or a bowstring which breaks may automatically be repaired by such a Character in one minute (4 APs)</p>",
                    "attributes": {
                        "dex": {
                            "value": 0,
                            "factorCost": 7,
                            "label": "Dexterity",
                            "type": "physical",
                            "rolls": [
                                "action",
                                "opposing"
                            ],
                            "alwaysSubstitute": false,
                            "isActionAttribute": true
                        },
                        "str": {
                            "value": 0,
                            "factorCost": 6,
                            "label": "Strength",
                            "type": "physical",
                            "rolls": [
                                "effect"
                            ],
                            "alwaysSubstitute": false,
                            "isActionAttribute": false
                        },
                        "body": {
                            "value": 0,
                            "factorCost": 6,
                            "label": "Body",
                            "type": "physical",
                            "rolls": [
                                "resistance"
                            ],
                            "alwaysSubstitute": false,
                            "isActionAttribute": false
                        },
                        "int": {
                            "value": 0,
                            "factorCost": 7,
                            "label": "Intelligence",
                            "type": "mental",
                            "rolls": [
                                "action",
                                "opposing"
                            ],
                            "alwaysSubstitute": false,
                            "isActionAttribute": true
                        },
                        "will": {
                            "value": 0,
                            "factorCost": 6,
                            "label": "Will",
                            "type": "mental",
                            "rolls": [
                                "effect"
                            ],
                            "alwaysSubstitute": false,
                            "isActionAttribute": false
                        },
                        "mind": {
                            "value": 0,
                            "factorCost": 6,
                            "label": "Mind",
                            "type": "mental",
                            "rolls": [
                                "resistance"
                            ],
                            "alwaysSubstitute": false,
                            "isActionAttribute": false
                        },
                        "infl": {
                            "value": 0,
                            "factorCost": 7,
                            "label": "Influence",
                            "type": "mystical",
                            "rolls": [
                                "action",
                                "opposing"
                            ],
                            "alwaysSubstitute": false,
                            "isActionAttribute": true
                        },
                        "aura": {
                            "value": 0,
                            "factorCost": 6,
                            "label": "Aura",
                            "type": "mystical",
                            "rolls": [
                                "effect"
                            ],
                            "alwaysSubstitute": false,
                            "isActionAttribute": false
                        },
                        "spirit": {
                            "value": 0,
                            "factorCost": 6,
                            "label": "Spirit",
                            "type": "mystical",
                            "rolls": [
                                "resistance"
                            ],
                            "alwaysSubstitute": false,
                            "isActionAttribute": false
                        }
                    },
                    "link": "dex",
                    "isLinked": false,
                    "range": "self",
                    "rangeAPs": 0,
                    "formula": "2d10",
                    "baseCost": 5,
                    "totalCost": 0,
                    "factorCost": 6,
                    "aps": 0,
                    "parent": "",
                    "type": "dice",
                    "img": "icons/svg/light.svg",
                    "useUnskilled": "true",
                    "initialName": "",
                    "linked": false,
                    "unskilled": true
                },
                "effects": [],
                "ownership": {
                    "default": 0,
                    "cClyjo8bEUjusR9T": 3
                },
                "flags": {},
                "_stats": {
                    "compendiumSource": "Compendium.dcheroes3e-shared.items.Item.EOJyl6jGWTSECDhO",
                    "duplicateSource": null,
                    "coreVersion": "12.330",
                    "systemId": "megs",
                    "systemVersion": "0.4.0",
                    "createdTime": 1723607114740,
                    "modifiedTime": 1723607114740,
                    "lastModifiedBy": "cClyjo8bEUjusR9T"
                },
                "_id": "Sz3Dfhk0wcCKQ4iH",
                "sort": 0
            }
          ];

          console.error(skills);
          for (let i of skills) {
            delete i.folder;
            delete i._id;

            const skill = i.toObject();

            this.createEmbeddedDocuments('Item', [skill])
          }

//          this.updateSource({ items: skills });
          
/*    
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
 */
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
