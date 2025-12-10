// eslint-disable-next-line no-undef
export default class MEGSCombatant extends Combatant {
    // https://foundryvtt.com/api/classes/client.Combatant.html

    /** @override */
    _onCreate(data, options, userID) {
        super._onCreate(data, options, userID);
        this.actor.system.initiativeBonus.value = this.actor._calculateInitiativeBonus();
    }

    /** @override */
    getInitiativeRoll(formula, hpToAdd) {
        formula = formula || this._getInitiativeFormula();
        if (hpToAdd) {
            formula += ` + ${hpToAdd}`;
        }
        const rollData = this.actor?.getRollData() || {};
        return Roll.create(formula, rollData);
    }

    /** @override */
    _getInitiativeFormula(combatant) {
        let baseFormula = super._getInitiativeFormula(combatant);
        const initiativeBonus = this.actor._calculateInitiativeBonus();

        if (initiativeBonus > 0) {
            baseFormula += ` + ${initiativeBonus}`;
        }

        return baseFormula;
    }
}
