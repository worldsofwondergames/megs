/**
 * Manage Active Effect instances through an Actor or Item Sheet via effect control buttons.
 * @param {MouseEvent} event      The left-click event on the effect control
 * @param {Actor|Item} owner      The owning document which manages this effect
 */
export async function onManageActiveEffect(event, owner) {
    event.preventDefault();
    const a = event.currentTarget;
    const li = a.closest('li');
    const effect = li.dataset.effectId ? owner.effects.get(li.dataset.effectId) : null;
    switch (a.dataset.action) {
        case 'create':
            return owner.createEmbeddedDocuments('ActiveEffect', [
                {
                    name: game.i18n.format('MEGS.New', {
                        type: game.i18n.localize('MEGS.ActiveEffect'),
                    }),
                    icon: 'icons/svg/aura.svg',
                    origin: owner.uuid,
                    'duration.rounds': li.dataset.effectType === 'temporary' ? 1 : undefined,
                    disabled: li.dataset.effectType === 'inactive',
                },
            ]);
        case 'edit':
            return effect.sheet.render(true);
        case 'delete':
            const confirmed = await Dialog.confirm({
                title: `Delete Active Effect: ${effect.name}`,
                content: `<p style="font-family: Helvetica, Arial, sans-serif;"><strong>Are You Sure?</strong> This item will be permanently deleted and cannot be recovered.</p>`,
                defaultYes: false,
                options: {
                    classes: ['megs', 'dialog']
                }
            });
            if (confirmed) {
                return effect.delete();
            }
            break;
        case 'toggle':
            return effect.update({ disabled: !effect.disabled });
    }
}

/**
 * Prepare the data structure for Active Effects which are currently embedded in an Actor or Item.
 * @param {ActiveEffect[]} effects    A collection or generator of Active Effect documents to prepare sheet data for
 * @return {object}                   Data for rendering
 */
export function prepareActiveEffectCategories(effects) {
    // Define effect header categories
    const categories = {
        temporary: {
            type: 'temporary',
            label: game.i18n.localize('MEGS.Effects.Temporary'),
            effects: [],
        },
        passive: {
            type: 'passive',
            label: game.i18n.localize('MEGS.Effects.Passive'),
            effects: [],
        },
        inactive: {
            type: 'inactive',
            label: game.i18n.localize('MEGS.Effects.Inactive'),
            effects: [],
        },
    };

    // Iterate over active effects, classifying them into categories
    for (let e of effects) {
        if (e.disabled) categories.inactive.effects.push(e);
        else if (e.isTemporary) categories.temporary.effects.push(e);
        else categories.passive.effects.push(e);
    }
    return categories;
}
