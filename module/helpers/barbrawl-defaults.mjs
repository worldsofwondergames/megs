/**
 * Issue #290: default Bar Brawl bars for MEGS actors.
 *
 * Bar Brawl is an optional module. When it is enabled and the world has no Bar Brawl
 * defaults yet, the system stores bars for Current BODY, MIND and SPIRIT as Bar Brawl's
 * per-actor-type defaults. Bar Brawl then copies them onto each new actor's prototype token.
 */

export const BARBRAWL_MODULE_ID = 'barbrawl';
export const BARBRAWL_DEFAULTS_SETTING = 'defaultTypeResources';

// Bar Brawl visibility values are CONST.TOKEN_DISPLAY_MODES numbers; -1 means "same as owner".
const ALWAYS = 50;
const NONE = 0;
const SAME_AS_OWNER = -1;

const BARS = [
    { id: 'bar1', attribute: 'currentBody', mincolor: '#f9c8c8', maxcolor: '#ff0000', position: 'bottom-inner' },
    { id: 'bar2', attribute: 'currentMind', mincolor: '#000080', maxcolor: '#80B3FF', position: 'top-inner' },
    { id: 'bar3', attribute: 'currentSpirit', mincolor: '#d4f4b3', maxcolor: '#80FF00', position: 'bottom-inner' },
];

/**
 * Builds one actor type's bar set in the shape Bar Brawl stores.
 * @param {number} otherVisibility - What players who don't own the actor see.
 * @returns {Record<string, object>}
 */
function buildBars(otherVisibility) {
    return Object.fromEntries(BARS.map((bar, order) => [bar.id, {
        order,
        ...bar,
        otherVisibility,
        ownerVisibility: ALWAYS,
        gmVisibility: SAME_AS_OWNER,
        hideFull: false,
        hideEmpty: false,
        hideCombat: false,
        hideNoCombat: false,
        hideHud: false,
        indentLeft: null,
        indentRight: null,
        shareHeight: false,
        style: 'user',
        label: '',
        invert: false,
        invertDirection: false,
        subdivisions: null,
        subdivisionsOwner: false,
        fgImage: '',
        bgImage: '',
        opacity: null,
    }]));
}

/** Other players see a hero's bars but not a villain's or NPC's. */
export function getMegsBarBrawlDefaults() {
    return {
        hero: buildBars(ALWAYS),
        villain: buildBars(NONE),
        npc: buildBars(NONE),
    };
}

/**
 * Stores the MEGS bars as Bar Brawl's defaults when Bar Brawl is enabled and the world has
 * none yet. Only the active GM writes, so a world with several GMs connected writes once.
 * @param {Game} gameRef - The Foundry game object.
 * @returns {Promise<boolean>} Whether the defaults were written.
 */
export async function applyBarBrawlDefaults(gameRef) {
    if (!gameRef.modules.get(BARBRAWL_MODULE_ID)?.active) return false;
    if (!gameRef.users.activeGM?.isSelf) return false;

    const existing = gameRef.settings.get(BARBRAWL_MODULE_ID, BARBRAWL_DEFAULTS_SETTING) ?? {};
    if (Object.keys(existing).length > 0) return false;

    await gameRef.settings.set(BARBRAWL_MODULE_ID, BARBRAWL_DEFAULTS_SETTING, getMegsBarBrawlDefaults());
    return true;
}
