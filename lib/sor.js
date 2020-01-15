
const BinaryFile = require('binary-file');
const myBinaryFile = new BinaryFile('./data/JDSU_MTS6000_1310_G.sor', 'r', true);
(async function () {
    try {
      await myBinaryFile.open();
      console.log('File opened');
      const stringLength = await myBinaryFile.readUInt32();
      const string = await myBinaryFile.readString(stringLength);
      console.log(`File read: ${string}`);
      await myBinaryFile.close();
      console.log('File closed');
    } catch (err) {
      console.log(`There was an error: ${err}`);
    }
  })();

class Sor{
    constructor(path){
        this.path = path;
        this.bf = new BinaryFile(path, 'r', true);
    }
    parse(){
        // (async function () {
        //     try {
        //       await this.bf.open();
        //       console.log('File opened');
        //       const stringLength = await this.bf.readUInt32();
        //       const string = await this.bf.readString(stringLength);
        //       console.log(`File read: ${string}`);
        //       await this.bf.close();
        //       console.log('File closed');
        //     } catch (err) {
        //       console.log(`There was an error: ${err}`);
        //     }
        //   })();
    }

}

module.exports = Sor;