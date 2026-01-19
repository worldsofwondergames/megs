import { MEGS } from '../helpers/config.mjs';

// eslint-disable-next-line no-undef
export default class MEGSCombat extends Combat {
    /**
     * Overriding this because superclass throws error if no this.previous (i.e., onLoad)
     * @param {*} adjustedTurn
     * @returns
     * @override
     */
    async _manageTurnEvents(adjustedTurn) {
        // eslint-disable-next-line no-undef
        if (!game.users.activeGM?.isSelf) return;
        let prior;
        if (this.previous) {
            prior = this.combatants.get(this.previous.combatantId);
        }

        // Adjust the turn order before proceeding. Used for embedded document workflows
        if (Number.isNumeric(adjustedTurn))
            await this.update({ turn: adjustedTurn }, { turnEvents: false });
        if (!this.started) return;

        // Identify what progressed
        const advanceRound = this.current.round > (this.previous.round ?? -1);
        const advanceTurn = this.current.turn > (this.previous.turn ?? -1);
        if (!(advanceTurn || advanceRound)) return;

        // Conclude prior turn
        if (prior) await this._onEndTurn(prior);

        // Conclude prior round
        if (advanceRound && this.previous.round !== null) await this._onEndRound();

        // Begin new round
        if (advanceRound) await this._onStartRound();

        // Begin a new turn
        await this._onStartTurn(this.combatant);
    }

    /** @override */
    _sortCombatants(a, b) {
        const initA = Number.isNumeric(a.initiative) ? a.initiative : -9999;
        const initB = Number.isNumeric(b.initiative) ? b.initiative : -9999;

        const initDifference = initB - initA;
        if (initDifference !== 0) {
            return initDifference;
        }

        const typeA = a.actor.type;
        const typeB = b.actor.type;

        if (typeA !== typeB) {
            if (typeA === MEGS.characterTypes.hero) {
                return -1;
            }
            if (typeB === MEGS.characterTypes.hero) {
                return 1;
            }
        }

        return a.tokenId - b.tokenId;
    }

    /** @override */
    async nextRound() {
        // TODO reroll initiative if no history beyond this exists
        return super.nextRound();
    }

    // https://discord.com/channels/170995199584108546/670336275496042502/1220016156396621914
    /** @override */
    async rollInitiative(ids, { formula = null, updateTurn = true, messageOptions = {} } = {}) {
        // Structure input data
        ids = typeof ids === 'string' ? [ids] : ids;
        const currentId = this.combatant?.id;
        // eslint-disable-next-line no-undef
        const chatRollMode = game.settings.get('core', 'rollMode');

        // Iterate over Combatants, performing an initiative roll for each
        const updates = [];
        const messages = [];
        for (const [i, id] of ids.entries()) {
            // Get Combatant data (non-strictly)
            const combatant = this.combatants.get(id);
            if (!combatant?.isOwner) continue;

            // prompt for HP spent on initiative
            const actor = game.actors.get(combatant.actorId);
            const hpToAdd = await this.getHeroPointsForInitiative(
                actor.name,
                actor.system.heroPoints.value
            );

            // Produce an initiative roll for the Combatant
            const roll = combatant.getInitiativeRoll(formula, hpToAdd);
            await roll.evaluate();
            updates.push({ _id: id, initiative: roll.total });

            // Construct chat message data
            // eslint-disable-next-line no-undef
            const messageData = foundry.utils.mergeObject(
                {
                    // eslint-disable-next-line no-undef
                    speaker: ChatMessage.getSpeaker({
                        actor: combatant.actor,
                        token: combatant.token,
                        alias: combatant.name,
                    }),
                    // eslint-disable-next-line no-undef
                    flavor: game.i18n.format('COMBAT.RollsInitiative', { name: combatant.name }),
                    flags: { 'core.initiativeRoll': true },
                },
                messageOptions
            );
            const chatData = await roll.toMessage(messageData, { create: false });

            // If the combatant is hidden, use a private roll unless an alternative rollMode was explicitly requested
            chatData.rollMode =
                'rollMode' in messageOptions
                    ? messageOptions.rollMode
                    : // eslint-disable-next-line no-undef
                      combatant.hidden
                      ? CONST.DICE_ROLL_MODES.PRIVATE
                      : chatRollMode;

            // Play 1 sound for the whole rolled set
            if (i > 0) chatData.sound = null;
            messages.push(chatData);
        }
        if (!updates.length) return this;

        // Update multiple combatants
        await this.updateEmbeddedDocuments('Combatant', updates);

        // Ensure the turn order remains with the same combatant
        if (updateTurn && currentId) {
            await this.update({ turn: this.turns.findIndex((t) => t.id === currentId) });
        }

        // Create multiple chat messages
        // eslint-disable-next-line no-undef
        await ChatMessage.implementation.create(messages);
        return this;
    }

    /**
     *
     * @param combatantName
     * @param {*} maxHpToSpend
     */
    async getHeroPointsForInitiative(combatantName, maxHpToSpend) {
        const template = 'systems/megs/templates/actor/dialogs/initiativeDialog.hbs';
        const data = {
            maxHpToSpend: maxHpToSpend,
        };
        let dialogHtml = await foundry.applications.handlebars.renderTemplate(template, data);
        let label =
            game.i18n.localize('MEGS.HeroPoints') + ' - ' + game.i18n.localize('MEGS.Initiative');
        if (combatantName) {
            label = combatantName + ' - ' + game.i18n.localize('MEGS.Initiative');
        }

        return await new Promise((resolve, reject) => {
            const d = new Dialog({
                title: label,
                content: dialogHtml,
                buttons: {
                    button2: {
                        label: game.i18n.localize('MEGS.Close'),
                        callback: (html) => {},
                    },
                    button1: {
                        label: game.i18n.localize('MEGS.Roll'),
                        callback: (html) => {
                            const response = this._processHeroPointsEntry(
                                html[0].querySelector('form')
                            );
                            resolve(response.hpSpentInitiative);
                        },
                    },
                },
                default: 'button1',
            }).render(true);
        }).catch((err) => {
            throw err;
        });
    }

    /**
     *
     * @returns
     */
    _processHeroPointsEntry(form) {
        return {
            hpSpentInitiative: parseInt(form.hpSpentInitiative.value) || 0,
        };
    }
}
