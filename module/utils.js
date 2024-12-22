import { MEGS } from "./helpers/config.mjs";

export class Utils {
    /**
     *
     * @param {*} key
     * @param {*} targetActor
     * @returns
     */
    static getOpposingValue(key, targetActor) {
        let opposingValue;
        if (key === MEGS.attributeAbbreviations.str) {
            opposingValue = targetActor.system.attributes.dex.value;
        } else if (key === MEGS.attributeAbbreviations.will) {
            opposingValue = targetActor.system.attributes.int.value;
        } else if (key === MEGS.attributeAbbreviations.aura) {
            opposingValue = targetActor.system.attributes.infl.value;
        } else {
            ui.notifications.error("_getOpposingValueForPower: Invalid attribute selection");
            return;
        }
        return opposingValue;
    }

    /**
     *
     * @param key
     * @param targetActor
     * @returns {*}
     * @private
     */
    static getResistanceValue(key, targetActor) {
        let resistanceValue;
        if (key === "str") {
            resistanceValue = targetActor.system.attributes.body.value;
        } else if (key === "will") {
            resistanceValue = targetActor.system.attributes.mind.value;
        } else if (key === "aura") {
            resistanceValue = targetActor.system.attributes.spirit.value;
        } else {
            ui.notifications.error("_getResistanceValueForPower: Invalid attribute selection");
            return;
        }
        return resistanceValue;
    }
}
