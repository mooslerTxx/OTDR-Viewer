 //https://stackoverflow.com/questions/3146483/html5-file-api-read-as-text-and-binary

 function loadFile() {
     var input, file, fr;

     if (typeof window.FileReader !== 'function') {
         bodyAppend("p", "The file API isn't supported on this browser yet.");
         return;
     }

     input = document.getElementById('fileinput');
     if (!input) {
         bodyAppend("p", "Um, couldn't find the fileinput element.");
     } else if (!input.files) {
         bodyAppend("p", "This browser doesn't seem to support the `files` property of file inputs.");
     } else if (!input.files[0]) {
         bodyAppend("p", "Please select a file before clicking 'Load'");
     } else {
         file = input.files[0];
         fr = new FileReader();
         fr.onload = function (event) {
             let result = event.target.result;

             //  let bin = new BinReader(result);
             //  bin.parse();
             let sor = new SorReader(false, {
                 browserMode: true
             }, result);
             sor.parse();

         }
         fr.readAsArrayBuffer(file);

     }

 }