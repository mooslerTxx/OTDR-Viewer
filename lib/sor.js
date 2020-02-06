const Parser = require('./parser');
var fs = require('fs');


class SorReader {
    constructor(path, config = {}) {
        this.path = path;
        this.defaulConfig = {
            debug: false, //Logging Infos to Console
            createJson: false, //write result in an JsonFile
            jsonPath: '.', //if createJson is true this is the path there the json file is saved
            jsonName: 'result.json', //if createJson is true this is the name of the json File
            devMode: false //For Development: if true only the first 100 DataPoints are read
        }
        this.config = {
            ...this.defaulConfig,
            ...config
        }
        this.parser = new Parser(this.path, this.config);
    }
    async parse() {
        try {
            let result = await this.parser.run();
            let filename = this.config.jsonPath + '/' + this.config.jsonName;
            if (this.config.createJson) {
                let data = JSON.stringify(result);
                fs.writeFileSync(filename, data);
            } else {
                return (result);
            }
        } catch (err) {
            console.log(`There was an parsing error: ${err}`);
        }
    }
}

module.exports = SorReader;