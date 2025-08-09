import { MEGS } from './helpers/config.mjs';

export class Utils {
    /**
     *
     * @param key
     * @param targetActor
     * @returns {*}
     * @oublic
     */
    static getOpposingValue(key, targetActor) {
        let opposingValue;
        if (key === MEGS.attributeAbbreviations.str || key === MEGS.attributeAbbreviations.dex) {
            opposingValue = targetActor.system.attributes.dex.value;
        } else if (
            key === MEGS.attributeAbbreviations.will ||
            key === MEGS.attributeAbbreviations.int
        ) {
            opposingValue = targetActor.system.attributes.int.value;
        } else if (
            key === MEGS.attributeAbbreviations.aura ||
            key === MEGS.attributeAbbreviations.infl
        ) {
            opposingValue = targetActor.system.attributes.infl.value;
        } else {
            ui.notifications.error(
                "Utils.getOpposingValue(): Invalid attribute selection '" + key + "'"
            );
            return;
        }
        return opposingValue;
    }

    /**
     *
     * @param key
     * @param targetActor
     * @returns {*}
     * @public
     */
    static getResistanceValue(key, targetActor) {
        let resistanceValue;
        if (key === MEGS.attributeAbbreviations.str || key === MEGS.attributeAbbreviations.dex) {
            resistanceValue = targetActor.system.attributes.body.value;
        } else if (
            key === MEGS.attributeAbbreviations.will ||
            key === MEGS.attributeAbbreviations.int
        ) {
            resistanceValue = targetActor.system.attributes.mind.value;
        } else if (
            key === MEGS.attributeAbbreviations.aura ||
            key === MEGS.attributeAbbreviations.infl
        ) {
            resistanceValue = targetActor.system.attributes.spirit.value;
        } else {
            ui.notifications.error(
                "Utils.getResistanceValue(): Invalid attribute selection '" + key + "'"
            );
            return;
        }
        return resistanceValue;
    }

    /**
     *
     * @param key
     * @param actor
     * @returns {*}
     * @public
     */
    static getEffectValue(key, actor) {
        let effectValue;
        if (key === MEGS.attributeAbbreviations.dex) {
            effectValue = actor.system.attributes.str.value;
        } else if (key === MEGS.attributeAbbreviations.int) {
            effectValue = actor.system.attributes.will.value;
        } else if (key === MEGS.attributeAbbreviations.infl) {
            effectValue = actor.system.attributes.aura.value;
        } else {
            ui.notifications.error(
                "Utils.getEffectValue(): Invalid attribute selection '" + key + "'"
            );
            return;
        }
        return effectValue;
    }
}
