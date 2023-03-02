//TODO:
//get rid of unfunctional maps
//create better materials
//Fehler wenn farbe geändert wird bevor igc geladen ist
//selection info

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
document.getElementById('shadowCheckboxId').checked = false;

//for standart color picker
String.prototype.convertToRGB = function(){
  var aRgbHex = this.match(/#([0-9A-F]{2})([0-9A-F]{2})([0-9A-F]{2})/i).slice(1);
  return new Cesium.Color(
              Cesium.Color.byteToFloat(parseInt(aRgbHex[0], 16)),
              Cesium.Color.byteToFloat(parseInt(aRgbHex[1], 16)),
              Cesium.Color.byteToFloat(parseInt(aRgbHex[2], 16)),
              1
             );
}

//add free maptiler provider
// viewer.terrainProvider = new Cesium.CesiumTerrainProvider({
//   url: 'https://api.maptiler.com/tiles/terrain-quantized-mesh/?key=dW6k66j5cVBmkPBjZaAH' // get your own key at https://cloud.maptiler.com/
// });


// VISUAL SETTINGS
viewer.scene.globe.depthTestAgainstTerrain = true;
viewer.scene.postProcessStages.fxaa.enabled = true;
viewer.forceResize();
const osmBuildings = viewer.scene.primitives.add(Cesium.createOsmBuildings());

//VARIABLES
let igcData;
let jsonResult;
let flightData;
let heightCorrection;
let positions = [];
let entity = [];
let entityShadow = [];
let entityPoints = [];
let defaultColor = '#EEEEEE';
let pickedHexColor = defaultColor.convertToRGB();


// Buttons for Loading igc, selecting shader & Colorpicker
// IGC-BUTTON
window.viewer = viewer;
const toolbar = document.querySelector("div.cesium-viewer-toolbar");
const modeButton = document.querySelector("span.cesium-sceneModePicker-wrapper");
const igcButton = document.getElementById('inputButton');
igcButton.classList.add("cesium-button", "cesium-toolbar-button");/////////////////////////////////////
toolbar.insertBefore(igcButton, modeButton);


// SHADER-BUTTON (Forms)
// const shdButton = document.createElement('button');
const shdButton = document.getElementById('shaders');
shdButton.disabled = true;
document.getElementById('shaders').selectedIndex = 0;
shdButton.classList.add("cesium-button");
toolbar.insertBefore(shdButton, modeButton);

//Change SHADER (Forms)
function changeShader(){
  switch(materialSelect.value){
    case 's1':
      entity.polyline.material = material1;
      entity.polyline.material.color = pickedHexColor;
      console.log("material1: "+entity.polyline.material.color);
      break;
    case 's2':
      entity.polyline.material = material2;
      entity.polyline.material.color = pickedHexColor;
      console.log("material2: "+entity.polyline.material.color);
      break;
    case 's3':
      entity.polyline.material = material3;
      entity.polyline.material.color = pickedHexColor;
      console.log("material3: "+entity.polyline.material.color);
      break;
    case 's4':
      entity.polyline.material = material4;
      entity.polyline.material.color = pickedHexColor;
      console.log("material4: "+entity.polyline.material.color);
      break;
    default:
      entity.polyline.material = defaultMaterial;
      entity.polyline.material.color = pickedHexColor;
  };
  entity.polyline.color = pickedHexColor;
};

//SHADOW
//checkbox to show shadow or not
let shadowCheckbox = document.getElementById('shadowCheckboxId');
shadowCheckbox.disabled = true;
// shadowCheckbox.classList.add("cesium-button");
// toolbar.insertBefore(shadowCheckbox, modeButton);
const shadowCheckboxLabel = document.getElementById('checkDiv');
shadowCheckboxLabel.classList.add("cesium-button");//, "cesium-toolbar-button"
toolbar.insertBefore(shadowCheckboxLabel, modeButton);

shadowCheckbox.addEventListener('change',(event) => {
  if(shadowCheckbox.checked){
      //if entity shadow was already created
      if(typeof entityShadow == 'undefined' || entityShadow.length == 0){
          //and if a file was selected to load from
          if(document.getElementById("fileInput").value != "") {
              //add positions from file to entities
              console.log('loading shadows...')
              entityShadow = viewer.entities.add({
                polyline: {
                  positions: positions,
                  width: 5,
                  material: material5,
                  clampToGround: true
                  }
              });
              console.log('loading shadows finished')
          }else{alert('no file selected')};
      } else {console.log('entityShadows visible = true')};
      entityShadow.polyline.show = new Cesium.ConstantProperty(true);
  } else {
      if(entityShadow != []){
          console.log('entityShadows visible = false')
          entityShadow.polyline.show = new Cesium.ConstantProperty(false);
      }
  };
})

//COLORPICKER

//huebee framework (MIT License)
var colorInput = document.getElementById('inputPicker');
var hueb = new Huebee( colorInput, {
    hues: 12,      // columns
    hue0: 0,    // the first hue of the color grid. default: 0
    shades: 7, //rows
    saturations: 1, //fields
    notation: 'hex',// the text syntax of colors
    // values: shortHex, hex, hsl
    // shortHex => #F00, hex => #FF0000, hsl => hsl(0, 100%, 50%)
    // default: shortHex
    setText: false,// sets text of elements to color, and sets text color
    // true => sets text of anchor
    // string, '.color-text' => sets elements that match selector
    // default: true
    setBGColor: false,
    customColors: [ '#FFE66D', '#C6E0FF', '#4ECDC4', '#FF6B6B' ],// custom colors added to the top of the grid
    staticOpen: false,
    className: 'color-input-picker',
});
  
let button = document.getElementById('inputPicker');
button.classList.add("cesium-button");//, "cesium-toolbar-button"
toolbar.insertBefore(button, modeButton);
button.disabled = true;

button.style.background=defaultColor;

hueb.on( 'change', function( color, hue, sat, lum ) {
  entity.polyline.material.color = color.convertToRGB();
  console.log( 'color changed to: ' + color.convertToRGB())
  pickedHexColor = color.convertToRGB();
  button.style.background=color;
  hueb.close();
})

//STANDARD PICKER
// const colButton = document.createElement('input');
// colButton.type = 'color';
// colButton.id = 'colButton';
// colButton.value = '#0066ff';//default color
// colButton.disabled = true;
// colButton.classList.add("cesium-button", "cesium-toolbar-button");
// toolbar.insertBefore(colButton, modeButton);
// var pickedHexColor = colButton.value
// var polyRgbColor = pickedHexColor.convertToRGB();

// colButton.addEventListener('change',(event) => {
//   polyRgbColor = pickedHexColor.convertToRGB();
//   pickedHexColor = colButton.value;
//   entity.polyline.material.color = pickedHexColor.convertToRGB();
// })

//MATERIALS
var material1 = new Cesium.PolylineOutlineMaterialProperty({color: pickedHexColor, outlineWidth: 3});
var material2 = new Cesium.PolylineGlowMaterialProperty({glowPower: 0.6, taperPower: 1, color: pickedHexColor});
var material3 = new Cesium.PolylineOutlineMaterialProperty({color: pickedHexColor, outlineColor: Cesium.Color.WHITE, outlineWidth: 3});
var material4 = new Cesium.PolylineGlowMaterialProperty({glowPower: 0.1, taperPower: 1, color: pickedHexColor}); 
var material5 = new Cesium.PolylineOutlineMaterialProperty({color: Cesium.Color.GREY, outlineWidth: 1});
var defaultMaterial = material1;

const materialSelect = document.getElementById('shaders');
materialSelect.addEventListener("change",(event) => {
  changeShader();
})

//LOAD IGC FILE AFTER FILE WAS SELECTED
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
        jsonResult = convertIgcToJson(igcData);//converts to json for formatting and parsing

        try {
          JSON.parse(jsonResult);
          console.log("valid json")
        } catch (error) {
          console.error("Invalid JSON: " + error);
        }
        flightData = JSON.parse(jsonResult);
        
        // THIS ADDS DATA POINTS (other than polylines)
  
        // for (let i = 0; i < flightData.length; i++) {
        //   const dataPoint = flightData[i];
        //   entityPoints = [];
        //   entityPoints = viewer.entities.add({
        //     description: `Location: (${dataPoint.longitude}, ${dataPoint.latitude}, ${dataPoint.altitude})`,
        //     position: Cesium.Cartesian3.fromDegrees(dataPoint.longitude, dataPoint.latitude, dataPoint.altitude),
        //     point: { pixelSize: 3, color: Cesium.Color.BLUE }
        //   });
        // }

        // POLYLINE
        
        viewer.scene.globe.depthTestAgainstTerrain = true;
        let xcoo = Cesium.Cartographic.fromDegrees(flightData[0].longitude,flightData[0].latitude);
        
        let heightCorrectionCheck = heightCorrection;

        Cesium.sampleTerrain(viewer.terrainProvider, 9, [xcoo])
        .then(function(samples) {
          // console.log('Height0 in meters is: ' + samples[0].height);
          heightCorrection = flightData[0].altitude - samples[0].height;
          // console.log('Height1 in meters is: ' + heightCorrection);
        });

        //HEIGHT CORRECTION
        //waiting for heightCorrection to be determined
        (async() => {
          console.log("waiting for variable");
          while(heightCorrection == undefined || heightCorrection == heightCorrectionCheck)
              await new Promise(resolve => setTimeout(resolve, 1000));
          //here heightCorrection is defined
          console.log('Korrektur beträgt: '+ heightCorrection);
          positions = [];
          for (let i = 0; i < flightData.length; i++) {
            const dataPoint = flightData[i];
            dataPoint.altitude=dataPoint.altitude-0;
            positions.push(Cesium.Cartesian3.fromDegrees(dataPoint.longitude, dataPoint.latitude, dataPoint.altitude));
          };
          //add entities to map
          console.log("positions defined");
          entity =[];
          entity = viewer.entities.add({
            polyline: {
              positions: positions,
              width: 5,
              material: defaultMaterial,
              }
          });

          //add point to start and end
          // let entityStartEnd = [];
          //     entityStartEnd = viewer.entities.add({
          //     positions: positions[0],
          //     point: {pixelSize: 5, color: Cesium.Color.RED}
          // });
      
          console.log("entities loaded");
        })();
        //console.log("above code doesn't block main function stack");

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
          duration: 3
        });
    });
    //enable manipulators
    button.disabled = false;
    shadowCheckbox.disabled = false;
    shdButton.disabled = false;
    
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
          const latitude = line.substring(7, 15);
          const longitude = line.substring(15, 24);
          const altitude = line.substring(25, 30);
         
          // Convert the latitude and longitude to decimal degrees
          const latDecimal = parseFloat(latitude.slice(0, 2)) + parseFloat(latitude.slice(2, 7)) / 6e4;
          const lonDecimal = parseFloat(longitude.slice(0, 3)) + parseFloat(longitude.slice(3, 8)) / 6e4;
          
          // Convert the altitude to meters
          const altMeters = parseFloat(altitude);

          //ADD for South/West values
          // if(latitude.charAt(23)="S"){latDecimal=latDecimal*(-1)};
          // if(longitude.charAt(14)="W"){lonDecimal=lonDecimal*(-1)};

          // Add the data to the jsonData array as an object
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
