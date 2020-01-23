const GenParams = require('./genparams');
const SupParams = require('./supparams');
const FxdParams = require('./fxdparams');
const KeyEvents = require('./keyevents');
const DataPts = require('./datapts');
const Cksum = require('./cksum');

class Mapblock {
    constructor() {
        this.bytes = "";
        this.nBlocks = "";
    }
}

class Block {
    constructor(name, version, size, pos, order) {
        this.name = name;
        this.version = version;
        this.size = size;
        this.pos = pos;
        this.order = order;
    }
}
class Mapping {
    constructor() {
        this.mapping = {
            "mt": "meters",
            "km": "kilometers",
            "mi": "miles",
            "kf": "kilo-ft",
            'ST': "[standard trace]",
            'RT': "[reverse trace]",
            'DT': "[difference trace]",
            'RF': "[reference]",
            'BC': "(as-built)",
            'CC': "(as-current)",
            'RC': "(as-repaired)",
            'OT': "(other)",
            //REF: http://www.ciscopress.com/articles/article.asp?p=170740&seqNum=7
            651: "G.651 (50um core multimode)",
            652: "G.652 (standard SMF)",
            653: "G.653 (dispersion-shifted fiber)",
            654: "G.654 (1550nm loss-minimzed fiber)",
            655: "G.655 (nonzero dispersion-shifted fiber)",
        }
    }

    async getMapping(key, append = false) {
        let result = "";
        if (key in this.mapping) {
            let prefix = "";
            if (append) {
                prefix = key + " ";
            }
            result = prefix + this.mapping[key];
        }
        return result;
    }


}

class Reader {
    constructor(bf, result) {
        this.bf = bf;
        this.result = result;
        this.map = new Mapping();
    }
    async parseUnit(block) {
        let obj = {};

        for (const unit of block.units) {
            try {
                let result = "";
                // console.log("Pos: " + this.bf.tell());
                if (unit.type === "String") {
                    if (unit.length) {
                        result = await this.bf.readString(unit.length);
                    } else {
                        result = await this.getString();
                    }
                } else if (unit.type === "uInt") {
                    result = await this.getUInt(unit.length);
                }
                /**@todo use mapping function */
                else if (unit.type === "Char") {
                    var val;
                    if (unit.read === "uInt") {
                        val = await this.getUInt(unit.length);
                    } else if (unit.read === "String") {
                        val = await this.bf.read(unit.length);
                    }
                    result = await this.map.getMapping(val);
                } else if (unit.type === "Int") {
                    if (unit.hasOwnProperty('version')) {
                        if (unit.version !== 2) {
                            return result;
                        }
                    }
                    result = await this.getInt(unit.length);
                }

                obj[unit.name] = await this.conVertResult(result, unit);
            } catch (error) {
                throw ("Something went wront by reading unit: " + unit.name);
            }
        }
        return obj;
    }
    async conVertResult(result, unit) {
        if (unit.hasOwnProperty('scale')) {
            result *= unit.scale;
        }
        if (unit.hasOwnProperty('pres')) {
            result = result.toFixed(unit.pres);
        }
        if (unit.hasOwnProperty('unit')) {
            result = result + " " + unit.unit;
        }
        return result;
    }

    /**@todo more dynamic */
    async extractParams(r_result, blockname) {
        await this.checkBlockAndSetCursor(r_result, blockname);
        let blockParams = {};

        switch (blockname) {
            case "GenParams":
                blockParams = new GenParams(blockname);
                break;
            case "SupParams":
                blockParams = new SupParams(blockname);
                break;
            case "FxdParams":
                blockParams = new FxdParams(blockname);
                break;
            case "KeyEvents":
                blockParams = new KeyEvents(blockname, this);
                break;
            case "DataPts":
                blockParams = new DataPts(blockname, this);
                break;
            case "Cksum":
                blockParams = new Cksum(blockname);
                break;
        }
        let res = await this.parseUnit(blockParams);
        let returnResult = {};

        if (blockname == "KeyEvents") {
            let arrEvent = await blockParams.loopEvents(res);
            res['events'] = arrEvent;

            let sumEvent = await blockParams.getSummary();
            res['summary'] = sumEvent;
        }
        if (blockname == "DataPts") {
            let points = await blockParams.loopPoints(res);
            // res['points'] = points;
            returnResult['points'] = points;
        }
        returnResult['fileinfo'] = blockParams;
        returnResult['result'] = res;
        return returnResult;
    }
    async checkBlockAndSetCursor(r_result, blockname) {
        let blockInfo = r_result['blocks'][blockname];
        let version = r_result['version'];
        let startpos = blockInfo.pos;
        if (version != 2) {
            throw ("currently only Version 2 allowed!");
        }
        await this.headerCheck(startpos, blockname);
    }
    async headerCheck(startpos, blockname) {
        try {
            await this.bf.seek(startpos);
            let posInfo = await this.getString();
            if (posInfo != blockname) {
                throw ("Wrong Header Information for: " + blockname);
            }
        } catch (e) {
            throw (genparam.info.name + " starting position unknown");
        }
    }
    async getString() {
        var mystr = "";
        var byte = await this.bf.read(1);
        while (byte != '') {
            var tt = String(byte).charCodeAt(0);
            if (tt == 0) {
                break;
            }
            mystr += byte;
            byte = await this.bf.read(1);
        }
        return mystr;
    }
    async getUInt(nbytes = 2) {
        var val = null;
        if (nbytes == 2) {
            val = await this.bf.readUInt16();

        } else if (nbytes == 4) {
            val = await this.bf.readUInt32();
        } else {
            console.log(`parts.get_uint(): Invalid number of bytes ${nbytes}`);
            throw ("Invalid bytes");
        }
        return val;
    }
    async getInt(nbytes = 2) {
        var val = null;
        if (nbytes == 2) {
            val = await this.bf.readInt16();

        } else if (nbytes == 4) {
            val = await this.bf.readInt32();
        } else {
            console.log(`parts.get_uint(): Invalid number of bytes ${nbytes}`);
            throw ("Invalid bytes");
        }
        return parseInt(val);
    }
    async toFixedPoint() {
        var val = await this.getUInt(2);
        return (val * 0.01).toFixed(2);
    }
    async getVersion() {
        var mystr = await this.getString();
        let version = 2;
        if (mystr != 'Map') {
            await this.bf.seek(0);
            version = 1;
        }
        return version;
    }
    async getFullVersion() {
        return await this.toFixedPoint();
    }


    async getMap() {
        var map = new Mapblock();
        map.bytes = await this.getUInt(4);
        map.nBlocks = await this.getUInt(2) - 1;
        return map;
    }
    async getBlocks(map) {
        var blocks = {};
        var pos = map.bytes;
        for (var i = 0; i < map.nBlocks; i++) {
            let name = await this.getString();
            let ver = await this.toFixedPoint();
            let size = await this.getUInt(4);
            let block = new Block(name, ver, size, pos, i);
            blocks[name] = block;
            pos += size;
        }
        return blocks;
    }
}

module.exports = Reader;