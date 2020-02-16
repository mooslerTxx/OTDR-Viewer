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
                 this.showResults(result);

             })
         }
         fr.readAsArrayBuffer(file);
     }
 }

 async function showResults(data) {
     let props = await createPropertyList(data.params);
     await this.writeToDiv(props, 'result');
     drawChart(data.points);
     let events = await getEvents(data.events, data.summary);
     await writeToDiv(events, 'event-sum');
 }


 /** * append Innerhtml  */
 async function writeToDiv(data, idName, waitTime = 1) {
     return Promise.resolve()
         .then(function () {
             setTimeout(function () {
                 document.getElementById(idName).innerHTML += data;
             }, waitTime);
             return result;
         });
 }

 /** * Properties  */
 async function createPropertyList(data) {
     let html = `<ul>`;
     for (const key in data) {
         if (data.hasOwnProperty(key)) {
             const element = data[key];
             if (typeof element === 'object' && element !== null) {
                 html += `<li><b>${key}: </b>${await createPropertyList(element)}</li>`;
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
         exportEnabled: true,
         zoomEnabled: true,
         //  theme: "light2",
         title: {
             text: "Trace"
         },
         axisY: {
             title: "Refelection",
             suffix: " dB"

         },
         axisX: {
             title: "Distance",
             suffix: " km"
         },
         toolTip: {
             shared: true
         },
         data: [{
             type: "line",
             dataPoints: dataPointsR
         }]
     });
     chart.render();
 }

 /** Table Events */
 async function getEvents(events, summary) {
     let html = ``;
     html += await createTable(events, "Events");
     html += await createTable(summary, "Summary");
     return html;
 }

 async function createTable(data, name) {
     let html = `<h3>${name}</h3>`;
     html += `<table>`;
     if (Array.isArray(data)) {
         html += await getHeaders(data[0]);
     } else {
         html += await getHeaders(data);
     }
     html += await this.getTableBody(data);
     html += `</table>`;

     return html
 }
 async function getTableBody(data) {
     let html = `<tbody>`;
     if (Array.isArray(data)) {
         for (let i = 0; i < data.length; i++) {
             const element = data[i];
             html += `<tr>`;
             html += await this.getTd(element);
             html += `</tr>`;
         }
     } else {
         html += `<tr>`;
         html += await this.getTd(data);
         html += `</tr>`;
     }

     html += `</tbody>`;
     return html;
 }

 async function getTd(data) {
     let html = '';
     for (const key in data) {
         if (data.hasOwnProperty(key)) {
             const element = data[key];
             html += `<td>${element}</td>`;
         }
     }
     return html;
 }
 async function getHeaders(data) {
     let html = `<thead><tr>`;
     for (const key in data) {
         html += `<th>${key}</th>`;
     }
     html += `</tr></thead>`;
     return html;
 }