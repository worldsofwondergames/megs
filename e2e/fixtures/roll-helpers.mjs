export async function isRollDialogOpen(page) {
    return page.evaluate(() => {
        for (const d of document.querySelectorAll('.dialog .megs-dialog')) {
            if (d.querySelector('#actionValue')) return true;
        }
        return false;
    });
}

export async function waitForRollDialog(page) {
    await page.waitForSelector('.dialog .megs-dialog #actionValue', { timeout: 5000 });
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

export async function closeRollDialog(page) {
    await page.evaluate(() => {
        for (const btn of document.querySelectorAll('.dialog button')) {
            if (btn.textContent.includes('Close')) { btn.click(); return; }
        }
    });
    await page.waitForFunction(
        () => !document.querySelector('.dialog .megs-dialog #actionValue'),
        null,
        { timeout: 5000 }
    );
}

export async function submitRollDialog(page, beforeCount) {
    await page.evaluate(() => {
        for (const btn of document.querySelectorAll('.dialog button')) {
            const text = btn.textContent.trim();
            if (text === 'Roll' || text === 'Submit') { btn.click(); return; }
        }
    });
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
        const radios = document.querySelectorAll('.dialog .megs-dialog input[name="selectedOption"]');
        if (radios[idx]) radios[idx].checked = true;
    }, index);
    await page.click('.dialog button:has-text("Roll")');
    await page.waitForSelector('.dialog .megs-dialog #actionValue', { timeout: 5000 });
}

export async function cancelPickerDialog(page) {
    await page.evaluate(() => {
        for (const btn of document.querySelectorAll('.dialog button')) {
            if (btn.textContent.includes('Close')) { btn.click(); return; }
        }
        const x = document.querySelector('.dialog .header-button.close');
        if (x) x.click();
    });
    await page.waitForFunction(
        () => !document.querySelector('.dialog .megs-dialog input[name="selectedOption"]'),
        null,
        { timeout: 5000 }
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
        for (const btn of document.querySelectorAll('.dialog button')) {
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
    // Answered dialogs are tagged with data-e2e-answered so consecutive
    // prompts are not confused with a prior dialog that is still closing.
    await page.waitForFunction(
        () => [...document.querySelectorAll('.dialog')].some(d =>
            !d.dataset.e2eAnswered &&
            [...d.querySelectorAll('.window-title, h4')].some(el => el.textContent.includes('Continue Rolling'))),
        null,
        { timeout: 10000 }
    );
    await page.evaluate((yes) => {
        const dialog = [...document.querySelectorAll('.dialog')].find(d =>
            !d.dataset.e2eAnswered &&
            [...d.querySelectorAll('.window-title, h4')].some(el => el.textContent.includes('Continue Rolling')));
        if (!dialog) throw new Error('Doubles confirm dialog not found');
        dialog.dataset.e2eAnswered = '1';
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
