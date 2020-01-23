const tableify = require('tableify');
const jsonfile = require('jsonfile');

const fs = require('fs');

class Html {
    constructor() {
        this.extension = ".html";
        this.filename = "index.html";
        this.jsonPath = "";
        this.path = "";
        this.text = "";
    }
    async createHtml(writer) {
        writer.resetName();
        writer.setNewName(".json");
        this.jsonPath = writer.getFullName();
        let path = this.jsonPath;

        await jsonfile.readFile(path, function (err, obj) {
            if (err) {
                console.error(err)
                throw ('Html creation Error');
            }

            let pos = path.lastIndexOf(".");
            let file = path.substr(0, pos < 0 ? path.length : pos) + ".html";
            let html = tableify(obj);

            writer.createFile(html, file);
        });
    }
}

module.exports = Html;