const path = require('path');
const jsonfile = require('jsonfile');


class Writer {
    /**
     * The extension of an sor file can be: "sor" or "SOR"!
     * @param {*} dataPath 
     */
    constructor(dataPath) {
        // this.cfilename = path.basename(dataPath);
        this.sorPath = dataPath;
        this.ext = path.extname(dataPath);
        this.filename = dataPath.split('.').slice(0, -1).join('.');
        this.newExtension = ".json";
        this.newFilename = this.filename + this.newExtension;

    }
    getJsonFilename() {
        return this.newFilename;
    }
    getFilename() {
        return this.filename;
    }
    async createFile(obj, filename = this.newFilename) {
        jsonfile.writeFile(filename, obj)
            .then(res => {
                console.log('Write complete: ' + filename)
            })
            .catch(error => console.error(error))
    }
}

module.exports = Writer;