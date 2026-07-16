export async function showGadgetRollPicker(gadgetName, rollOptions) {
    const options = rollOptions.map((opt, idx) => ({
        ...opt,
        checked: idx === 0,
    }));
    const dialogHtml = await foundry.applications.handlebars.renderTemplate(
        'systems/megs/templates/dialogs/gadgetRollPicker.hbs',
        { options }
    );

    return foundry.applications.api.DialogV2.wait({
        window: { title: `${gadgetName} — ${game.i18n.localize('MEGS.GadgetRoll')}` },
        classes: ['megs', 'dialog'],
        content: dialogHtml,
        buttons: [
            {
                action: 'roll',
                label: game.i18n.localize('MEGS.Roll'),
                default: true,
                callback: (event, button, dialog) => {
                    const idx = Number.parseInt(
                        button.form.querySelector('input[name="selectedOption"]:checked')?.value ?? '0'
                    );
                    return rollOptions[idx];
                },
            },
            {
                action: 'cancel',
                label: game.i18n.localize('MEGS.Close'),
                callback: () => null,
            },
        ],
        rejectClose: false,
    });
}
