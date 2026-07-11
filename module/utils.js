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

    static resolveValueSource(source, power, actor, targetActor) {
        if (!source || source === 'aps') {
            return Number.parseInt(power.system.aps) || 0;
        }
        const parts = source.split(':');
        if (parts.length === 2) {
            const [type, attr] = parts;
            if (type === 'char' && actor) {
                return actor.system.attributes[attr]?.value || 0;
            }
            if (type === 'target' && targetActor) {
                return targetActor.system.attributes[attr]?.value || 0;
            }
        }
        return 0;
    }

    static resolvePowerRollValues(power, actor, targetActor) {
        const aps = Number.parseInt(power.system.aps) || 0;
        const avSource = power.system.avSource;
        const evSource = power.system.evSource;
        const ovSource = power.system.ovSource;
        const rvSource = power.system.rvSource;

        const av = avSource
            ? Utils.resolveValueSource(avSource, power, actor, targetActor)
            : aps;
        const ev = evSource
            ? Utils.resolveValueSource(evSource, power, actor, targetActor)
            : aps;

        let ov = 0;
        if (ovSource) {
            ov = Utils.resolveValueSource(ovSource, power, actor, targetActor);
        } else if (targetActor && power.system.link) {
            ov = Utils.getOpposingValue(power.system.link, targetActor);
        }

        let rv = 0;
        if (rvSource) {
            rv = Utils.resolveValueSource(rvSource, power, actor, targetActor);
        } else if (targetActor && power.system.link) {
            rv = Utils.getResistanceValue(power.system.link, targetActor);
        }

        return { av, ev, ov, rv };
    }

    static hasPowerSourceOverrides(power) {
        return !!(power.system.avSource || power.system.evSource || power.system.ovSource || power.system.rvSource);
    }

    static ATTRIBUTE_PAIRS = [
        { action: 'dex', effect: 'str', resistance: 'body', type: 'physical', label: 'DEX/STR' },
        { action: 'int', effect: 'will', resistance: 'mind', type: 'mental', label: 'INT/WILL' },
        { action: 'infl', effect: 'aura', resistance: 'spirit', type: 'mystical', label: 'INFL/AURA' },
    ];

    static getGadgetRollOptions(gadget, actor) {
        const options = [];
        const sys = gadget.system;

        // Tier 1: Explicit AV/EV
        if (sys.actionValue > 0 || sys.effectValue > 0) {
            options.push({
                type: 'gadget-av-ev',
                label: `AV ${sys.actionValue} / EV ${sys.effectValue}`,
                av: sys.actionValue,
                ev: sys.effectValue,
                gadgetId: gadget._id,
            });
        }

        // Tier 2 & 3: Child powers and skills
        if (actor) {
            const childItems = actor.items.filter(
                (i) => i.system.parent === gadget._id
            );
            for (const item of childItems) {
                if (item.type === MEGS.itemTypes.power && item.system.aps > 0) {
                    options.push({
                        type: 'power',
                        label: item.name,
                        itemId: item._id,
                        aps: item.system.aps,
                        link: item.system.link,
                    });
                } else if (item.type === MEGS.itemTypes.skill && item.system.aps > 0) {
                    options.push({
                        type: 'skill',
                        label: item.name,
                        itemId: item._id,
                        aps: item.system.aps,
                        link: item.system.link,
                    });
                }
            }
        }

        // Tier 4: Attribute pairs
        for (const pair of Utils.ATTRIBUTE_PAIRS) {
            const actionVal = sys.attributes?.[pair.action]?.value || 0;
            const effectVal = sys.attributes?.[pair.effect]?.value || 0;
            if (actionVal > 0 || effectVal > 0) {
                options.push({
                    type: 'attribute',
                    label: pair.label,
                    actionKey: pair.action,
                    effectKey: pair.effect,
                    av: actionVal,
                    ev: effectVal,
                    gadgetId: gadget._id,
                });
            }
        }

        return options;
    }

    static getGadgetRollTooltip(rollOptions) {
        if (rollOptions.length === 0) return '';
        if (rollOptions.length === 1) return rollOptions[0].label;
        return rollOptions.map((o) => o.label).join(', ');
    }
}
