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
        (before) => document.querySelectorAll('#chat-log .chat-message').length > before,
        { timeout: 10000 },
        beforeCount
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
        { timeout: 5000 }
    );
}

export async function getChatMessageCount(page) {
    return page.evaluate(() => document.querySelectorAll('#chat-log .chat-message').length);
}

export async function getLatestChatMessage(page) {
    return page.evaluate(() => {
        const msgs = document.querySelectorAll('#chat-log .chat-message');
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
