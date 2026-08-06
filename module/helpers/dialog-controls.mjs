/**
 * Behaviour for markup that has to survive Foundry's HTML sanitizer.
 *
 * Foundry v14's DialogV2 runs string `content` through `foundry.utils.cleanHTML()`,
 * an allow-list sanitizer that strips every inline `on*` attribute. Any markup that
 * can appear inside a dialog therefore cannot carry its own behaviour in the
 * template and must be wired up after render.
 *
 * Both helpers bind on explicit `data-` attributes rather than on class names, so
 * they only ever attach to markup written for them. Several sheet templates still
 * use inline handlers; those are ApplicationV1, are never sanitized, and must not
 * also be driven from here or every click would be counted twice.
 */

/**
 * Add `delta` to `rawValue`, clamped to the `rawMin`/`rawMax` bounds.
 *
 * All three inputs arrive as HTML attribute strings. An absent min/max reads as
 * an empty string and means "unbounded", which has to be special-cased because
 * Number('') is 0 -- treating it as a bound would pin every unbounded stepper to
 * zero. A blank or non-numeric current value is treated as 0 so a cleared field
 * still steps rather than going NaN.
 *
 * Exported separately from the DOM wiring so the arithmetic can be tested
 * without a DOM.
 *
 * @param {string} rawValue   The input's current value attribute
 * @param {number} delta      How much to add (typically 1 or -1)
 * @param {string} rawMin     The input's min attribute, '' when unbounded
 * @param {string} rawMax     The input's max attribute, '' when unbounded
 * @returns {number}          The new value, within bounds
 */
export function stepValue(rawValue, delta, rawMin, rawMax) {
    const min = rawMin === '' || rawMin === undefined || rawMin === null
        ? Number.NEGATIVE_INFINITY
        : Number(rawMin);
    const max = rawMax === '' || rawMax === undefined || rawMax === null
        ? Number.POSITIVE_INFINITY
        : Number(rawMax);
    const current = Number.parseInt(rawValue, 10);
    const next = (Number.isNaN(current) ? 0 : current) + delta;
    return Math.min(max, Math.max(min, next));
}

/**
 * Wire the -/+ buttons of every `[data-control="stepper"]` group under `root`.
 *
 * The buttons must be type="button". Left as the default type="submit" they
 * submit the surrounding form, which inside a DialogV2 closes the dialog and
 * discards the roll.
 */
export function activateStepperControls(root) {
    for (const group of root.querySelectorAll('[data-control="stepper"]')) {
        const input = group.querySelector('input');
        if (!input) continue;
        for (const button of group.querySelectorAll('button[data-step]')) {
            button.addEventListener('click', (event) => {
                event.preventDefault();
                input.value = String(
                    stepValue(input.value, Number(button.dataset.step), input.min, input.max)
                );
            });
        }
    }
}

/**
 * Keep each range input's readout element in step with its value.
 *
 * The readout is synced once on attach as well as on input: a slider whose max is
 * 0 can never fire an input event, and its readout would otherwise be whatever
 * the template hardcoded.
 */
export function activateRangeReadouts(root) {
    for (const input of root.querySelectorAll('input[type="range"][data-readout]')) {
        const readout = root.querySelector(`#${CSS.escape(input.dataset.readout)}`);
        if (!readout) continue;
        const sync = () => {
            readout.textContent = input.value;
        };
        input.addEventListener('input', sync);
        sync();
    }
}

/** Attach every control behaviour a MEGS dialog needs. Safe on a null element. */
export function activateDialogControls(root) {
    if (!root) return;
    activateStepperControls(root);
    activateRangeReadouts(root);
}
