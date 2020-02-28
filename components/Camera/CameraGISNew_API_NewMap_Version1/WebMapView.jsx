import React from 'react';
import { loadModules } from 'esri-loader';

import './styles/ViewMap.css';

export class WebMapView extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            map: null,
            updateCameraData: true
        }
        this.mapRef = React.createRef();
        // this.test = this.test.bind(this);
    }

    componentDidMount() {
        // const { cameraData } = this.props;
        // lazy load the required ArcGIS API for JavaScript modules and CSS

        loadModules(["esri/Map", "esri/views/MapView", "esri/widgets/Search"], { css: true })
            .then(([ArcGISMap, MapView, Search]) => {
                var searchWidget, view;
                var map = new ArcGISMap({
                    basemap: 'streets'
                });

                this.setState({
                    map: map
                });

                this.view = new MapView({
                    container: this.mapRef.current,
                    map: map,
                    zoom: 5,
                    center: [-122.18, 37.49] // longitude, latitude
                });

                view = this.view;

                searchWidget = new Search({
                    view: this.view,
                    resultGraphicEnabled: false,
                    popupEnabled: false
                });

                // Adds the search widget below other elements in
                // the top right corner of the view
                this.view.ui.add(searchWidget, {
                    position: "top-right",
                    index: 2
                });


                view.on("click", function (evt) {
                    var screenPoint = evt.screenPoint;
                    view.hitTest(screenPoint)
                        .then(function (response) {
                            // do something with the result graphic
                            var graphic = response.results[0].graphic;
                            console.log(graphic);
                        });
                });

                view.on("pointer-move", function (event) {
                    view.hitTest(event).then(function (response) {
                        // check if a feature is returned from the hurricanesLayer
                        // do something with the result graphic

                        if (response.results[0]) {
                            // console.log("21321sjdhaskjdhkjsa");
                        } else {
                            view.popup.close();
                        }

                        const graphic = response.results.filter(function (result) {
                            // return result.graphic.layer === hurricanesLayer;
                            view.popup.open({
                                // Set the popup's title to the coordinates of the location
                                title: "Ủy ban nhân dân huyện",
                                location: result.mapPoint // Set the location of the popup to the clicked location
                            });
                            // console.log(result);
                        })[0].graphic;
                    });
                });
            });
    }

    componentDidUpdate() {
        loadModules(["esri/layers/FeatureLayer"], { css: true })
            .then(([FeatureLayer]) => {
                var map = this.state.map;
                // create empty FeatureLayer
                const monumentLayer = new FeatureLayer({
                    // create an instance of esri/layers/support/Field for each field object
                    objectIdField: "ObjectID",
                    layerId: 98,
                    geometryType: "point",
                    spatialReference: { wkid: 4326 },
                    source: [], // adding an empty feature collection
                    renderer: {
                        type: "simple",
                        symbol: {
                            //   type: "web-style", // autocasts as new WebStyleSymbol()
                            //   styleName: "Esri2DPointSymbolsStyle",
                            //   name: "landmark"
                            type: "picture-marker",
                            url: "https://res.cloudinary.com/soict-hust/image/upload/v1576126440/VMS/Logo-BkavVMS-160x25_otzaur.png",
                            width: "26",
                            height: "26"
                        }
                    },
                    // popupTemplate: {
                    //     title: "{Name}"
                    // }
                });

                const monumentLayer2 = new FeatureLayer({
                    // create an instance of esri/layers/support/Field for each field object
                    objectIdField: "ObjectID",
                    layerId: 811,
                    geometryType: "point",
                    spatialReference: { wkid: 4326 },
                    source: [], // adding an empty feature collection
                    renderer: {
                        type: "simple",
                        symbol: {
                            //   type: "web-style", // autocasts as new WebStyleSymbol()
                            //   styleName: "Esri2DPointSymbolsStyle",
                            //   name: "landmark"
                            type: "picture-marker",
                            url: "https://res.cloudinary.com/soict-hust/image/upload/v1559702833/VMS/Console/Group_687_ktykhr.png",
                            width: "26",
                            height: "26"
                        }
                    },
                    // popupTemplate: {
                    //     title: "{Name}"
                    // }
                });


                var data = [];

                console.log(this.props.cameraData);
                console.log("rina ishiharaaaaaaaaaaaaaaaaaaaaa");

                if (this.props.cameraData) {
                    this.props.cameraData.map(camera => {
                        let objectCamera = {
                            NAME: camera.name,
                            LATITUDE: camera.latitude,
                            LONGITUDE: camera.longitude
                        }
                        data.push(objectCamera);
                    })
                }

                const data2 = [
                    {
                        NAME: "datngusi3",
                        LATITUDE: 20.93869,
                        LONGITUDE: 106.333816
                    },
                    {
                        NAME: "datngusi4",
                        LATITUDE: 20.93869,
                        LONGITUDE: 108.333816
                    }
                ];

                if (map) {
                    map.add(monumentLayer);
                    // map.add(monumentLayer2);
                    // console.log(data);
                    // console.log(data2);
                    // console.log("vlxxxxxxxxxxxxx");
                    this.addFeatures(monumentLayer, data);
                    // this.addFeatures(monumentLayer, data2);
                }
            })

    }

    componentWillUnmount() {
        if (this.view) {
            // destroy the map view
            this.view.container = null;
        }
    }

    addFeatures(monumentLayer, markerCamera) {

        if (markerCamera.length > 0) {
            markerCamera.map((camera) => {
                if (!camera.LATITUDE) {
                    let listCam = this.props.cameraData.filter(dataxx => dataxx.Name === camera.NAME);
                    console.log(listCam);
                    console.log("ngoccc trinhhh");
                }
            })
            // create an array of graphics based on the data above
            var graphics = [];
            var graphic;
            loadModules(["esri/Graphic"], { css: true }).then(([Graphic]) => {
                for (var i = 0; i < markerCamera.length; i++) {
                    if (markerCamera[i].LATITUDE) {
                        graphic = new Graphic({
                            geometry: {
                                type: "point",
                                latitude: markerCamera[i].LATITUDE,
                                longitude: markerCamera[i].LONGITUDE,
                            },
                            attributes: markerCamera[i],
                            layer: '1'
                        });
                        // console.log(graphic);
                        graphics.push(graphic);
                    }
                }
            });
        }

        // addEdits object tells applyEdits that you want to add the features
        const addEdits = {
            addFeatures: graphics
        };

        // apply the edits to the layer
        this.applyEditsToLayer(monumentLayer, addEdits);
    }

    applyEditsToLayer(typelayer, edits) {
        typelayer
            .applyEdits(edits)
            .then(function (results) {
                if (results.addFeatureResults.length > 0) {
                    var objectIds = [];
                    results.addFeatureResults.forEach(function (item) {
                        objectIds.push(item.objectId);
                    });

                    // query the newly added features from the layer
                    typelayer
                        .queryFeatures({
                            objectIds: objectIds
                        })
                        .then(function (results) {
                            console.log(
                                results.features.length,
                                "features have been added."
                            );
                        });
                }
            })
            .catch(function (error) {
                console.log(error);
            });
    }

    render() {
        return (
            <div className="webmap" style={{ height: '100%' }} ref={this.mapRef} />
        );
    }
}

export default WebMapView;