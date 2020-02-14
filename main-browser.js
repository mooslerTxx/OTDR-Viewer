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

             let sor = new SorReader(false, {
                 browserMode: true
             }, result);
             let data = sor.parse();
             data.then(function (result) {
                 writeToDiv(result);
                 drawChart(result.points);
             })
         }
         fr.readAsArrayBuffer(file);
     }
 }

 /** * Properties  */
 async function writeToDiv(data, waitTime = 1) {
     return Promise.resolve()
         .then(function () {
             let result = createHtmlList(data.params)
             // update the DOM
             setTimeout(function () {
                 document.getElementById('result').innerHTML += result;
             }, waitTime);
             return result;
         });
 }

 function createHtmlList(data) {
     let html = `<ul>`;
     for (const key in data) {
         if (data.hasOwnProperty(key)) {
             const element = data[key];
             if (typeof element === 'object' && element !== null) {
                 html += `<li><b>${key}: </b>${createHtmlList(element)}</li>`;
             } else {
                 html += `<li><b>${key}: </b>${element}</li>`;
             }
         }
     }
     html += `</ul>`;
     return html
 }


 /** Chart */
 async function transformData(data, limit = false) {
     if (!limit) limit = data.points.length
     let dataPoints = []
     let pt = data.points;
     for (var i = 0; i < limit; i += 1) {
         dataPoints.push({
             x: pt[i][0],
             y: pt[i][1]
         });
     }
     return dataPoints;
 }

 async function drawChart(data) {
     var dataPointsR = await this.transformData(data);
     var chart = new CanvasJS.Chart("chartContainer", {
         animationEnabled: true,
         zoomEnabled: true,
         theme: "light2",
         title: {
             text: "Trace"
         },
         axisY: {
             includeZero: false
         },
         data: [{
             type: "line",
             dataPoints: dataPointsR
         }]
     });
     chart.render();
 }