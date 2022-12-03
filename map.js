/*const fs = require("fs");
const XLSX = require("xslx");
const jsontoxml = require("jsontoxml");

const workbook = XLSX.readFile("Jolla 5 Primary Parcels.xlsx");
*/
// = "AIzaSyDiqdv1BdXS8PPbBvuCFr5ZDrnQi1kkQ-c";
//let apiKeyReport = "FXgevQoNSg";

//import { parcel } from "./readExcel.js";
let parcel  = require('./readExcel')
console.log(parcel);

let map;
let infoWindow = null;
let mapFeatures = [];

function initialize() {
  let mapOptions = {
    center: new google.maps.LatLng(39.80986, -98.555183),
    zoom: 5,
    mapTypeId: google.maps.MapTypeId.ROADMAP,
  };
  map = new google.maps.Map(document.getElementById("map"), mapOptions);
  REP.Layer.Google.Initialize(map, { Return_Buildings: true });

  // Cause click on map to show attribute popup and highlight parcel.
  google.maps.event.addListener(map, "click", function (event) {
    if (map.getZoom() < REP.Layer.Google.MIN_ZOOM) return;

    // Close any previous InfoWindow and hide any previous features.
    if (infoWindow !== null) infoWindow.close();
    infoWindow = null;
    for (let i = 0; i < mapFeatures.length; i++) mapFeatures[i].setMap(null);
    mapFeatures = [];

    let latLng = event.latLng;

    REP.Layer.Google.IdentifyByPoint(
      map,
      latLng,
      function (resp) {
        let wText = "";
        if (resp.results.length) {
          let respRow0 = resp.results[0];
          for (let respKey in respRow0) {
            let respVal = respRow0[respKey];
            if (respVal === null) continue;
            if (respKey === "geom") {
              // Add parcel geometry (possibly multiple if multipart) to map.
              for (let i = 0; i < respVal.length; i++) {
                respVal[i].setOptions({
                  fillColor: "red",
                  strokeColor: "black",
                });
                respVal[i].setMap(map);
                mapFeatures.push(respVal[i]);
              }
            } else if (respKey === "buildings_poly") {
              // Iterate through each building record.
              for (
                let bldgRecIdx = 0;
                bldgRecIdx < respVal.length;
                bldgRecIdx++
              ) {
                let bldgRec = respVal[bldgRecIdx];
                if (
                  typeof bldgRec["geom"] === "undefined" ||
                  bldgRec["geom"] === null
                )
                  continue;
                let bldgRecGeoms = bldgRec["geom"];
                // Add each building geometry to map.
                for (let i = 0; i < bldgRecGeoms.length; i++) {
                  bldgRecGeoms[i].setOptions({
                    strokeColor: "rgb(255,128,255)",
                    fillOpacity: 0.0,
                    clickable: false,
                  });
                  bldgRecGeoms[i].setMap(map);
                  mapFeatures.push(bldgRecGeoms[i]);
                }
              }
            } else {
              if (wText !== "") wText += "\n<br>";
              wText += respKey + ": " + respVal;
            }
          }
          infoWindow = new google.maps.InfoWindow({
            position: latLng,
            content: wText,
          });
          infoWindow.open(map);
        }
      },
      function (errObj) {
        alert("REP Overlays error: " + errObj.message);
      }
    );
  });
}
google.maps.event.addDomListener(window, "load", initialize);
