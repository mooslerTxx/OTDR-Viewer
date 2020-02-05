const BinaryFile = require('binary-file');

const UnitMapping = require('./unitmapping');
const Proxy = require('./proxy');


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

            await this.parseParams("GenParams");
            await this.parseParams("SupParams");
            await this.parseParams("FxdParams");
            await this.parseParams("KeyEvents");
            await this.parseParams("DataPts");
            await this.parseParams("Cksum");

            console.log(this.result);

            // console.log(this.fileInfo);

            await this.bf.close();
            if (this.config.debug) console.log('File closed');
            return (this.result);

        } catch (err) {
            console.log(`There was an error: ${err}`);
        }
    }


    async parseParams(name) {
        await this.checkBlockAndSetCursor(name);
        let block = new Proxy(name);
        let result = await this.parseBlock(block);
        this.result.params[name] = result;
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

                results = await this.convertResult(result, unit, obj, results);

            } catch (error) {
                throw ("Something went wront by reading unit: " + unit.name + ": " + error);
            }
        }
        return results;

    }

    async convertResult(result, unit, obj, results) {
        let newRes = await this.parseResult(result, unit, obj, results);
        if (typeof newRes === 'object' && newRes !== null) {
            if (unit.hasOwnProperty('numCalls')) {
                results[unit.name] = newRes;

            } else {
                console.log("sfd");
                results = await this.setBlockInfo(newRes, results, unit);
                console.log("fff");
            }
        } else {
            results[unit.name] = newRes;
        }
        return results;
    }

    async parseResult(result, unit, ref = null, results) {
        if (unit.hasOwnProperty('func')) {
            let resultObj = await this.callFunction(unit, ref, results, result);
            return resultObj;
        }
        if (unit.hasOwnProperty('scale')) {
            result *= unit.scale;
        }
        if (unit.hasOwnProperty('pres')) {
            result = result.toFixed(unit.pres);
        }
        if (unit.hasOwnProperty('unit')) {
            result = result + " " + unit.unit;
        }
        if (unit.hasOwnProperty('mult')) {
            result = (result * unit.mult).toFixed(4);
        }

        return result;
    }

    async callFunction(unit, ref, results, rThis) {
        if (!unit.hasOwnProperty('params')) {
            throw ("No Params defined for Function call in " + unit.name);
        }
        let res = {};
        for (let index = 0; index < unit.func.length; index++) {
            const element = unit.func[index];
            let params = await this.getValuesFromBlock(results, unit.params[index], rThis);
            let resultObj = await ref[element](params);
            if (unit.hasOwnProperty('numCalls')) {
                let num = unit.numCalls[index];
                if (unit.numCalls[index] === 'this') {
                    num = rThis;
                }
                let block = resultObj.obj;
                let blockName = resultObj.name;
                let blockResult = await this.loopBlock(num, block);
                res = {
                    [blockName]: blockResult
                };
            } else {
                res = {
                    ...resultObj
                }
            }
        }
        return res;
    }
    async loopBlock(num, block) {
        let values = [];
        for (let i = 0; i < num; i++) {
            let param = await this.parseBlock(block);

            await values.push(param);
        }
        return values;
    }

    async setBlockInfo(newRes, results, unit) {
        let name = unit.name;
        for (const key in newRes) {
            if (newRes.hasOwnProperty(key)) {
                let element = newRes[key];
                if (key === "result") {
                    if (unit.hasOwnProperty('unit')) {
                        element += " " + unit.unit;
                    }
                    results[name] = element;
                } else {
                    results[key] = element;
                }
            }
        }
        return results;
    }
    async getValuesFromBlock(obj, parArr, rThis) {
        let newArr = [];
        parArr.forEach(element => {
            if (element.indexOf('.') !== -1) {
                let parts = element.split(".");
                let res = this.result.params[parts[0]][parts[1]];
                newArr.push(res);
            } else if (element === 'this') {

                newArr.push(rThis);
            } else {
                if (!obj.hasOwnProperty(element)) {
                    throw ("Wrong Parameter Name");
                }
                newArr.push(obj[element]);
            }
        });
        return newArr;
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