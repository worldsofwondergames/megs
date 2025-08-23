class MEGSItem {
    constructor(name = null, type = undefined, systemData = {}) {
        this.name = name;
        this.type = type;
        this.system = systemData;
        this.isOwner = false;
        this.img = '';
        this.actor = null;
        this.parent = null;
        this.gadgetBonus = 0;
        this.totalCost = 0;
    }

    setFlag(...args) {
        // mock: do nothing or store flags if needed
        this._flags = this._flags || {};
        const [scope, key, value] = args;
        if (!this._flags[scope]) this._flags[scope] = {};
        this._flags[scope][key] = value;
        return Promise.resolve();
    }

    prepareData() {
        // mock: do nothing or set a flag
    }

    prepareDerivedData() {
        // mock: do nothing or set a flag
    }

    getRollData() {
        // mock: return a basic roll data object
        return { ...this.system, actor: this.actor ? this.actor.getRollData?.() : undefined };
    }

    async roll() {
        // mock: return a dummy roll object
        return { toMessage: () => {}, evaluate: () => {} };
    }

    rollMegs() {
        // mock: do nothing
    }

    static async create(data, context = {}) {
        // mock: return a new instance
        const createData = Array.isArray(data) ? data : [data];
        const created = createData.map((d) => new MEGSItem(d.name, d.type, d.system));
        return Array.isArray(data) ? created : created[0];
    }

    getEmbeddedCollection(embeddedName) {
        // mock: throw or return undefined
        return undefined;
    }
}

global.MEGSItem = MEGSItem;
