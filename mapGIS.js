require([
  "esri/map",
  "esri/InfoTemplate",
  "esri/layers/ArcGISTiledMapServiceLayer",
  "esri/geometry/Point",
  "esri/SpatialReference",
  "esri/tasks/query",
  "esri/tasks/QueryTask",
  "esri/symbols/SimpleLineSymbol",
  "esri/symbols/SimpleFillSymbol",
  "esri/Color",
  "dojo/domReady!",
], function (
  Map,
  InfoTemplate,
  ArcGISTiledMapServiceLayer,
  Point,
  SpatialReference,
  Query,
  QueryTask,
  SimpleLineSymbol,
  SimpleFillSymbol,
  Color
) {
  map = new Map("map", {
    center: new Point(
      -98.555183,
      39.80986,
      new SpatialReference({ wkid: 4326 })
    ),
    basemap: "streets",
    zoom: 5,
  });

  let client = "FXgevQoNSg";
  let tiled = new ArcGISTiledMapServiceLayer(
    "https://reportallusa.com/api/rest_services/client=" +
      client +
      "/Parcels/MapServer"
  );
  map.addLayer(tiled);

  // Cause click on map to show attribute popup and highlight parcel.
  map.on("load", initializeQuerying);

  function initializeQuerying() {
    let queryTask = new QueryTask(
      "https://reportallusa.com/api/rest_services/client=" +
        client +
        "/Parcels/MapServer/0"
    );

    // Build query filter.
    let query = new Query();
    query.returnGeometry = true;
    query.outSpatialReference = { wkid: 102100 };

    map.infoWindow.resize(275, 325);

    let currentClick = null;

    // Listen for map click event and launch point query task.
    map.on("click", function (evt) {
      map.graphics.clear();
      map.infoWindow.hide();
      query.spatialRelationship = Query.SPATIAL_REL_INTERSECTS;
      query.geometry = evt.mapPoint;
      currentClick = evt.mapPoint;
      queryTask.execute(query);
    });

    // Listen for QueryTask complete event.
    queryTask.on("complete", function (evt) {
      let features = evt.featureSet.features;
      let symbol = new SimpleFillSymbol(
        SimpleFillSymbol.STYLE_SOLID,
        new SimpleLineSymbol(
          SimpleFillSymbol.STYLE_SOLID,
          new Color([200, 0, 0]),
          2
        ),
        new Color([144, 238, 144, 0.6])
      );
      for (let i = 0; i < features.length; i++) {
        let graphic = features[i];
        graphic.setSymbol(symbol);
        map.graphics.add(graphic);
      }

      if (features.length) {
        let firstGraphic = evt.featureSet.features[0];
        let attrs = firstGraphic.attributes;
        map.infoWindow.setTitle(`Parcel ${attrs.parcel_id} in ${attrs.county_name} , ${attrs.state_abbr}` );
        let fieldAliases = evt.featureSet.fieldAliases;
        let content = "";
        for (let attr_name in attrs) {
          if (attrs.hasOwnProperty(attr_name)) {
            let fieldAlias = attr_name;
            if (fieldAliases.hasOwnProperty(attr_name)) {
              fieldAlias = fieldAliases[attr_name];
            }
            content +=
              "<div><b>" +
              fieldAlias +
              ": </b>" +
              attrs[attr_name] +
              "</div>\n";
          }
        }
        map.infoWindow.setContent(content);
        let currentClickScreen = map.toScreen(currentClick);
        map.infoWindow.show(
          currentClickScreen,
          map.getInfoWindowAnchor(currentClickScreen)
        );
      }
    });
  }
});
