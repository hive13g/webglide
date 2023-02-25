// Grant CesiumJS access to your ion assets
Cesium.Ion.defaultAccessToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiIxZjc3YWRjOS1iN2Y1LTRmMTEtOGIzZS0yYjJkOWJhMzI0YWQiLCJpZCI6MTIyNjI2LCJpYXQiOjE2NzQ5OTg3NzZ9.6jxTIuBLXZWLhwGAK1Qoli6KC1PMgxXZoDgaizIVkXI";

// const viewer = new Cesium.CesiumWidget("cesiumContainer",
// const viewer = new Cesium.Viewer('cesiumContainer',

const viewer = new Cesium.Viewer('cesiumContainer', {
  timeline: false,
  sceneModePicker: false,
  animation: false,
  // creditContainer : false,
  CredentialsContainer: false,
  terrainProvider: Cesium.createWorldTerrain()
});


// Buttons for Loading igc and selecting shader
// IGC-BUTTON
window.viewer = viewer;
const toolbar = document.querySelector("div.cesium-viewer-toolbar");
const modeButton = document.querySelector("span.cesium-sceneModePicker-wrapper");
const igcButton = document.getElementById('inputButton');
igcButton.classList.add("cesium-button", "cesium-toolbar-button");
toolbar.insertBefore(igcButton, modeButton);
// SHADER-BUTTON
const shdButton = document.createElement('button');
shdButton.classList.add("cesium-button", "cesium-toolbar-button");
shdButton.innerHTML = "shd";
// shdButton.className = "collapsible"
toolbar.insertBefore(shdButton, modeButton); 



// VISUAL SETTINGS
viewer.scene.globe.depthTestAgainstTerrain = true;
viewer.scene.postProcessStages.fxaa.enabled = true;
viewer.forceResize();

const osmBuildings = viewer.scene.primitives.add(Cesium.createOsmBuildings());
let igcData;
let jsonResult;
let flightData;

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

        
        
        // THIS ADDS POINTS INSTEAD OF VECTORS
        // //Add points
        // for (let i = 0; i < flightData.length; i++) {
        //   const dataPoint = flightData[i];
        
        //   viewer.entities.add({
        //     description: `Location: (${dataPoint.longitude}, ${dataPoint.latitude}, ${dataPoint.altitude})`,
        //     position: Cesium.Cartesian3.fromDegrees(dataPoint.longitude, dataPoint.latitude, dataPoint.altitude),
        //     point: { pixelSize: 10, color: Cesium.Color.BLUE }
        //   });
        // }

        var rimLightingMaterial = new Cesium.Material({
          fabric : {
            type : 'RimLighting',
            uniforms : {
              color : Cesium.Color.ORANGE
            }
          }
        });
        const materialGlow = new Cesium.PolylineGlowMaterialProperty({glowPower: 0.1, taperPower: 0.1, color: Cesium.Color.ORANGE})

        const positions = [];
        for (let i = 0; i < flightData.length; i++) {
          const dataPoint = flightData[i];
          positions.push(Cesium.Cartesian3.fromDegrees(dataPoint.longitude, dataPoint.latitude, dataPoint.altitude));
        }
        

        viewer.entities.add({
          polyline: {
            positions: positions,
            width: 5,
            material: materialGlow
            }
        });

        //log
        console.log(flightData);


        // get the first coordinate and Camera Position
        const firstCoordinate = Cesium.Cartesian3.fromDegrees(flightData[0].longitude, flightData[0].latitude, flightData[0].altitude);
        const firstCameraPos = Cesium.Cartesian3.fromDegrees(flightData[0].longitude+1000, flightData[0].latitude+1000, flightData[0].altitude+1000);
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

        // Finally, create a Cartesian3 object for the up vector
        // const up = Cesium.Cartesian3.UNIT_Z;

        // Use the lookAt function to rotate the camera around the location
        // viewer.camera.lookAt(firstCoordinate, firstCameraPos, up);

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
          const latitude = line.substring(7, 14);
          const longitude = line.substring(15, 23);
          const altitude = line.substring(30, 35);
          // Convert the latitude and longitude to decimal degrees
          const latDecimal = latitude.slice(0, 2) + '.' + latitude.slice(2);
          const lonDecimal = longitude.slice(0, 3) + '.' + longitude.slice(3);
          // Convert the altitude to meters
          const altMeters = parseFloat(altitude)+150;
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
