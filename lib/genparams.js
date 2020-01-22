class Genparam {
    constructor(name) {
        this.name = name;
        this.prefix = name.length + 1; // including \0
        this.params = {};
        this.units = [{
                "name": "lang",
                "type": "String",
                "length": 2,
                "term": true, //termination \0
            },
            {
                "name": "cable ID",
                "type": "String",
                "length": 0,
                "term": true,
            },
            {
                "name": "fiber ID",
                "type": "String",
                "length": 0,
                "term": true,
            },
            {
                "name": "fiber type",
                "type": "uInt",
                "length": 2,
                "term": true,
            },
            {
                "name": "wavelength",
                "type": "uInt",
                "length": 2,
                "term": true,
            },
            {
                "name": "location A",
                "type": "String",
                "length": 0,
                "term": true,
            },
            {
                "name": "location B",
                "type": "String",
                "length": 0,
                "term": true,
            },
            {
                "name": "cable|fiber type",
                "type": "String",
                "length": 0,
                "term": true,
            },
            {
                "name": "build condition",
                "type": "Char",
                "length": 2,
                "term": false,
            },
            {
                "name": "user offset",
                "type": "Int",
                "length": 4,
                "term": true,
            },
            {
                "name": "user offset distance",
                "type": "Int",
                "length": 4,
                "term": true,
                "version": 2,
            },
            {
                "name": "operator",
                "type": "String",
                "length": 0,
                "term": true,
            },
            {
                "name": "comments",
                "type": "String",
                "length": 0,
                "term": true,
            },
        ];
    }
    async build_condition(bcstr) {
        if (bcstr == 'BC') {
            bcstr += " (as-built)";
        } else if (bcstr == 'CC') {
            bcstr += " (as-current)";
        } else if (bcstr == 'RC') {
            bcstr += " (as-repaired)";
        } else if (bcstr == 'OT') {
            bcstr += " (other)";
        } else {
            bcstr += " (unknown)";
        }
        return bcstr;
    };
    async fiber_type(val) {
        /*
         * decode fiber type 
         * REF: http://www.ciscopress.com/articles/article.asp?p=170740&seqNum=7
         */
        var fstr;
        if (val == 651) { // ITU-T G.651
            fstr = "G.651 (50um core multimode)";
        } else if (val == 652) { // standard nondispersion-shifted 
            fstr = "G.652 (standard SMF)";
            // G.652.C low Water Peak Nondispersion-Shifted Fiber            
        } else if (val == 653) {
            fstr = "G.653 (dispersion-shifted fiber)";
        } else if (val == 654) {
            fstr = "G.654 (1550nm loss-minimzed fiber)";
        } else if (val == 655) {
            fstr = "G.655 (nonzero dispersion-shifted fiber)";
        } else {
            fstr = `${val} (unknown)`;
        }
        return fstr;
    }
}

module.exports = Genparam;