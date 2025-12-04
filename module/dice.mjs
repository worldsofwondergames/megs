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
    async toMessage(dialogHtml = {}, { rollMode, create = true } = {}) {
        return await ChatMessage.create({
            user: game.user.id,
            rolls: [this],
            content: dialogHtml,
            sound: CONFIG.sounds.dice,
        });
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
    constructor(rollValues) {
        this.valueOrAps = rollValues.valueOrAps;
        this.type = rollValues.type;
        this.actionValue = rollValues.actionValue;
        this.opposingValue = rollValues.opposingValue;
        this.effectValue = rollValues.effectValue;
        this.resistanceValue = rollValues.resistanceValue;
        this.rollFormula = rollValues.rollFormula;
        this.label = rollValues.label;
        this.isUnskilled = rollValues.unskilled;
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
                        label: game.i18n.localize('MEGS.Submit'),
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
        if (hpSpentAV > 0 || combatManeuverKey) {
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
            if (hpSpentAV > 0) {
                avInfo +=
                    '    <tr>' +
                    '        <td class="label">HP ' +
                    game.i18n.localize('MEGS.Spent') +
                    '</td>' +
                    '        <td class="value">+' +
                    hpSpentAV +
                    '</td>' +
                    '    </tr>';
            }
            // if (combatManeuverKey) {
            //     avInfo += '    <tr>' +
            //         '        <td class="label">' + combatManeuverKey + '</td>' +
            //         '        <td class="value">+' +  ovColumnShifts + ' shifts</td>' +
            //         '    </tr>';
            // }
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
        await this._rollDice(resultData).then((response) => {
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
     * @returns
     */
    async _rollDice(data) {
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

        while (!stopRolling) {
            // determine whether happens
            const avRoll = new Roll(this.rollFormula, {});

            // Execute the roll
            await avRoll.evaluate();

            // Get roll result
            const rolledDice = avRoll.result.split(' + ');

            dice.push(parseInt(rolledDice[0]));
            dice.push(parseInt(rolledDice[1]));

            if (parseInt(rolledDice[0]) === 1 && parseInt(rolledDice[1]) === 1) {
                // dice are both 1s
                stopRolling = true;
            } else if (rolledDice[0] === rolledDice[1]) {
                // dice match but are not 1s
                const confirmed = await Dialog.confirm({
                    title: game.i18n.localize('MEGS.ContinueRolling'),
                    content: game.i18n.localize('MEGS.RolledDoublesPrompt'),
                    yes: () => true,
                    no: () => false,
                });
                if (confirmed) {
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

        // what's being rolled (used for display)
        data.title = this.label ? `${this.label}` : '';

        console.log('Calling show result from point: ' + callingPoint);

        const dialogHtml = await this._renderTemplate(rollChatTemplate, data);
        await roll.toMessage(dialogHtml);
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

        // Must meet or beat both Success Number and threshold
        if (avRollTotal <= successNumber || avRollTotal < COLUMN_SHIFT_THRESHOLD) {
            return 0;
        }

        // Start from the column immediately to the right of the Success Number
        // Count consecutive column shifts only
        for (let i = ovIndex + 1; i < actionTable[avIndex].length; i++) {
            const colValue = actionTable[avIndex][i];
            // Only count columns with values >= threshold and < roll
            if (colValue >= COLUMN_SHIFT_THRESHOLD && colValue < avRollTotal) {
                columnShifts++;
            } else {
                // Stop at first column we don't exceed (shifts must be consecutive)
                break;
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
