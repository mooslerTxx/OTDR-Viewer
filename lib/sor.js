const BinaryFile = require('binary-file');
const Writer = require('./writer');
const GenParams = require('./genparams');
const SupParams = require('./supparams');
const FxdParams = require('./fxdparams');
const KeyEvents = require('./keyevents');
const DataPts = require('./datapts');
const Cksum = require('./cksum');
const Html = require('./html');

var mapping = {
    "mt": " (meters)",
    "km": " (kilometers)",
    "mi": " (miles)",
    "kf": " (kilo-ft)",
    'ST': "[standard trace]",
    'RT': "[reverse trace]",
    'DT': "[difference trace]",
    'RF': "[reference]",
    'BC': "(as-built)",
    'CC': "(as-current)",
    'RC': "(as-repaired)",
    'OT': "(other)",
    651: "G.651 (50um core multimode)",
    652: "G.652 (standard SMF)",
    653: "G.653 (dispersion-shifted fiber)",
    654: "G.654 (1550nm loss-minimzed fiber)",
    655: "G.655 (nonzero dispersion-shifted fiber)",
}


class Sor {
    constructor(path, dirpath) {
        this.path = path;
        this.dir = dirpath;
        this.sol = 299792.458 / 1.0e6; //Speed of Light in km/usec
        this.resolution;
        this.bf = new BinaryFile(path, 'r', true);
        this.result = new Result(path);
        this.reader = new Reader(this.bf);
        this.writer = new Writer(path);
        this.html = new Html();
    }
    async parse() {
        try {
            await this.bf.open();
            console.log('File opened');

            await this.getVersion();
            await this.getMap();
            await this.getParams();
            await this.bf.close();
            console.log('File closed');
            await this.writer.createFile(this.result);
            await this.html.createHtml(this.writer);
        } catch (err) {
            console.log(`There was an error: ${err}`);
        }
    }
    /**@todo */
    async calcResolution(index, sapce) {
        let ior = parseFloat(index); //index of refraction
        let sasp = sapce.split(' ')[0];
        let dx = parseFloat(sasp) * this.sol / ior;
        this.resolution = dx;
    }
    async getVersion() {
        this.result.version = await this.reader.getVersion();
        this.result.fullversion = await this.reader.getFullVersion();
    }
    async getMap() {
        this.result.map = await this.reader.getMap();
        this.result.blocks = await this.reader.getBlocks(this.result.map);
    }
    async getParams() {
        var blockNames = ["GenParams", "SupParams", "FxdParams", "DataPts", "KeyEvents", "Cksum"];

        for (var bname in this.result['blocks']) {
            if (blockNames.includes(bname)) {
                let lowName = bname.toLowerCase();
                this.result[lowName] = await this.reader.extractParams(this.result, bname);

            } else {
                console.log("Unknown Data Blog: " + bname);
            }
        }
        // console.log(this.result);

    }
}


class Reader {
    constructor(bf) {
        this.bf = bf;
    }
    async parseUnit(block,
        returns = false) {
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
                } else if (unit.type === "Char") {
                    if (unit.name == "build condition") {
                        result = await block.build_condition(await this.bf.read(unit.length));
                    }
                } else if (unit.type === "Int") {
                    if (unit.hasOwnProperty('version')) {
                        if (unit.version !== 2) {
                            return result;
                        }
                    }
                    result = await this.getInt(unit.length);
                }

                let conResult = await this.conVertResult(result, unit);
                if (returns) {
                    obj[unit.name] = conResult;
                }
                block.params[unit.name] = conResult;
            } catch (error) {
                throw ("Something went wront by reading unit: " + unit.name);
            }
        }
        if (returns) {
            return obj;
        }
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
        let blockParams = "";

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
        await this.parseUnit(blockParams);
        if (blockname == "KeyEvents") {
            await blockParams.loopEvents();
            await blockParams.getSummary();
        }
        if (blockname == "DataPts") {
            await blockParams.loopPoints();
        }
        return blockParams;
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

class Result {
    constructor(path) {
        this.path = path;
        this.version = "";
        this.fullversion = "";
        this.map = {};
        this.blocks = {};
    }
}

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

module.exports = Sor;