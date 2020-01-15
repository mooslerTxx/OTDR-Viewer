const path = require('path');
const Sor = require( path.join(__dirname, './lib/sor.js') );

let arg = process.argv;

let filepath1 = path.join(__dirname,'./data/EXFO_FTB7400_1550_U.SOR');
let filepath2 = path.join(__dirname,'./data/JDSU_MTS6000_1310_G.sor');

let filepath = filepath2;

let filename = path.basename(filepath);
let ext = path.extname(filepath).toUpperCase();

if(ext !== '.SOR'){
    throw 'only Files with file extension ".sor" allowed'; 
}

console.log(`Reading File ${filename} in Folder ${filepath}`);
let sor = new Sor(filepath);

sor.parse();
