const BINARY_LENGTH = {
    'Int8': 1,
    'UInt8': 1,
    'Int16': 2,
    'UInt16': 2,
    'Int32': 4,
    'UInt32': 4,
    'Float': 4,
    'Double': 8
};

class BinReader {
    constructor(data, endian = 'LE') {
        this.data = data;
        this.uBuffer = new Uint8Array(data);
        this.iBuffer = new Int8Array(data);
        this.endian = endian;
        this.cursor = 0;
    }
    async getString() {
        var mystr = "";
        var byte = await this.read(1);
        while (byte != 0) {
            mystr += String.fromCharCode(byte);
            byte = await this.read(1);
        }
        return mystr;
    }
    async readString(length) {
        let name = "";
        for (let index = 0; index < length; index++) {
            var byte = await this.read(1);
            name += String.fromCharCode(byte);
        }
        return name;
    }

    async read(length, position = false, type = "Int") {
        if (position === false) {
            position = this.cursor;
        }
        let buffer = [];
        if (type === "uInt") {
            buffer = this.uBuffer;
        } else {
            buffer = this.iBuffer;
        }
        let endPos = position + length;
        let bytesArr = "";
        for (var n = position; n < endPos; ++n) {
            let byte = buffer[n];
            bytesArr = byte + bytesArr;
        }
        this.cursor = n;
        return bytesArr;

    }

    // 'Int8' and 'UInt8' = length 1;'Int16' and 'UInt16' = length 2;
    async readInt(length, position = false) {
        let result = await this.read(length, position, "Int");
        return parseInt(result);
    }
    async readUInt(length, position = false) {
        let result = await this.read(length, position, "uInt");
        return parseInt(result);
    }

    async seek(position) {
        this.cursor = position;
        return position;
    }

    async readInt8(position) {
        let length = BINARY_LENGTH['Int8'];
        return this.readInt(length, position);
    }

    async readUInt8(position) {
        let length = BINARY_LENGTH['UInt8'];
        return this.readUInt(length, position);
    }

    async readInt16(position) {
        let length = BINARY_LENGTH['Int16'];
        return this.readInt(length, position);
    }

    async readUInt16(position) {
        let length = BINARY_LENGTH['UInt16'];
        return this.readUInt(length, position);
    }

    async readInt32(position) {
        let length = BINARY_LENGTH['Int32'];
        return this.readInt(length, position);
    }

    async readUInt32(position) {
        let length = BINARY_LENGTH['UInt32'];
        return this.readUInt(length, position);
    }

    async readFloat(position) {
        let length = BINARY_LENGTH['Float'];
        return this.read(length, position);
    }

    async readDouble(position) {
        let length = BINARY_LENGTH['Double'];
        return this.read(length, position);
    }

    // async readString(length, position) {
    //     return new Promise((resolve) => {
    //         this.read(length, position).then((buffer) => {
    //             const value = buffer.toString();
    //             resolve(value);
    //         });
    //     });
    // }
}

module.exports = BinReader;