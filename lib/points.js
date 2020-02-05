class Points {
    constructor(name, reader) {
        this.name = name;
        this.reader = reader;
        this.pointMap = new PointsMap();
        this.yMin = null;
        this.yMax = null;
    }
    async loopPoints(param, resolution = 1) {
        let yMin = Infinity;
        let yMax = -Infinity;
        let scale = param["scaling"];
        let xScale = 1;

        let num = param["number of Points"];
        // num = 10;

        let valArr = [];
        for (let i = 0; i <= num; i++) {
            let param = await this.reader.parseUnit(this.pointMap);
            let y = (param.point * scale * 0.001);
            if (y >= yMax) {
                yMax = y;
            }
            if (y <= yMin) {
                yMin = y;
            }
            let x = (resolution * i * xScale / 1000.0);
            await valArr.push([x, y]);
        }

        let mult = yMax;

        let vals = await this.calcOffset(valArr, mult);

        let resObj = {
            "yMin": yMin,
            "yMax": yMax,
            "points": vals,
        };
        this.yMin = yMin;
        this.yMax = yMax;
        return resObj;
    }
    async calcOffset(arr, mult) {
        let cvalArr = await arr.map(function (nested) {
            return nested.map(function (element, index) {
                if (index === 1) {
                    return parseFloat((mult - element).toFixed(6));
                } else {
                    return parseFloat(element.toFixed(6));
                }
            });
        });
        return cvalArr;
    }
}

class PointsMap {
    constructor() {
        this.params = {};
        this.units = [{
            "name": "point",
            "type": "uInt",
            "length": 2,
            "pres": 6,
        }, ];
    }
}

module.exports = Points;