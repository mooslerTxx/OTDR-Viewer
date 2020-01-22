class Keyevent {
    constructor(name, reader) {
        this.name = name;
        this.prefix = name.length + 1; // including \0
        this.reader = reader;
        this.params = {};
        this.summaryMap = new Summaryevent();
        this.eventMap = new Event();
        this.event = [];
        this.summary = {};
        this.units = [{
            "name": "event number",
            "type": "uInt",
            "length": 2,
            "term": true, //termination \0
        }, ];
    }
    async loopEvents() {
        let num = this.params["event number"];
        for (let i = 0; i < num; i++) {
            let param = await this.reader.parseUnit(this.eventMap, true);
            await this.event.push(param);
        }
    }
    async getSummary() {
        let param = await this.reader.parseUnit(this.summaryMap, true);
        this.summary = param;
    }
}

class Summaryevent {
    constructor() {
        this.params = {};
        this.units = [{
                "name": "total loss",
                "type": "Int",
                "length": 4,
                "pres": 3,
                "scale": 0.001,
            },
            {
                "name": "loss start",
                "type": "Int",
                "length": 4,
                "pres": 6,
            },
            {
                "name": "loss end",
                "type": "uInt",
                "length": 4,
                "pres": 6,
            },
            {
                "name": "ORL",
                "type": "uInt",
                "length": 2,
                "scale": 0.001,
                "pres": 3,
            },
            {
                "name": "ORL start",
                "type": "Int",
                "length": 4,
                "pres": 6,
            },
            {
                "name": "ORL finish",
                "type": "uInt",
                "length": 4,
                "scale": 0.001,
                "pres": 6,
            },
        ];
    }
}

class Event {
    constructor() {
        this.params = {};
        this.units = [{
                "name": "number",
                "type": "uInt",
                "length": 2,
            },
            {
                /**@todo calc dist */
                "name": "distance",
                "type": "uInt",
                "length": 4,
            },
            {
                "name": "slope",
                "type": "Int",
                "length": 2,
                "pres": 3,
                "scale": 0.001,
            },
            {
                "name": "splice",
                "type": "Int",
                "length": 2,
                "pres": 3,
                "scale": 0.001,
            },
            {
                "name": "refl loss",
                "type": "Int",
                "length": 4,
                "pres": 3,
                "scale": 0.001,
            },
            {
                /**@todo mapping */
                "name": "event type",
                "type": "String",
                "length": 8,
            },
            {
                "name": "end of prev",
                "type": "uInt",
                "length": 4,
                "pres": 3,
            },
            {
                "name": "start of curr",
                "type": "uInt",
                "length": 4,
                "pres": 3,
            },
            {
                "name": "end of curr",
                "type": "uInt",
                "length": 4,
                "pres": 3,
            },
            {
                "name": "start of next",
                "type": "uInt",
                "length": 4,
                "pres": 3,
            },
            {
                "name": "peak",
                "type": "uInt",
                "length": 4,
                "pres": 3,
            },
            {
                "name": "comments",
                "type": "String",
                "length": 0,
            },
        ];
    }
}

module.exports = Keyevent;