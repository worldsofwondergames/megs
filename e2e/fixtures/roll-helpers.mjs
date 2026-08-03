export async function isRollDialogOpen(page) {
    return page.evaluate(() => {
        for (const d of document.querySelectorAll('.dialog .megs-dialog')) {
            if (d.querySelector('#actionValue')) return true;
        }
        return false;
    });
}

export async function waitForRollDialog(page) {
    await page.waitForSelector('dialog.dialog[open] .megs-dialog #actionValue, .dialog .megs-dialog #actionValue', { timeout: 10000 });
}

export async function getRollDialogValues(page) {
    return page.evaluate(() => {
        const av = document.querySelector('.dialog .megs-dialog #actionValue');
        const ev = document.querySelector('.dialog .megs-dialog #effectValue');
        return {
            actionValue: av ? Number.parseInt(av.value) : null,
            effectValue: ev ? Number.parseInt(ev.value) : null,
        };
    });
}

/**
 * Activate a DialogV2 footer button by data-action.
 *
 * Only [open] dialogs are considered, so a closed dialog left in the DOM cannot
 * be picked instead of the dialog under test.
 *
 * The `footer` scope is required, not cosmetic: DialogV2 also puts
 * data-action="close" on the window header's X button, which appears first in
 * document order. Clicking that closes the dialog without running the dialog's
 * own close handling, so the test would pass without exercising the real path.
 *
 * DialogV2 footer buttons are type="submit". A Playwright locator.click() hangs
 * on them: submitting tears the dialog down while the click is still in flight,
 * so the actionability re-check never settles. requestSubmit() avoids that.
 *
 * There is deliberately no match-by-button-text fallback. Every DialogV2 footer
 * button carries a data-action, so a fallback could only ever paper over a
 * renamed action -- exactly the kind of break these tests exist to catch.
 */
async function clickDialogFooterButton(page, actions) {
    await page.evaluate((acts) => {
        const dialogs = [...document.querySelectorAll('dialog.dialog[open]')];
        for (const a of acts) {
            for (const dlg of dialogs) {
                const btn = dlg.querySelector(`footer button[data-action="${a}"]`);
                if (!btn) continue;
                const form = btn.closest('form');
                if (form && btn.type === 'submit') form.requestSubmit(btn);
                else btn.click();
                return;
            }
        }
        throw new Error(
            `No open dialog had a footer button with data-action in [${acts.join(', ')}]`
            + ` (${dialogs.length} open dialog(s))`
        );
    }, actions);
}

/**
 * True once the dialog holding `sel` is gone or closed.
 *
 * Must take the selector as a parameter: page functions are serialized and
 * evaluated in the browser, so a closure over an outer variable arrives
 * undefined and throws ReferenceError.
 */
function dialogClosed(sel) {
    const el = document.querySelector(sel);
    if (!el) return true;
    const dlg = el.closest('dialog');
    return dlg ? !dlg.open : false;
}

/**
 * Dismiss the open dialog identified by `selector` and wait for it to go away.
 *
 * The element is required to be present BEFORE the button is clicked. Waiting
 * for absence on its own passes instantly whenever the selector matches nothing,
 * so a renamed class would quietly turn this into a check that can never fail
 * rather than a failing test.
 */
async function dismissDialogContaining(page, selector, actions) {
    await page.waitForSelector(selector, { state: 'attached', timeout: 5000 });
    await clickDialogFooterButton(page, actions);
    await page.waitForFunction(dialogClosed, selector, { timeout: 5000 });
}

export async function closeRollDialog(page) {
    await dismissDialogContaining(page, '.dialog .megs-dialog #actionValue', ['close']);
}

export async function submitRollDialog(page, beforeCount) {
    await clickRollDialogSubmit(page);
    await page.waitForFunction(
        (before) => document.querySelectorAll('.chat-log .chat-message').length > before,
        beforeCount,
        { timeout: 10000 }
    );
}

export async function isPickerDialogOpen(page) {
    return page.evaluate(() => {
        for (const d of document.querySelectorAll('.dialog .megs-dialog')) {
            if (d.querySelector('input[name="selectedOption"]')) return true;
        }
        return false;
    });
}

export async function getPickerOptions(page) {
    return page.$$eval(
        '.dialog .megs-dialog .gadget-roll-option span',
        (spans) => spans.map(s => s.textContent.trim())
    );
}

export async function selectPickerOptionAndRoll(page, index) {
    await page.evaluate((idx) => {
        // Scope to the picker itself. Picking a radio in one dialog and then
        // submitting whichever dialog happens to come first in the DOM would
        // roll the wrong thing, and during the picker -> roll-dialog handoff
        // both are briefly present.
        const picker = [...document.querySelectorAll('dialog.dialog[open]')]
            .find(d => d.querySelector('input[name="selectedOption"]'));
        if (!picker) throw new Error('Picker dialog is not open');

        const radios = picker.querySelectorAll('input[name="selectedOption"]');
        // Fail loudly: a missing index used to fall through silently and roll
        // the default option, so the test could not tell one option from another.
        if (!radios[idx]) {
            throw new Error(`Picker option ${idx} not found (${radios.length} options present)`);
        }
        radios[idx].checked = true;

        const rollBtn = picker.querySelector('button[data-action="roll"]');
        if (rollBtn) {
            const form = rollBtn.closest('form');
            if (form && rollBtn.type === 'submit') { form.requestSubmit(rollBtn); return; }
            rollBtn.click();
            return;
        }
        for (const btn of picker.querySelectorAll('button')) {
            if (btn.textContent.trim().includes('Roll')) { btn.click(); return; }
        }
        throw new Error('No Roll button found in the picker dialog');
    }, index);
    await page.waitForSelector('.dialog .megs-dialog #actionValue', { timeout: 5000 });
}

export async function cancelPickerDialog(page) {
    await dismissDialogContaining(
        page,
        '.dialog .megs-dialog input[name="selectedOption"]',
        ['cancel', 'close']
    );
}

/**
 * Queue deterministic d10 results. Overrides Die.prototype.randomFace so the
 * next rolls consume the queued face values in order; once the queue is empty,
 * rolling falls back to real randomness. Also silences Dice So Nice so chat
 * messages appear immediately and doubles-confirm dialogs are not delayed
 * by 3D animations.
 */
export async function queueDice(page, values) {
    await page.evaluate((vals) => {
        const DieCls = foundry.dice.terms.Die;
        if (!window._e2eDice) {
            window._e2eDice = {
                origRandomFace: DieCls.prototype.randomFace,
                origShowForRoll: game.dice3d ? game.dice3d.showForRoll : null,
                origMessageHookDisabled: game.dice3d ? game.dice3d.messageHookDisabled : null,
            };
        }
        window._e2eDiceQueue = vals.slice();
        DieCls.prototype.randomFace = function () {
            const q = window._e2eDiceQueue;
            if (q?.length) return q.shift();
            return window._e2eDice.origRandomFace.call(this);
        };
        if (game.dice3d) {
            game.dice3d.messageHookDisabled = true;
            game.dice3d.showForRoll = async () => true;
        }
    }, values);
}

/** Restore real dice randomness and Dice So Nice behavior. */
export async function restoreDice(page) {
    await page.evaluate(() => {
        if (!window._e2eDice) return;
        foundry.dice.terms.Die.prototype.randomFace = window._e2eDice.origRandomFace;
        if (game.dice3d) {
            game.dice3d.showForRoll = window._e2eDice.origShowForRoll;
            game.dice3d.messageHookDisabled = window._e2eDice.origMessageHookDisabled;
        }
        window._e2eDice = null;
        window._e2eDiceQueue = null;
    });
}

/**
 * Fill fields in the open MEGS roll dialog. All parameters optional;
 * only provided values are changed.
 */
export async function fillRollDialog(page, { av, ev, ov, rv, maneuver, resultShifts } = {}) {
    await page.evaluate(({ av, ev, ov, rv, maneuver, resultShifts }) => {
        const dialog = document.querySelector('.dialog .megs-dialog');
        if (!dialog) throw new Error('Roll dialog not open');
        const set = (sel, value) => {
            const el = dialog.querySelector(sel);
            if (!el) throw new Error('Roll dialog field not found: ' + sel);
            el.value = String(value);
        };
        if (av !== undefined) set('#actionValue', av);
        if (ev !== undefined) set('#effectValue', ev);
        if (ov !== undefined) set('#opposingValue', ov);
        if (rv !== undefined) set('#resistanceValue', rv);
        if (resultShifts !== undefined) set('#resultColumnShiftsInput', resultShifts);
        if (maneuver !== undefined) {
            const select = dialog.querySelector('select[name="combatManeuver"]');
            if (!select) throw new Error('Combat maneuver select not found');
            select.value = maneuver;
        }
    }, { av, ev, ov, rv, maneuver, resultShifts });
}

/** Click Submit in the roll dialog without waiting for a chat message. */
export async function clickRollDialogSubmit(page) {
    await page.evaluate(() => {
        // Identify the roll dialog by its own field rather than taking whichever
        // dialog is first in the DOM, so a doubles prompt or a leftover dialog
        // cannot be submitted in its place.
        const rollDialog = [...document.querySelectorAll('dialog.dialog[open]')]
            .find(d => d.querySelector('#actionValue'));
        if (!rollDialog) throw new Error('Roll dialog is not open');

        const submitBtn = rollDialog.querySelector('button[data-action="submit"]');
        if (submitBtn) {
            const form = submitBtn.closest('form');
            if (form && submitBtn.type === 'submit') { form.requestSubmit(submitBtn); return; }
            submitBtn.click();
            return;
        }
        for (const btn of rollDialog.querySelectorAll('button')) {
            const text = btn.textContent.trim();
            if (text === 'Roll' || text === 'Submit') { btn.click(); return; }
        }
        throw new Error('Submit button not found in roll dialog');
    });
}

/**
 * Answer the "Continue Rolling?" doubles confirmation dialog.
 * Waits for the dialog to appear, then clicks Yes or No.
 */
export async function answerDoublesPrompt(page, continueRolling) {
    await page.waitForFunction(
        () => [...document.querySelectorAll('dialog.dialog[open]')].some(d =>
            !d.dataset.e2eAnswered &&
            [...d.querySelectorAll('.window-title, .window-header h1, h4')].some(el => el.textContent.includes('Continue Rolling'))),
        null,
        { timeout: 10000 }
    );
    await page.evaluate((yes) => {
        const dialog = [...document.querySelectorAll('dialog.dialog[open]')].find(d =>
            !d.dataset.e2eAnswered &&
            [...d.querySelectorAll('.window-title, .window-header h1, h4')].some(el => el.textContent.includes('Continue Rolling')));
        if (!dialog) throw new Error('Doubles confirm dialog not found');
        dialog.dataset.e2eAnswered = '1';
        const action = yes ? 'yes' : 'no';
        const actionBtn = dialog.querySelector(`button[data-action="${action}"]`);
        if (actionBtn) {
            const form = actionBtn.closest('form');
            if (form && actionBtn.type === 'submit') { form.requestSubmit(actionBtn); return; }
            actionBtn.click();
            return;
        }
        const label = yes ? 'Yes' : 'No';
        for (const btn of dialog.querySelectorAll('button')) {
            if (btn.textContent.trim().includes(label)) { btn.click(); return; }
        }
        throw new Error('Button not found in doubles dialog: ' + label);
    }, continueRolling);
}

/**
 * Parse the most recent MEGS roll chat message into structured data:
 * difficulty, dice faces, roll total, result text, effect table result,
 * and success/failure styling.
 */
export async function parseLatestRollMessage(page) {
    return page.evaluate(() => {
        const msgs = document.querySelectorAll('.chat-log .chat-message');
        if (!msgs.length) return null;
        const msg = msgs[msgs.length - 1];
        const text = msg.textContent;

        const difficultyMatch = /Difficulty:\s*(\d+)/.exec(text);
        const totalMatch = /=\s*(\d+)/.exec(text);
        const evResultMatch = /Effect table result:\s*([^\n]+)/.exec(text);
        const dice = [...msg.querySelectorAll('.d10')].map(d => Number.parseInt(d.textContent.trim()));

        const summaryResult = msg.querySelector('summary .chat-result');
        return {
            difficulty: difficultyMatch ? Number.parseInt(difficultyMatch[1]) : null,
            rollTotal: totalMatch ? Number.parseInt(totalMatch[1]) : null,
            dice,
            evResult: evResultMatch ? evResultMatch[1].trim() : null,
            resultText: summaryResult ? summaryResult.textContent.trim() : null,
            isSuccess: summaryResult ? summaryResult.classList.contains('success') : null,
            isFailure: summaryResult ? summaryResult.classList.contains('failure') : null,
            raw: text,
        };
    });
}

export async function getChatMessageCount(page) {
    return page.evaluate(() => document.querySelectorAll('.chat-log .chat-message').length);
}

export async function getLatestChatMessage(page) {
    return page.evaluate(() => {
        const msgs = document.querySelectorAll('.chat-log .chat-message');
        if (!msgs.length) return null;
        const msg = msgs[msgs.length - 1];
        const header = msg.querySelector('.message-header h4');
        return {
            header: header?.textContent?.trim() || null,
            html: msg.innerHTML,
            classes: Array.from(msg.classList),
        };
    });
}
