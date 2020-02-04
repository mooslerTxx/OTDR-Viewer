const BinaryFile = require('binary-file');

const UnitMapping = require('./unitmapping');

const GenParams = require('./genparams');
const SupParams = require('./supparams');
const FxdParams = require('./fxdparams');
const KeyEvents = require('./keyevents');
const DataPts = require('./datapts');
const Cksum = require('./cksum');

class Block {
    constructor(name, version, size, pos, order) {
        this.name = name;
        this.version = version;
        this.size = size;
        this.pos = pos;
        this.order = order;
    }
}

class Parser {
    constructor(path, config) {
        this.config = config;
        this.path = path;
        this.bf = {};
        this.result = {
            params: {},
            points: {},
        };
        this.fileInfo = {};
        this.unitMapping = new UnitMapping();
    }
    async run() {
        try {
            this.bf = new BinaryFile(this.path, 'r', true);
            await this.bf.open();
            if (this.config.debug) console.log('File opened');
            await this.setVersion();
            await this.setMap();

            await this.parseGenParams();
            await this.parseSupParams();
            // await this.parseFxdParams();
            // await this.parseDataPts();
            // await this.parseKeyEvents();
            // await this.parseCksum();
            // console.log(this.fileInfo);


            // await this.getParams();
            await this.bf.close();
            if (this.config.debug) console.log('File closed');
            return (this.result);

        } catch (err) {
            console.log(`There was an error: ${err}`);
        }
    }
    async parseGenParams() {
        let name = "GenParams";
        await this.checkBlockAndSetCursor(name);
        let genPara = new GenParams(name);
        let result = await this.parseBlock(genPara);
        this.result.params[name] = result;
    }
    async parseSupParams() {
        let name = "SupParams";
        await this.checkBlockAndSetCursor(name);
        let genPara = new SupParams(name);
        let result = await this.parseBlock(genPara);
        this.result.params[name] = result;
        console.log(this.result);

    }

    async parseBlock(obj) {
        let results = {};
        for (const unit of obj.units) {
            try {
                let result = "";
                if (unit.type === "Char") {
                    result = await this.parseCommand(unit, "read");
                    let append = false;
                    if (unit.hasOwnProperty('append')) {
                        append = unit.append;
                    }
                    result = await this.unitMapping.getMapping(result, append);
                } else {
                    result = await this.parseCommand(unit);
                }

                result = await this.conVertResult(result, unit);
                results[unit.name] = result;

            } catch (error) {
                throw ("Something went wront by reading unit: " + unit.name + ": " + error);
            }
        }
        return results;

    }

    async conVertResult(result, unit, block = null, ref = null) {
        if (unit.hasOwnProperty('scale')) {
            result *= unit.scale;
        }
        if (unit.hasOwnProperty('pres')) {
            result = result.toFixed(unit.pres);
        }
        // if (unit.hasOwnProperty('func')) {
        //     if (!unit.hasOwnProperty('params')) {
        //         throw ("No Params defined for Function call!");
        //     }
        //     let params = await this.getValuesFromBlock(ref, unit.params);
        //     let funcName = unit.func;
        //     let resultObj = await block[funcName](params);
        //     result = await this.setBlockInfoAndReturn(ref, resultObj);
        // }
        if (unit.hasOwnProperty('unit')) {
            result = result + " " + unit.unit;
        }
        if (unit.hasOwnProperty('mult')) {
            result = (result * unit.mult).toFixed(4);
        }
        if (unit.hasOwnProperty('funcT')) {
            result = await unit.funcT(result);
        }
        return result;
    }

    async parseCommand(unit, typename = "type") {
        let result = "";
        if (unit[typename] === "String") {
            if (unit.length) {
                result = await this.bf.readString(unit.length);
            } else {
                result = await this.getString();
            }
        } else if (unit[typename] === "uInt") {
            result = await this.getUInt(unit.length);
        } else if (unit.type === "Int") {
            result = await this.getInt(unit.length);
        }
        return result;
    }



    async checkBlockAndSetCursor(name) {
        let info = this.fileInfo.blocks;
        if (!(name in info)) {
            throw ("blockName " + name + " not found!");
        }
        if (info[name]['version'] != 2) {
            throw ("currently only Version 2 allowed!");
        }
        await this.bf.seek(info[name]['pos']);
        let posInfo = await this.getString();
        if (posInfo != name) {
            throw ("Wrong Header Start-Position for: " + name);
        }
    }

    async setVersion() {
        this.fileInfo.version = await this.getVersion();
        if (this.fileInfo.version != 2) throw ('at this moment only Version 2 is supported');
        this.fileInfo.fullversion = await this.getFullVersion();
    }
    async setMap() {
        this.fileInfo.map = await this.getMap();
        this.fileInfo.blocks = await this.getBlocks(this.fileInfo.map);
    }
    async toFixedPoint(scale = 0.01, no = 2) {
        var val = await this.getUInt(2);
        return (val * scale).toFixed(no);
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
        var map = {};
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
module.exports = Parser;