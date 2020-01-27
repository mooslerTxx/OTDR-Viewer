class Fxdparam {
    constructor(name) {
        this.name = name;
        this.prefix = name.length + 1; // including \0
        this.params = {};
        this.sol = 299792.458 / 1.0e6; //Speed of Light in km/usec
        this.resolution = 0;
        this.dx = 0;
        this.ior = 0;
        this.units = [{
                "name": "date/time",
                "type": "uInt",
                "length": 4,
                "term": true, //termination \0
            },
            {
                "name": "unit",
                "type": "Char",
                "read": "String",
                "length": 2,
                "term": true,
            },
            {
                "name": "wavelength",
                "type": "uInt",
                "length": 2,
                "scale": 0.1,
                "pres": 1,
                "unit": "nm",
                "term": true,
            },
            {
                "name": "acquisition offset",
                "type": "Int",
                "length": 4,
                "term": true,
            },
            {
                "name": "acquisition offset distance",
                "type": "Int",
                "length": 4,
                "term": true,
            },
            {
                /**@todo the next three parameters are repeated according to the number of entries) */
                "name": "number of pulse width entries",
                "type": "uInt",
                "length": 2,
                "term": true,
            },
            {
                "name": "pulse width",
                "type": "uInt",
                "length": 2,
                "pres": 0,
                "unit": "ns",
                "term": true,
            },
            {
                "name": "sample spacing",
                "type": "uInt",
                "scale": 1e-8,
                "unit": "usec",
                "length": 4,
                "term": true,
            },
            {
                "name": "num data points",
                "type": "uInt",
                "length": 4,
                "term": true,
            },
            {
                "name": "index",
                "type": "uInt",
                "length": 4,
                "scale": 1e-5,
                "pres": 6,
                "term": true,
            },
            {
                "name": "BC",
                "type": "uInt",
                "scale": -0.1,
                "pres": 2,
                "unit": "dB",
                "length": 2,
                "term": true,
            },
            {
                "name": "num average",
                "type": "uInt",
                "length": 4,
                "term": true,
            },
            {
                "name": "averaging time",
                "type": "uInt",
                "length": 2,
                "scale": 0.1,
                "pres": 0,
                "unit": "sec",
                "term": true,
            },
            {
                "name": "range",
                "type": "uInt",
                "length": 4,
                "scale": 2e-5,
                "pres": 6,
                "unit": "km",
                "func": "tDx",
                "params": ["index", "sample spacing", "num data points"],
                "term": true,
            },
            {
                "name": "acquisition range distance",
                "type": "Int",
                "length": 4,
                "term": true,
            },
            {
                "name": "front panel offset",
                "type": "Int",
                "length": 4,
                "term": true,
            },
            {
                "name": "noise floor level",
                "type": "uInt",
                "length": 2,
                "term": true,
            },
            {
                "name": "noise floor scaling factor",
                "type": "Int",
                "length": 2,
                "term": true,
            },
            {
                "name": "power offset first point",
                "type": "uInt",
                "length": 2,
                "term": true,
            },
            {
                "name": "loss thr",
                "type": "uInt",
                "length": 2,
                "scale": 0.001,
                "pres": 3,
                "unit": "dB",
                "term": true,
            },
            {
                "name": "refl thr",
                "type": "uInt",
                "length": 2,
                "scale": -0.001,
                "pres": 3,
                "unit": "dB",
                "term": true,
            },
            {
                "name": "EOT thr",
                "type": "uInt",
                "length": 2,
                "scale": 0.001,
                "pres": 3,
                "unit": "dB",
                "term": true,
            },
            {
                "name": "trace type",
                "type": "Char",
                "read": "String",
                "append": true,
                "length": 2,
                "term": true,
            },
            {
                "name": "X1",
                "type": "Int",
                "length": 4,
                "term": true,
            },
            {
                "name": "Y1",
                "type": "Int",
                "length": 4,
                "term": true,
            },
            {
                "name": "X2",
                "type": "Int",
                "length": 4,
                "term": true,
            },
            {
                "name": "Y2",
                "type": "Int",
                "length": 4,
                "term": true,
            },
        ];
    }

    /**
     * 
     * @param {*} arr should contain the params
     * return obj should contain an Result parameter
     * all other parameter will be set in obj
     */
    async tDx(arr) {
        let index = arr[0];
        let sapce = arr[1];
        let dataPt = arr[2];
        let ior = parseFloat(index); //index of refraction
        let sasp = sapce;
        if (isNaN(sapce)) {
            sasp = sapce.split(' ')[0];
        }
        let dx = parseFloat(sasp) * this.sol / ior;
        this.dx = dx;
        this.ior = ior;
        this.resolution = dx * 1000;
        let obj = {
            "dx": this.dx,
            "resolution": this.resolution,
            "result": this.dx * dataPt,
        }
        return obj;
    }
}

module.exports = Fxdparam;