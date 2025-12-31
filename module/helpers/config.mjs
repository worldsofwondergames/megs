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
    pet: 'pet',
    vehicle: 'vehicle',
    location: 'location',
};

MEGS.rollTypes = {
    attribute: 'attribute',
    power: 'power',
    skill: 'skill',
};

MEGS.itemTypes = {
    advantage: 'advantage',
    drawback: 'drawback',
    bonus: 'bonus',
    limitation: 'limitation',
    power: 'power',
    skill: 'skill',
    subskill: 'subskill',
    gadget: 'gadget',
};

MEGS.powerTypes = {
    auto: 'Auto',
    dice: 'Dice',
    both: 'Both',
};

MEGS.powerSources = {
    physical: 'Physical',
    mental: 'Mental',
    mystical: 'Mystical',
    special: 'Special',
};

MEGS.ranges = {
    normal: 'Normal',
    self: 'Self',
    special: 'Special',
    touch: 'Touch',
    numeric: 'APs',
};

MEGS.powers = {
    SUPERSPEED: 'Superspeed',
    WATER_FREEDOM: 'Water Freedom',
};

MEGS.skills = {
    MARTIAL_ARTIST: 'Martial Artist',
};

MEGS.advantages = {
    LIGHTNING_REFLEXES: 'Lightning Reflexes',
};

MEGS.omniRanges = {
    A: 'Physical Attributes',
    B: 'Mental Attributes',
    C: 'Physical and Mental Powers',
    D: 'Italicized Attributes',
};

MEGS.yesNoOptions = {
    true: 'Yes',
    false: 'No',
};

/**
 * Get the Hero Point cost for a given number of APs and Factor Cost using the AP Purchase Chart.
 * @param {number} aps - The number of Action Points (APs) to purchase (1-60)
 * @param {number} factorCost - The Factor Cost (FC) of the ability (1-10)
 * @returns {number} The Hero Point cost, or 0 if invalid parameters
 */
MEGS.getAPCost = function(aps, factorCost) {
    // Validate inputs - 0 APs is valid (costs 0), but FC must be 1-10
    if (aps === null || aps === undefined || aps < 0 ||
        factorCost === null || factorCost === undefined || factorCost < 1 || factorCost > 10) {
        console.warn(`Invalid AP cost lookup: ${aps} APs at FC ${factorCost}`);
        return 0;
    }

    // 0 APs always costs 0 HP
    if (aps === 0) {
        return 0;
    }

    // Wait for apCostChart to be loaded
    if (!CONFIG.apCostChart?.chart) {
        console.warn('AP Cost Chart not loaded yet');
        return 0;
    }

    const chart = CONFIG.apCostChart.chart;
    const incrementalCosts = CONFIG.apCostChart.incrementalCostPerAPOver40;

    // For APs 1-40, use the chart directly
    if (aps <= 40) {
        const chartRow = chart[aps.toString()];
        if (chartRow) {
            return chartRow[factorCost - 1];
        }
    }

    // For APs over 40, calculate using base cost at 40 + incremental cost
    if (aps > 40) {
        const baseAPs = 40;
        const extraAPs = aps - baseAPs;
        const baseCost = chart[baseAPs.toString()][factorCost - 1];
        const incrementalCost = incrementalCosts[factorCost - 1];
        return baseCost + (extraAPs * incrementalCost);
    }

    console.warn(`Could not find AP cost for ${aps} APs at FC ${factorCost}`);
    return 0;
};
