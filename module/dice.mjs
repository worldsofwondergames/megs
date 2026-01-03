export const ShowResultCall = Object.freeze({
    FAILURE: 0,
    ALL_RESULT: 1,
    NO_EFFECT: 2,
    SUCCESS: 3,
    DOUBLE_1S: 4,
});

/* The Action Table is set up so that any roll over 11 might earn the Player a Column Shift.
    Notice that the 11's split the Action Table in two. This is the Column Shift Threshold. */
const COLUMN_SHIFT_THRESHOLD = 11;

export class MegsRoll extends Roll {
    async toMessage(dialogHtml = {}, { rollMode, create = true, speaker = null } = {}) {
        const messageData = {
            user: game.user.id,
            rolls: [this],
            content: dialogHtml,
            sound: CONFIG.sounds.dice,
        };

        if (speaker) {
            messageData.speaker = speaker;
        }

        return await ChatMessage.create(messageData);
    }
}

export class RollValues {
    constructor(
        label,
        type,
        valueOrAps,
        actionValue,
        opposingValue,
        effectValue,
        resistanceValue,
        rollFormula,
        unskilled
    ) {
        this.label = label;
        this.type = type; // attribute, power, skill
        this.valueOrAps = valueOrAps; // used solely to calculate maxHpToSpend
        this.actionValue = actionValue;
        this.opposingValue = opposingValue;
        this.effectValue = effectValue;
        this.resistanceValue = resistanceValue;
        this.rollFormula = rollFormula ? rollFormula : '1d10 + 1d10';
        this.unskilled = unskilled || false;
    }
}

export class MegsTableRolls {
    constructor(rollValues, speaker = null) {
        this.valueOrAps = rollValues.valueOrAps;
        this.type = rollValues.type;
        this.actionValue = rollValues.actionValue;
        this.opposingValue = rollValues.opposingValue;
        this.effectValue = rollValues.effectValue;
        this.resistanceValue = rollValues.resistanceValue;
        this.rollFormula = rollValues.rollFormula;
        this.label = rollValues.label;
        this.isUnskilled = rollValues.unskilled;
        this.speaker = speaker;
    }

    async roll(event, currentHeroPoints) {
        if (event) {
            event.preventDefault();
        }

        // Handle rolls that supply the formula directly.
        if (this.rollFormula) {
            await this._handleRoll(currentHeroPoints);
        }
    }

    /**
     *
     * @param currentHeroPoints
     * @returns {Promise<void>}
     * @private
     */
    async _handleRoll(currentHeroPoints) {
        // what's being rolled (used for display)
        let label = this.label ? `${this.label}` : '';
        if (this.isUnskilled) {
            label += ' (Unskilled)';
        }

        // TODO does not currently handle > 60 for either AV or OV

        // Manually enter OV and RV for target
        if (game.user.targets.size === 0) {
            console.info('Showing roll dialog from MegsTableRolls_handleRoll() without a target');
            const template = 'systems/megs/templates/dialogs/rollDialog.hbs';
            const maxHpToSpend = Math.min(currentHeroPoints, this.valueOrAps);
            const data = {
                valueOrAps: this.valueOrAps,
                maxHpToSpend: maxHpToSpend,
                isTargeted: false,
                combatManeuvers: CONFIG.combatManeuvers,
                actionValue: this.actionValue,
                opposingValue: this.opposingValue,
                effectValue: this.effectValue,
                resistanceValue: this.resistanceValue,
                isUnskilled: this.isUnskilled,
            };
            const dialogHtml = await this._renderTemplate(template, data);

            new Dialog({
                title: label,
                content: dialogHtml,
                buttons: {
                    button2: {
                        label: game.i18n.localize('MEGS.Close'),
                        callback: () => {},
                    },
                    button1: {
                        label: `<i class="fas fa-dice-d10"></i> ${game.i18n.localize('MEGS.Roll')}`,
                        callback: (html) => {
                            const response = this._processOpposingValuesEntry(
                                html[0].querySelector('form')
                            );
                            this.actionValue = response.actionValue;
                            this.effectValue = response.effectValue;
                            this.opposingValue = response.opposingValue;
                            this.resistanceValue = response.resistanceValue;
                            this.isUnskilled = response.isUnskilled;
                            this._handleRolls(
                                currentHeroPoints,
                                maxHpToSpend,
                                response.hpSpentAV,
                                response.hpSpentEV,
                                response.hpSpentOV,
                                response.hpSpentRV,
                                response.combatManeuver,
                                response.resultColumnShifts,
                                response.isUnskilled
                            );
                        },
                    },
                },
                default: 'button1',
            }, {
                classes: ['megs', 'dialog']
            }).render(true);
        } else if (game.user.targets.size > 1) {
            ui.notifications.warn(localize('MEGS.ErrorMessages.OnlyOneTarget'));
        } else {
            // use target token for OV and RV values
            await this._handleTargetedRolls(label);
        }
    }

    /**
     *
     * @param {*} currentHeroPoints
     */
    async _handleTargetedRolls(currentHeroPoints) {
        console.info('Showing roll dialog from MegsTableRolls._handleTargetedRolls()');

        const template = 'systems/megs/templates/dialogs/rollDialog.hbs';
        const maxHpToSpend = Math.min(currentHeroPoints, this.valueOrAps);
        const data = {
            valueOrAps: this.valueOrAps,
            maxHpToSpend: maxHpToSpend,
            isTargeted: true,
            combatManeuvers: CONFIG.combatManeuvers,
            actionValue: this.actionValue,
            opposingValue: this.opposingValue,
            effectValue: this.effectValue,
            resistanceValue: this.resistanceValue,
            isUnskilled: this.isUnskilled,
        };
        const dialogHtml = await this._renderTemplate(template, data);

        new Dialog({
            title: this.label,
            content: dialogHtml,
            buttons: {
                button2: {
                    label: 'Close',
                    callback: () => {},
                },
                button1: {
                    label: 'Submit',
                    callback: (html) => {
                        const response = this._processOpposingValuesEntry(
                            html[0].querySelector('form')
                        );
                        this.actionValue = response.actionValue;
                        this.effectValue = response.effectValue;
                        this.opposingValue = response.opposingValue;
                        this.resistanceValue = response.resistanceValue;
                        this.isUnskilled = response.isUnskilled;
                        this._handleRolls(
                            currentHeroPoints,
                            maxHpToSpend,
                            response.hpSpentAV,
                            response.hpSpentEV,
                            response.hpSpentOV,
                            response.hpSpentRV,
                            response.combatManeuver,
                            response.resultColumnShifts,
                            response.isUnskilled
                        );
                    },
                },
            },
            default: 'button1',
        }, {
            classes: ['megs', 'dialog']
        }).render(true);
    }

    /**
     *
     * @returns
     */
    async _handleRolls(
        currentHeroPoints,
        maxHpToSpend,
        hpSpentAV,
        hpSpentEV,
        hpSpentOV,
        hpSpentRV,
        combatManeuverKey,
        resultColumnShifts,
        isUnskilled
    ) {
        console.error(
            'dice._handleRolls: currentHeroPoints=' +
                currentHeroPoints +
                ' maxHpToSpend=' +
                maxHpToSpend +
                ' hpSpentAV=' +
                hpSpentAV +
                ' hpSpentEV=' +
                hpSpentEV +
                ' hpSpentOV=' +
                hpSpentOV +
                ' hpSpentRV=' +
                hpSpentRV +
                ' combatManeuverKey=' +
                combatManeuverKey +
                ' resultColumnShifts=' +
                resultColumnShifts +
                ' isUnskilled=' +
                isUnskilled
        );

        // TODO deduct spent Hero Points
        //      await this.object.update({"system.heroPoints.value": currentHeroPoints - (hpSpentAV + hpSpentEV)});

        /**********************************
         * CUSTOM COLUMN SHIFTS
         **********************************/
        let ovColumnShifts = 0;
        let rvColumnShifts = 0;
        if (isUnskilled) {
            ovColumnShifts = ovColumnShifts - 2;
            rvColumnShifts = rvColumnShifts - 2;
        }
        if (combatManeuverKey) {
            const combatManeuver = CONFIG.combatManeuvers[combatManeuverKey];
            ovColumnShifts += parseInt(combatManeuver.ovShifts);
            rvColumnShifts += parseInt(combatManeuver.rvShifts);
        }
        if (resultColumnShifts) {
            rvColumnShifts += resultColumnShifts;
        }

        /**********************************
         * ACTION TABLE
         **********************************/
        const avAdjusted = parseInt(this.actionValue) + parseInt(hpSpentAV);

        let avInfo = '';
        // Only show tooltip if there's additional information beyond base value
        if (hpSpentAV > 0) {
            avInfo +=
                '<table class="init-table">' +
                '    <tr>' +
                '        <td class="label">' +
                game.i18n.localize('MEGS.Base') +
                ' AV' +
                '</td>' +
                '        <td class="value">' +
                this.actionValue +
                '</td>' +
                '    </tr>';
            avInfo +=
                '    <tr>' +
                '        <td class="label">HP ' +
                game.i18n.localize('MEGS.Spent') +
                '</td>' +
                '        <td class="value">+' +
                hpSpentAV +
                '</td>' +
                '    </tr>';
            avInfo += '</table>';
        }

        const ovAdjusted = this.opposingValue + hpSpentOV;

        let ovInfo = '';
        if (hpSpentOV > 0) {
            ovInfo +=
                '<table class="init-table">' +
                '    <tr>' +
                '        <td class="label">' +
                game.i18n.localize('MEGS.Base') +
                ' OV' +
                '</td>' +
                '        <td class="value">' +
                this.opposingValue +
                '</td>' +
                '    </tr>';
            ovInfo +=
                '    <tr>' +
                '        <td class="label">HP ' +
                game.i18n.localize('MEGS.Spent') +
                '</td>' +
                '        <td class="value">+' +
                hpSpentOV +
                '</td>' +
                '    </tr>';
            ovInfo += '</table>';
        }

        // consult action chart for difficulty
        const difficulty = this._getActionTableDifficulty(avAdjusted, ovAdjusted, ovColumnShifts);

        // determine whether happens
        const avRoll = new MegsRoll(this.rollFormula, {});

        // Execute the roll
        await avRoll.evaluate();

        let dice = [];
        let resultData = {
            result: '',
            actionValue: avAdjusted,
            actionValueInfo: avInfo,
            opposingValue: ovAdjusted,
            opposingValueInfo: ovInfo,
            difficulty: difficulty,
            dice: dice,
            columnShifts: 0,
            effectValue: 0,
            resistanceValue: 0,
            success: false,
            evResult: '',
            rvColumnShifts: rvColumnShifts,
            columnShiftText: '',
            rollTotal: 0,
        };
        await this._rollDice(resultData, avRoll).then((response) => {
            dice = response;
        });
        resultData.dice = dice;

        let avRollTotal = 0;
        dice.forEach((die) => {
            avRollTotal = avRollTotal + parseInt(die);
        });
        resultData.rollTotal = avRollTotal;

        if (parseInt(dice[dice.length - 2]) === 1 && parseInt(dice[dice.length - 1]) === 1) {
            // dice are both 1s
            resultData.result = game.i18n.localize('MEGS.Double1s');
            await this._showRollResultInChat(resultData, avRoll, ShowResultCall.DOUBLE_1S);

            return dice;
        }

        // return dice
        resultData.avRollSuccess = avRollTotal >= difficulty;

        // if fails, output message
        if (!resultData.avRollSuccess) {
            resultData.result = game.i18n.localize('MEGS.ActionFailed');
            await this._showRollResultInChat(resultData, avRoll, ShowResultCall.FAILURE);

            return dice;
        }

        // if succeeds, calculate column shifts for result table
        const avIndex = this._getRangeIndex(avAdjusted);
        const ovIndex = this._getRangeIndex(ovAdjusted) - ovColumnShifts;
        const rollColumnShifts = this._getColumnShifts(
            avRollTotal,
            avIndex,
            ovIndex,
            CONFIG.tables.actionTable
        );
        const columnShifts = rollColumnShifts + rvColumnShifts;
        resultData.columnShifts = columnShifts;

        // Build explanation text for column shifts
        // Only show tooltip if there are modifiers beyond just the base roll result
        let shiftExplanation = '';
        if (rvColumnShifts !== 0 || combatManeuverKey || isUnskilled || resultColumnShifts) {
            shiftExplanation += '<table class="init-table">';

            // Show base column shifts from roll
            if (rollColumnShifts !== 0) {
                shiftExplanation +=
                    '    <tr>' +
                    '        <td class="label">' + game.i18n.localize('MEGS.RollResult') + '</td>' +
                    '        <td class="value">' + (rollColumnShifts >= 0 ? '+' : '') + rollColumnShifts + '</td>' +
                    '    </tr>';
            }

            // Show combat maneuver contribution
            if (combatManeuverKey) {
                const combatManeuver = CONFIG.combatManeuvers[combatManeuverKey];
                const maneuverShifts = parseInt(combatManeuver.rvShifts);
                if (maneuverShifts !== 0) {
                    shiftExplanation +=
                        '    <tr>' +
                        '        <td class="label">' + combatManeuverKey + '</td>' +
                        '        <td class="value">' + (maneuverShifts >= 0 ? '+' : '') + maneuverShifts + '</td>' +
                        '    </tr>';
                }
            }

            // Show unskilled penalty
            if (isUnskilled) {
                shiftExplanation +=
                    '    <tr>' +
                    '        <td class="label">' + game.i18n.localize('MEGS.Unskilled') + '</td>' +
                    '        <td class="value">-2</td>' +
                    '    </tr>';
            }

            // Show result table shifts
            if (resultColumnShifts && resultColumnShifts !== 0) {
                shiftExplanation +=
                    '    <tr>' +
                    '        <td class="label">' + game.i18n.localize('MEGS.ResultTableShifts') + '</td>' +
                    '        <td class="value">' + (resultColumnShifts >= 0 ? '+' : '') + resultColumnShifts + '</td>' +
                    '    </tr>';
            }

            shiftExplanation += '</table>';
        }
        resultData.columnShiftText = shiftExplanation;

        // TODO handle totals greater than 60 on table

        /**********************************
         * RESULT TABLE
         **********************************/
        const resultTable = CONFIG.tables.resultTable;

        // get effect value column  index
        const evAdjusted = this.effectValue + hpSpentEV;
        const evIndex = this._getRangeIndex(evAdjusted);
        resultData.effectValue = evAdjusted;

        // get resistance value column index
        const rvAdjusted = this.resistanceValue + hpSpentRV;
        const rvIndex = this._getRangeIndex(rvAdjusted) + ovColumnShifts;
        resultData.resistanceValue = rvAdjusted;

        // apply shifts
        // Column Shifts on the Result Table are made to the left, decreasing numbers in the Resistance Value row,
        // but increasing the number of Result APs within the Table itself
        let shiftedRvIndex = rvIndex - columnShifts;
        if (shiftedRvIndex <= 0) {
            // calculate column shifts that push past the 0 column
            // If the result is in the +1 Column, add 1 AP to your Result APs for every time you shift into this Column.
            const resultAPs = evAdjusted + Math.abs(shiftedRvIndex);

            // If the result is an 'N' then there is No Effect
            if (resultAPs === 0) {
                // TOD this does not show EV/OV - find a better way to handle
                resultData.result = game.i18n.localize('MEGS.NoEffect');
                resultData.success = true;
                resultData.evResult = 'N';
            } else {
                // "All" result on table - Result APs = Effect Value
                // If the Result is an 'A,' then the RAPs are equal to the APs of the Effect Value.
                // TODO does the ALL result include any ranks purchased with Hero Points?
                resultData.result =
                    game.i18n.localize('MEGS.Success') + ': ' + resultAPs + ' RAPs!';
                resultData.success = true;
                resultData.evResult = 'A (' + evAdjusted + ')';
            }
            if (shiftedRvIndex !== 0) {
                resultData.evResult = resultData.evResult + ' + ' + Math.abs(shiftedRvIndex);
            }

            await this._showRollResultInChat(resultData, avRoll, ShowResultCall.ALL_RESULT);
            return resultAPs;
        }

        // consult result chart
        const resultAPs = resultTable[evIndex][shiftedRvIndex];

        // If the result is an 'N' then there is No Effect
        if (resultAPs === 0) {
            resultData.result = game.i18n.localize('MEGS.NoEffect');
            resultData.success = false;
            resultData.evResult = 'N';

            await this._showRollResultInChat(resultData, avRoll, ShowResultCall.NO_EFFECT);
            return dice;
        }

        // results output to chat
        resultData.result = game.i18n.localize('MEGS.Success') + ': ' + resultAPs + ' RAPs!';
        resultData.success = true;
        resultData.evResult = resultAPs;
        await this._showRollResultInChat(resultData, avRoll, ShowResultCall.SUCCESS);

        return resultAPs;
    }

    /**
     *
     * @param {*} data
     * @param {Roll} initialRoll - The initial roll object to extract dice from
     * @returns
     */
    async _rollDice(data, initialRoll) {
        let dice = [];
        let stopRolling = false;
        if (data) {
            if (data.columnShifts) {
                data['isOneColumnShift'] = data.columnShifts === 1;
            } else {
                data.columnShifts = 0;
                data['isOneColumnShift'] = false;
            }
        }

        // Use the initial roll if provided and valid, otherwise create a new one
        let currentRoll;
        let isFirstRoll = true;
        if (initialRoll && (initialRoll.terms || initialRoll.result)) {
            currentRoll = initialRoll;
        } else {
            // Fallback: create new roll (for tests or when initialRoll is not provided)
            currentRoll = new Roll(this.rollFormula, {});
            await currentRoll.evaluate();
        }

        while (!stopRolling) {
            // Extract dice values from the roll object
            // Try to get from terms first (real Roll), fallback to parsing result (mock/legacy)
            let die1, die2;

            if (currentRoll.terms && currentRoll.terms.length >= 3) {
                // Real Foundry Roll structure: terms[0] is first die, terms[2] is second die
                die1 = currentRoll.terms[0].results[0].result;
                die2 = currentRoll.terms[2].results[0].result;
            } else if (currentRoll.result && typeof currentRoll.result === 'string') {
                // Fallback for mocks or legacy: parse the result string
                const rolledDice = currentRoll.result.split(' + ');
                die1 = parseInt(rolledDice[0]);
                die2 = parseInt(rolledDice[1]);
            } else {
                // Ultimate fallback: use mock dice values or defaults
                die1 = (currentRoll.dice && currentRoll.dice[0] && currentRoll.dice[0].results) ? currentRoll.dice[0].results[0] : 1;
                die2 = (currentRoll.dice && currentRoll.dice[1] && currentRoll.dice[1].results) ? currentRoll.dice[1].results[0] : 1;
            }

            dice.push(die1);
            dice.push(die2);

            if (die1 === 1 && die2 === 1) {
                // dice are both 1s
                stopRolling = true;
            } else if (die1 === die2) {
                // dice match but are not 1s
                // Show the Dice So Nice animation if available before prompting
                // For first roll, DSN animation already triggered by evaluate(), but we need to wait for it
                // For subsequent rolls, we need to explicitly show the animation
                if (game.dice3d && !isFirstRoll) {
                    await game.dice3d.showForRoll(currentRoll, game.user, true);
                }

                const confirmed = await Dialog.confirm({
                    title: game.i18n.localize('MEGS.ContinueRolling'),
                    content: game.i18n.localize('MEGS.RolledDoublesPrompt'),
                    yes: () => true,
                    no: () => false,
                    options: {
                        classes: ['megs', 'dialog']
                    }
                });
                if (confirmed) {
                    // Create and evaluate a new roll for subsequent pairs
                    currentRoll = new Roll(this.rollFormula, {});
                    await currentRoll.evaluate();
                    isFirstRoll = false;
                    stopRolling = false;
                } else {
                    stopRolling = true;
                }
            } else {
                // dice do not match
                stopRolling = true;
            }
        }

        return dice;
    }

    /**
     *
     * @param data
     * @param roll
     * @param callingPoint
     * @returns {Promise<void>}
     * @private
     */
    async _showRollResultInChat(data, roll, callingPoint) {
        const rollChatTemplate = 'systems/megs/templates/chat/rollResult.hbs';

        console.log('Calling show result from point: ' + callingPoint);

        // Use label as alias only (label already includes character name)
        const speaker = this.speaker ? foundry.utils.deepClone(this.speaker) : null;
        if (speaker && this.label) {
            // Clear actor reference and use only the alias to prevent duplication
            delete speaker.actor;
            speaker.alias = this.label;
        }

        const dialogHtml = await this._renderTemplate(rollChatTemplate, data);
        await roll.toMessage(dialogHtml, { speaker });
    }

    /**
     *
     * @param {*} avRollTotal
     * @param {*} avIndex
     * @param {*} actionTable
     * @returns
     */
    _getColumnShifts(avRollTotal, avIndex, ovIndex, actionTable) {
        let columnShifts = 0;
        const successNumber = actionTable[avIndex][ovIndex];

        // Roll must be greater than Success Number
        if (avRollTotal <= successNumber) {
            return 0;
        }

        // Roll must be on or beyond the Column Shift Threshold (11)
        if (avRollTotal < COLUMN_SHIFT_THRESHOLD) {
            return 0;
        }

        // Count columns "on or beyond" the threshold (>= 11), starting after the success number column
        // "The 11's split the Action Table in two"
        for (let i = ovIndex + 1; i < actionTable[avIndex].length; i++) {
            const colValue = actionTable[avIndex][i];
            // Only count columns at or beyond the threshold
            if (colValue >= COLUMN_SHIFT_THRESHOLD) {
                // The roll must be greater than the value in this column
                if (avRollTotal > colValue) {
                    columnShifts++;
                } else {
                    // Stop at first column we don't exceed (shifts are consecutive)
                    break;
                }
            }
        }

        return columnShifts;
    }

    /**
     *
     * @returns
     */
    static getTargetActor() {
        let targetActor;
        for (const value of game.user.targets) {
            targetActor = game.actors.get(value.document.actorId);
            break;
        }
        return targetActor;
    }

    /**
     *
     * @param {*} form
     * @returns
     */
    _processOpposingValuesEntry(form) {
        return {
            actionValue: parseInt(form.actionValue?.value) || 0,
            effectValue: parseInt(form.effectValue?.value) || 0,
            opposingValue: parseInt(form.opposingValue?.value) || 0,
            resistanceValue: parseInt(form.resistanceValue?.value) || 0,
            hpSpentAV: parseInt(form.hpSpentAV.value) || 0,
            hpSpentEV: parseInt(form.hpSpentEV.value) || 0,
            hpSpentRV: parseInt(form.hpSpentRV.value) || 0,
            hpSpentOV: parseInt(form.hpSpentOV.value) || 0,
            combatManeuver: form.combatManeuver.value,
            resultColumnShifts: parseInt(form.resultColumnShiftsInput.value) || 0,
            isUnskilled: (form.isUnskilled && form.isUnskilled.checked) || false,
        };
    }

    /**
     *
     * @param {*} avAdjusted
     * @param {*} ovAdjusted
     * @param {*} ovColumnShifts
     * @returns
     */
    _getActionTableDifficulty(avAdjusted, ovAdjusted, ovColumnShifts) {
        // get range index for AV
        const avIndex = this._getRangeIndex(avAdjusted);

        // get range index for OV
        const ovIndex = this._getRangeIndex(ovAdjusted) - ovColumnShifts;

        // consult action chart for difficulty
        const actionTable = CONFIG.tables.actionTable;
        const difficulty = actionTable[avIndex][ovIndex];

        if (avIndex < 0) {
            console.error(
                'ERROR: Index beyond table boundaries (AV = ' +
                    avAdjusted +
                    ' | avIndex = ' +
                    avIndex +
                    ')'
            );
        } else if (ovIndex < 0) {
            console.error(
                'ERROR: Index beyond table boundaries (OV = ' +
                    ovAdjusted +
                    ' | ovIndex = ' +
                    ovIndex +
                    ' | ovColumnShifts = ' +
                    ovColumnShifts +
                    ')'
            );
        } else if (avIndex >= actionTable.length) {
            console.error(
                'ERROR: Index beyond table boundaries (avIndex = ' +
                    avIndex +
                    ' | actionTable.length = ' +
                    actionTable.length +
                    ')'
            );
        } else if (ovIndex >= actionTable[avIndex].length) {
            console.error(
                'ERROR: Index beyond table boundaries (avIndex = ' +
                    avIndex +
                    ' | ovIndex = ' +
                    ovIndex +
                    ' | actionTable[avIndex].length = ' +
                    actionTable[avIndex].length +
                    ')'
            );
        }

        return difficulty;
    }

    /**
     * Given a value from 1-60, find the index for the range it falls within by the key on table
     * @private
     * @param {*} value
     * @returns
     */
    _getRangeIndex(value) {
        const ranges = CONFIG.tables.ranges;

        let index = 0;
        for (let i = 0; i < ranges.length; i++) {
            const range = ranges[i];
            const min = range[0];
            const max = range[1];
            if (value >= min && value <= max) {
                index = i;
                break;
            }
        }
        return index;
    }

    /**
     * Render a Handlebars template
     * @param {*} template
     * @param {*} data
     * @returns
     */
    async _renderTemplate(template, data) {
        return await foundry.applications.handlebars.renderTemplate(template, data);
    }
}
