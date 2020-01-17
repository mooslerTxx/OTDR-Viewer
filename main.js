/**
 * http://morethanfootnotes.blogspot.com/2015/07/the-otdr-optical-time-domain.html?view=sidebar
 */
const path = require('path');
const Sor = require(path.join(__dirname, './lib/sor.js'));

let arg = process.argv;
let dir = './';
let datapath = dir + 'data';
let filename1 = 'EXFO_FTB7400_1550_U.SOR';
let filename2 = 'JDSU_MTS6000_1310_G.sor';
// let filepath1 = path.join(__dirname,'./data/EXFO_FTB7400_1550_U.SOR');

let filepath = datapath + '/' + filename1;
let filename = path.basename(filepath);
let basename = path.posix.basename(__dirname);
let ext = path.extname(filepath).toUpperCase();
if (ext !== '.SOR') {
    throw 'only Files with file extension ".sor" allowed';
}

console.log(`Reading File ${filename} in Folder ${basename}`);

let sor = new Sor(filepath, datapath);
sor.parse();