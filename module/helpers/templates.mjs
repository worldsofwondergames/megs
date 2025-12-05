/**
 * Define a set of template paths to pre-load
 * Pre-loaded templates are compiled and cached for fast access when rendering
 * @return {Promise}
 */
export const preloadHandlebarsTemplates = async function () {
    return loadTemplates([
        // Actor partials.
        'systems/megs/templates/actor/parts/actor-attributes.hbs',
        'systems/megs/templates/actor/parts/actor-header.hbs',
        'systems/megs/templates/actor/parts/actor-init-hp.hbs',
        'systems/megs/templates/actor/parts/actor-navigation.hbs',
        'systems/megs/templates/actor/parts/actor-description.hbs',
        'systems/megs/templates/actor/parts/actor-gadgets.hbs',
        'systems/megs/templates/actor/parts/actor-powers.hbs',
        'systems/megs/templates/actor/parts/actor-skills.hbs',
        'systems/megs/templates/actor/parts/actor-traits.hbs',
        // item partials
        'systems/megs/templates/item/parts/item-gadget-abilities.hbs',
        'systems/megs/templates/item/parts/item-gadget-attributes.hbs',
        'systems/megs/templates/item/parts/item-gadget-header.hbs',
        'systems/megs/templates/item/parts/item-gadget-omni-abilities.hbs',
        'systems/megs/templates/item/parts/item-gadget-omni-header.hbs',
        'systems/megs/templates/item/parts/item-gadget-powers.hbs',
        'systems/megs/templates/item/parts/item-gadget-skills.hbs',
        'systems/megs/templates/item/parts/item-header-name.hbs',
        'systems/megs/templates/item/parts/item-skill-calculator-header.hbs',
    ]);
};
