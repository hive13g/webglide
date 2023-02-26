//TODO:
//Coordinate Shift
//get rid of unfunctional maps
//colorpicker for Polylines
//in CZML für animation umwandeln
//create materials
//cast shadow to ground
//Fehler wenn farbe geändert wird bevor igc geladen ist
//select liste setzt nicht zurück


//INITIALISATION
// Grant CesiumJS access to your ion assets
Cesium.Ion.defaultAccessToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiIxZjc3YWRjOS1iN2Y1LTRmMTEtOGIzZS0yYjJkOWJhMzI0YWQiLCJpZCI6MTIyNjI2LCJpYXQiOjE2NzQ5OTg3NzZ9.6jxTIuBLXZWLhwGAK1Qoli6KC1PMgxXZoDgaizIVkXI";

const viewer = new Cesium.Viewer('cesiumContainer', {
  timeline: false,
  sceneModePicker: false,
  animation: false,
  // creditContainer : false,
  CredentialsContainer: false,
  terrainProvider: Cesium.createWorldTerrain()
});

// VISUAL SETTINGS
viewer.scene.globe.depthTestAgainstTerrain = true;
viewer.scene.postProcessStages.fxaa.enabled = true;
viewer.forceResize();

const osmBuildings = viewer.scene.primitives.add(Cesium.createOsmBuildings());
let igcData;
let jsonResult;
let flightData;

// Buttons for Loading igc, selecting shader & Colorpicker
// IGC-BUTTON
window.viewer = viewer;
const toolbar = document.querySelector("div.cesium-viewer-toolbar");
const modeButton = document.querySelector("span.cesium-sceneModePicker-wrapper");

const igcButton = document.getElementById('inputButton');
igcButton.classList.add("cesium-button", "cesium-toolbar-button");
toolbar.insertBefore(igcButton, modeButton);
// SHADER-BUTTON
// const shdButton = document.createElement('button');
const shdButton = document.getElementById('shaders');
document.getElementById('shaders').selectedIndex = 0;
shdButton.classList.add("cesium-button"); //, "cesium-toolbar-button"
toolbar.insertBefore(shdButton, modeButton);

//COLORPICKER
//function to convert Hex -> Cesium.Color
String.prototype.convertToRGB = function(){
  var aRgbHex = this.match(/#([0-9A-F]{2})([0-9A-F]{2})([0-9A-F]{2})/i).slice(1);

  return new Cesium.Color(
              Cesium.Color.byteToFloat(parseInt(aRgbHex[0], 16)),
              Cesium.Color.byteToFloat(parseInt(aRgbHex[1], 16)),
              Cesium.Color.byteToFloat(parseInt(aRgbHex[2], 16)),
              1
             );
}

const colButton = document.createElement('input');
colButton.type = 'color';
colButton.value = '#0066ff';//default color
colButton.classList.add("cesium-button", "cesium-toolbar-button");
toolbar.insertBefore(colButton, modeButton);
var pickedHexColor = colButton.value
var polyRgbColor = pickedHexColor.convertToRGB();

console.log("hex color is: "+pickedHexColor);
console.log("rgb color is: "+polyRgbColor);

colButton.addEventListener('change',(event) => {
  polyRgbColor = new Cesium.Color(pickedHexColor.convertToRGB());
  pickedHexColor = colButton.value;
  entity.polyline.material.color = pickedHexColor.convertToRGB();
  console.log("applied color is: "+entity.polyline.material.color);
})

//MATERIALS
//colorstyle:
//Cesium.Color.ORANGE
var entity = [];
var positions = [];
var material1 = new Cesium.PolylineGlowMaterialProperty({glowPower: 0.2, taperPower: 0.7, color: polyRgbColor}); 
var material2 = new Cesium.PolylineGlowMaterialProperty({glowPower: 1, taperPower: 1, color: polyRgbColor});
var material3 = new Cesium.PolylineOutlineMaterialProperty({color: polyRgbColor, outlineWidth: 1});
var material4 = new Cesium.PolylineOutlineMaterialProperty({color: polyRgbColor, outlineWidth: 1});
var defaultMaterial = material1;

const materialSelect = document.getElementById('shaders');
materialSelect.addEventListener("change",(event) => {
  changeShader();
})

//Change SHADER
function changeShader(){
  switch(materialSelect.value){
    case 's1':
      entity.polyline.material = material1;
      console.log("material1: "+entity.polyline.material.color);
      break;
    case 's2':
      entity.polyline.material = material2;
      console.log("material2: "+entity.polyline.material.color);
      break;
    case 's3':
      entity.polyline.material = material3;
      console.log("material3: "+entity.polyline.material.color);
      break;
    case 's4':
      entity.polyline.material = material4;
      console.log("material4: "+entity.polyline.material.color);
      break;
    default:
      entity.polyline.material = defaultMaterial;
      entity.polyline.color = polyRgbColor;
  };
  entity.polyline.color = polyRgbColor;
};

// Get the file input element
const fileInput = document.getElementById('fileInput');
// Listen for changes to the file input element
fileInput.addEventListener('change', (event) => {
    // Get the first selected file
    const file = event.target.files[0];
    // Create a new FileReader object
    const reader = new FileReader();
    // Listen for the 'load' event on the FileReader object
    reader.addEventListener('load', (event) => {
        // Delete all (previous) polylines
        for (var i = 0; i < viewer.entities.values.length; ++i) {
          viewer.entities.remove(viewer.entities.values[i]);
        };
        // Get the file contents as a string
        igcData = event.target.result;
        jsonResult = convertIgcToJson(igcData);

        try {
          JSON.parse(jsonResult);
          console.log("valid json")
        } catch (error) {
          console.error("Invalid JSON: " + error);
        }

        flightData = JSON.parse(jsonResult);
        
        // THIS ADDS POINTS INSTEAD OF POLYLINES
        // //Add points
        // for (let i = 0; i < flightData.length; i++) {
        //   const dataPoint = flightData[i];
        
        //   viewer.entities.add({
        //     description: `Location: (${dataPoint.longitude}, ${dataPoint.latitude}, ${dataPoint.altitude})`,
        //     position: Cesium.Cartesian3.fromDegrees(dataPoint.longitude, dataPoint.latitude, dataPoint.altitude),
        //     point: { pixelSize: 10, color: Cesium.Color.BLUE }
        //   });
        // }
        
        // POLYLINE
        // const
        positions = [];
        for (let i = 0; i < flightData.length; i++) {
          const dataPoint = flightData[i];
          positions.push(Cesium.Cartesian3.fromDegrees(dataPoint.longitude, dataPoint.latitude, dataPoint.altitude));
        }
        //var
        entity =[];
        entity = viewer.entities.add({
          polyline: {
            positions: positions,
            width: 5,
            material: defaultMaterial
            }
        });

        //log
        console.log(flightData);

        // get the first coordinate and Camera Position
        const firstCoordinate = Cesium.Cartesian3.fromDegrees(flightData[0].longitude, flightData[0].latitude, flightData[0].altitude);
        const firstCameraPos = Cesium.Cartesian3.fromDegrees(flightData[0].longitude, flightData[0].latitude, flightData[0].altitude+1000);
        // viewer.camera.lookAt(firstCoordinate, new Cesium.HeadingPitchRange(0, Cesium.Math.toRadians(-90)));
        viewer.camera.flyTo({
          destination : firstCameraPos,
          orientation: {
            // heading : Cesium.Math.toRadians(0),
            // pitch : Cesium.Math.toRadians(-90),
            roll : 0.0
          },
          duration: 2
        });
    });
    // Read the file as a text file
    reader.readAsText(file);
});

// Take the igc file and convert it to a JSON file
function convertIgcToJson(igcData) {
  // Split the IGC data into individual lines
  const lines = igcData.split('\n');
  // Initialize an empty array to store the JSON data
  const jsonData = [];
  // Iterate through the lines of IGC data
  for (const line of lines) {
      // Check if the line starts with the "B" record identifier
      if (line.startsWith('B')) {
          // Extract the latitude, longitude, and altitude from the line
          const latitude = line.substring(7, 15);//1519094N
          const longitude = line.substring(15, 24);//00832713E
          const altitude = line.substring(30, 35);
          console.log("latitude: "+latitude);
          console.log("longitude: "+longitude);
          // Convert the latitude and longitude to decimal degrees
          //        Latitude Longitude
          //        01234567 012345678
          //        7     14 15     23
          //        DDMMmmm  DDDMMmmm
          //B130512 1519094N 00832713E A0086700720
          const latDecimal = latitude.slice(0, 2) + '.' + latitude.slice(2, 7);
          // const latDecimal = (Math.round((parseInt(latitude.slice(0,2)) + parseInt(latitude.slice(2,4))/60 + parseInt(latitude.slice(4,7))/3600)*100000)/100000).toString();
          console.log(latDecimal);
          const lonDecimal = longitude.slice(0, 3) + '.' + longitude.slice(3, 8);
          // const lonDecimal = (Math.round((parseInt(longitude.slice(0,3)) + parseInt(longitude.slice(3,5))/60 + parseInt(longitude.slice(5,8))/3600)*100000)/100000).toString();
          console.log(lonDecimal);
          // Convert the altitude to meters
          const altMeters = parseFloat(altitude)+150;
          // Add the data to the jsonData array as an object

          // if(latitude.charAt(23)="S"){latDecimal=latDecimal*(-1)};
          // if(longitude.charAt(14)="W"){lonDecimal=lonDecimal*(-1)};

          jsonData.push({
              latitude: latDecimal,
              longitude: lonDecimal,
              altitude: altMeters
          });
      }
  }
  // return the jsonData
  return JSON.stringify(jsonData);
}
