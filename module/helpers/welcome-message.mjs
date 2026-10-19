/**
 * Issue #309: welcome chat card.
 *
 * The first time a user opens a MEGS world, the system whispers them a chat card with
 * links to the issue tracker and to Ko-fi. A user flag records that the card was posted,
 * so each user sees it once.
 */

export const WELCOME_FLAG = 'welcomeMessageShown';
export const WELCOME_TEMPLATE = 'systems/megs/templates/chat/welcome-message.hbs';

export const WELCOME_LINKS = {
    issues: 'https://github.com/worldsofwondergames/megs/issues',
    kofi: 'https://ko-fi.com/worldsofwonder',
};

/**
 * Posts the welcome card to the current user unless they have already been shown it.
 * @param {Game} game
 * @param {object} deps
 * @param {Function} deps.renderTemplate - foundry.applications.handlebars.renderTemplate
 * @param {typeof ChatMessage} deps.ChatMessage
 * @returns {Promise<boolean>} Whether a card was posted.
 */
export async function showWelcomeMessage(game, { renderTemplate, ChatMessage }) {
    const user = game.user;
    if (user.getFlag('megs', WELCOME_FLAG)) return false;

    const content = await renderTemplate(WELCOME_TEMPLATE, { links: WELCOME_LINKS });
    await ChatMessage.create({
        content,
        author: user.id,
        whisper: [user.id],
        speaker: { alias: game.i18n.localize('MEGS.Welcome.Speaker') },
        flags: { core: { canPopout: true }, megs: { welcome: true } },
    });

    // Set only after the card exists, so a failed post is tried again next time.
    await user.setFlag('megs', WELCOME_FLAG, true);
    return true;
}
