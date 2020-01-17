const tableify = require('tableify');
const jsonfile = require('jsonfile');

const fs = require('fs');

class Html {
    constructor() {
        this.writer = {};
        this.extension = ".html";
        this.filename = "index.html";
    }
    async createHtml(writer) {
        this.writer = writer;
        let read = writer.getJsonFilename();
        let path = writer.getFilename();
        this.filename = path + this.extension;

        await jsonfile.readFile(read, function (err, obj) {
            if (err) {
                console.error(err)
                throw ('Html creation Error');
            }
            let pos = read.lastIndexOf(".");
            let file = read.substr(0, pos < 0 ? read.length : pos) + ".html";
            let html = tableify(obj);
            writer.createFile(html, file);
        });

    }
}

module.exports = Html;