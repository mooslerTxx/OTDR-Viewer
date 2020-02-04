const Parser = require('./parser');
// const FileCreator = require('./filecreator');


class SorReader {
    constructor(path) {
        this.path = path;
        this.config = {
            debug: true, //Logging Infos to Console
            createJson: false //write result in an JsonFile
        }
        this.parser = new Parser(this.path, this.config);
        // this.fileCreater = new FileCreator(this.path);
    }
    async parse() {
        try {
            let result = this.parser.run();
            if (this.config.createJson) {
                // await this.fileCreater.createFile(result.params);
                // await this.writer.createFile(this.fileinfo, "_fileInfo");
                // await this.fileCreater.createFile(result.points, "_points");
            } else {
                return (result);
            }
        } catch (err) {
            console.log(`There was an parsing error: ${err}`);
        }
    }

}

module.exports = SorReader;