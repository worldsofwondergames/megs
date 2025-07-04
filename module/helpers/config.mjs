export const MEGS = {};

/**
 * The set of Attribute Scores used within the system.
 * @type {Object}
 */
MEGS.attributes = {
  dex: 'MEGS.Attribute.Dex.long',
  str: 'MEGS.Attribute.Str.long',
  body: 'MEGS.Attribute.Body.long',
  int: 'MEGS.Attribute.Int.long',
  will: 'MEGS.Attribute.Will.long',
  mind: 'MEGS.Attribute.Mind.long',
  infl: 'MEGS.Attribute.Infl.long',
  aura: 'MEGS.Attribute.Aura.long',
  spirit: 'MEGS.Attribute.Spirit.long',
};

MEGS.attributeAbbreviations = {
  dex: 'dex',
  str: 'str',
  body: 'body',
  int: 'int',
  will: 'will',
  mind: 'mind',
  infl: 'infl',
  aura: 'aura',
  spirit: 'spirit',
};

MEGS.attributeLabels = {
  dex: 'Dexterity',
  str: 'Strength',
  body: 'Body',
  int: 'Intelligence',
  will: 'Will',
  mind: 'Mind',
  infl: 'Influence',
  aura: 'Aura',
  spirit: 'Spirit',
};

MEGS.characterTypes = {
  hero: 'hero',
  npc: 'npc',
  villain: 'villain',
  pet: "pet",
  vehicle: "vehicle",
  location: "location"
}

MEGS.rollTypes = {
  attribute: 'attribute',
  power: 'power',
  skill: 'skill'
};

MEGS.itemTypes = {
  advantage: "advantage", 
  drawback: "drawback", 
  bonus: "bonus",
  limitation: "limitation", 
  power: "power", 
  skill: "skill", 
  subskill: "subskill",
  gadget: "gadget",
}

MEGS.powerTypes = {
  auto: "Auto",
  dice: "Dice",
  both: "Both"
}

MEGS.powerSources = {
  physical: "Physical",
  mental: "Mental",
  mystical: "Mystical",
  special: "Special"
}

MEGS.ranges = {
  normal: "Normal",
  self: "Self",
  special: "Special",
  touch: "Touch",
  numeric: "APs"
}

MEGS.powers = {
  SUPERSPEED: "Superspeed",
  WATER_FREEDOM: "Water Freedom"
}

MEGS.skills = {
  MARTIAL_ARTIST: "Martial Artist",
}

MEGS.advantages = {
  LIGHTNING_REFLEXES: "Lightning Reflexes"
}

MEGS.omniRanges = {
  A: "Physical Attributes",
  B: "Mental Attributes",
  C: "Physical and Mental Powers",
  D: "Italicized Attributes"
}

MEGS.yesNoOptions = {
  "true": "Yes",
  "false": "No"
}
