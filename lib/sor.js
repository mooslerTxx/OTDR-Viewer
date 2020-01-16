const BinaryFile = require('binary-file');

class Sor {
    constructor(path) {
        this.path = path;
        this.bf = new BinaryFile(path, 'r', true);
        this.result = new Result(path);
        this.reader = new Reader(this.bf);
    }
    async parse() {
        try {
            await this.bf.open();
            console.log('File opened');

            this.result.version = await this.reader.getVersion();
            this.result.fullversion = await this.reader.getFullVersion();
            this.result.map = await this.reader.getMap();
            this.result.blocks = await this.reader.getBlocks(this.result.map);
            // var temp = await this.reader.getMap();
            // console.log(`${temp}`);

            console.log(this.result);

            await this.bf.close();
            console.log('File closed');
        } catch (err) {
            console.log(`There was an error: ${err}`);
        }
    }


}

class Reader {
    constructor(bf) {
        this.bf = bf;
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