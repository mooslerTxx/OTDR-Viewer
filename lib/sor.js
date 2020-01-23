const BinaryFile = require('binary-file');
const Writer = require('./writer');
const Html = require('./html');
const Reader = require('./reader');

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
        this.fileinfo = new Fileinfo(path);
        this.result = new Result();
        this.tracePoints = {};
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
            await this.writer.createFile(this.fileinfo, "fileInfo");
            await this.writer.createFile(this.tracePoints, "points");
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
        this.fileinfo.version = await this.reader.getVersion();
        this.fileinfo.fullversion = await this.reader.getFullVersion();
    }
    async getMap() {
        this.fileinfo.map = await this.reader.getMap();
        this.fileinfo.blocks = await this.reader.getBlocks(this.fileinfo.map);
    }
    async getParams() {
        var blockNames = ["GenParams", "SupParams", "FxdParams", "DataPts", "KeyEvents", "Cksum"];

        for (var bname in this.fileinfo['blocks']) {
            if (blockNames.includes(bname)) {
                let lowName = bname.toLowerCase();

                let result = await this.reader.extractParams(this.fileinfo, bname);
                // this.result[lowName] = result;
                this.fileinfo[lowName] = result['fileinfo'];
                this.result[lowName] = result['result'];
                if ('points' in result) {
                    this.tracePoints = result['points'];
                }
            } else {
                console.log("Ignoring Data Blog: " + bname);
            }
        }
        // console.log(this.fileinfo);
        // console.log(this.result);
    }
}


class Fileinfo {
    constructor(path) {
        this.path = path;
        this.version = "";
        this.fullversion = "";
        this.map = {};
        this.blocks = {};
    }
}

class Result {
    constructor() {
        this.genparams = {};
        this.supparams = {};
        this.fxdparams = {};
        this.datapts = {};
        this.keyevents = {};
        this.cksum = {};
    }
}




module.exports = Sor;