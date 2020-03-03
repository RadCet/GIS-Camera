import React from "react";
import Widget from "@wso2-dashboards/widget";
import { TreeSelect, Button, Modal } from "antd";
import "antd/dist/antd.css";
import Fuse from "fuse.js";

import ListCameraComponent from "./ListCameraComponent";
import ListEventComponent from "./ListEventComponent";
import CameraStatusCounting from "./CameraStatusCounting";
import { renderInfoWindowContent } from "./InfoWindowTemplate";
import SearchBox from "./SearchBox";
import SearchBoxByName from "./SearchBoxByName";
import { isMobileBrowser, browser } from "./MobileCheck";

import { StatisData } from "./CameraStatusCounting";

import cameraIcon0 from "./resources/icons/statisicon/0.png";
import cameraIcon1 from "./resources/icons/statisicon/1.png";
import cameraIcon2 from "./resources/icons/statisicon/2.png";
import cameraIcon3 from "./resources/icons/statisicon/3.png";
import cameraIcon4 from "./resources/icons/statisicon/4.gif";
import cameraIcon5 from "./resources/icons/statisicon/5.png";
import cameraIcon6 from "./resources/icons/statisicon/6.png";
import loadingIcon from "./resources/icons/loading.gif";
import loadingIconLarge from "./resources/icons/loading_large.gif";
import connectingIconLarge from "./resources/icons/connecting_large.gif";
import disconnect from "./resources/icons/disconnect.png";
import disconnectLarge from "./resources/icons/disconnect_large.png";
import nextIcon from "./resources/icons/next.png";

import CameraVAController from "./controller/CameraVAController";
import CameraVMSController from "./controller/CameraVMSController";

import CameraTreeHelper from "./controller/CameraTreeHelper";
import CameraExportHelper from "./controller/CameraExportHelper";
import { TextHelper } from "./controller/TextHelper";

import "./styles/InfoWindow.css";
import "./styles/Modal.css";
import "./styles/ViewMap.css";

import { loadModules } from "esri-loader";

const { TreeNode } = TreeSelect;

let incidentMap = null;

// Danh sach luu cac marker dang duoc hien thi tren map
let markers = [];
let infoWindows = [];

const cameraIcons = [
  cameraIcon0,
  cameraIcon1,
  cameraIcon2,
  cameraIcon3,
  cameraIcon4,
  cameraIcon5,
  cameraIcon6
];

let imageMarker = [];
let dataCameraAI3 = [];
let dataCamerAI4 = [];
let dataCamerAI5 = [];
let dataCameraLevel0 = [];
let dataCameraLevel1 = [];
let dataCameraLevel2 = [];
let dataCamera = [
  dataCameraLevel0,
  dataCameraLevel1,
  dataCameraLevel2,
  dataCameraAI3,
  dataCamerAI4,
  dataCamerAI5
]; // include IDCAMERA,LAT,LONG,ObjectID
let listDisplayCamera = []; // same cameraData

export default class GeoChartCamera extends Widget {
  constructor(props) {
    super(props);

    this.state = {
      cameraData: [],
      eventDetectData: [],
      width: props.glContainer.width,
      height: props.glContainer.height,
      liveCamera: [],
      currentFilter: StatisData.ALL,
      currentClusterDataID: null,

      // popup
      videoEventTitle: "",
      videoEventSrc: "",
      videoEventDataType: "video",
      videoEventVisible: false,
      fetchError: false,

      // mobile
      isMobile: false,
      showPopupLiveCam: false,
      currentLayer: undefined,
      treeData: [],
      status: {
        isNeedUpdate: false
      },
      timeDataUpdate: null,
      timeElapse: "00:00",
      isLoadingData: true,
      map: null,
      view: null,
      updateCameraData: true,
      showLeftMenu: true
    };

    this.handleResize = this.handleResize.bind(this);
    this.closeVideoPopup = this.closeVideoPopup.bind(this);
    this.initVietBanDoMap = this.initVietBanDoMap.bind(this);
    this.handleLiveCameraClick = this.handleLiveCameraClick.bind(this);
    this.addLiveCamera = this.addLiveCamera.bind(this);
    this.handleClickCamera = this.handleClickCamera.bind(this);
    this.showInfoWindow = this.showInfoWindow.bind(this);
    this.showLiveCamOnMobile = this.showLiveCamOnMobile.bind(this);
    this.handleFilter = this.handleFilter.bind(this);
    this.handleRemoveLiveCam = this.handleRemoveLiveCam.bind(this);
    this.exportData = this.exportData.bind(this);
    this.handleFitBounds = this.handleFitBounds.bind(this);
    this.handleSelectSearch = this.handleSelectSearch.bind(this);
    this.handleCatchCameraClick = this.handleCatchCameraClick.bind(this);
    this.onChangeLayer = this.onChangeLayer.bind(this);
    this.resetMap = this.resetMap.bind(this);
    this.focusMap = this.focusMap.bind(this);

    this.updateAICameraHandler = this.updateAICameraHandler.bind(this);
    this.updateAIEventHandler = this.updateAIEventHandler.bind(this);
    this.updateCameraDataHandler = this.updateCameraDataHandler.bind(this);
    this.newTokenUpdateHandler = this.newTokenUpdateHandler.bind(this);
    this.getCameraDataByLayer = this.getCameraDataByLayer.bind(this);
    this.getZoomBySize = this.getZoomBySize.bind(this);
    this.filterByClusterIDHandler = this.filterByClusterIDHandler.bind(this);
    this.getTSearch = this.getTSearch.bind(this);
    this.handleReloadData = this.handleReloadData.bind(this);

    this.addFeatures = this.addFeatures.bind(this);
    this.removeFeatures = this.removeFeatures.bind(this);
    this.applyEditsToLayer = this.applyEditsToLayer.bind(this);
    this.setViewMap = this.setViewMap.bind(this);

    this.latCenter = 10.762622;
    this.lngCenter = 106.660172;
    this.zoomDefault = 11;
    this.northeastLat = 20.738033;
    this.northeastLng = 106.4671359;
    this.southwestLat = 21.648634;
    this.southwestLng = 108.0591179;

    //API, Server Config
    this.defaultSearch = "";
    this.mapRef = React.createRef();
  }

  componentDidMount() {
    const { id, widgetID } = this.props;
    super.getWidgetConfiguration(widgetID).then(message => {
      this.latCenter =
        message.data.configs.providerConfig.mapConfig.configs.latCenter;
      this.lngCenter =
        message.data.configs.providerConfig.mapConfig.configs.lngCenter;
      this.constlatCenter =
        message.data.configs.providerConfig.mapConfig.configs.latCenter;
      this.constlngCenter =
        message.data.configs.providerConfig.mapConfig.configs.lngCenter;
      this.zoomDefault =
        message.data.configs.providerConfig.mapConfig.configs.zoomDefault;
      this.northeastLat =
        message.data.configs.providerConfig.mapConfig.configs.northeastLat;
      this.northeastLng =
        message.data.configs.providerConfig.mapConfig.configs.northeastLng;
      this.southwestLat =
        message.data.configs.providerConfig.mapConfig.configs.southwestLat;
      this.southwestLng =
        message.data.configs.providerConfig.mapConfig.configs.southwestLng;
      this.defaultSearch = message.data.configs.providerConfig.mapConfig.configs
        .defaultSearch
        ? message.data.configs.providerConfig.mapConfig.configs.defaultSearch
        : "";

      this.minZoom =
        message.data.configs.providerConfig.mapConfig.configs.minZoom;
      this.maxZoom =
        message.data.configs.providerConfig.mapConfig.configs.maxZoom;
      this.autoZoomForSelectedGroup =
        message.data.configs.providerConfig.mapConfig.configs.autoZoomForSelectedGroup;
      this.zoomScaleValues =
        message.data.configs.providerConfig.mapConfig.configs.zoomScaleValues;
      if (this.minZoom == null) this.minZoom = 2;
      if (this.maxZoom == null) this.maxZoom = 19;
      if (this.zoomScaleValues == null || !Array.isArray(this.zoomScaleValues))
        this.zoomScaleValues = [];
      this.zoomScaleValues = this.zoomScaleValues
        .filter(item => !isNaN(item) && item >= 0)
        .sort((a, b) => a - b);
      this.zoomScaleWidthValues =
        message.data.configs.providerConfig.mapConfig.configs.zoomScaleWidthValues;
      this.zoomScaleHeightValues =
        message.data.configs.providerConfig.mapConfig.configs.zoomScaleHeightValues;
      if (
        this.zoomScaleWidthValues == null ||
        !Array.isArray(this.zoomScaleWidthValues) ||
        this.zoomScaleWidthValues.length === 0
      ) {
        this.zoomScaleWidthValues = this.zoomScaleValues;
      } else {
        this.zoomScaleWidthValues = this.zoomScaleWidthValues
          .filter(item => !isNaN(item) && item >= 0)
          .sort((a, b) => a - b);
      }
      if (
        this.zoomScaleHeightValues == null ||
        !Array.isArray(this.zoomScaleHeightValues) ||
        this.zoomScaleHeightValues.length === 0
      ) {
        this.zoomScaleHeightValues = this.zoomScaleValues;
      } else {
        this.zoomScaleHeightValues = this.zoomScaleHeightValues
          .filter(item => !isNaN(item) && item >= 0)
          .sort((a, b) => a - b);
      }
      if (this.autoZoomForSelectedGroup == null) {
        this.autoZoomForSelectedGroup = false;
      }

      this.apiConfig = message.data.configs.providerConfig.apiConfig;
      this.viewConfig = message.data.configs.providerConfig.viewConfig;
      if (this.viewConfig == null) {
        this.viewConfig = {
          treeConfig: {
            alwaysShowRootNode: false,
            ignoreGroupOnlyHaveOneChild: false,
            ignoreCameraNotInGroup: false,
            ignoreGroupInvalid: false,
            addCameraChildInTree: false
          }
        };
      }
      const {
        monitorsFieldSearch,
        va_support,
        socialization_support,
        showSocializationInNewTab,
        showVMSCountIgnoreDefault,
        showVMSCountInList,
        showVMSCountInListInTop,
        showVMSCountInListInBottom,
        showElapTime,
        showReload,
        hiddenExportInMobile
      } = this.apiConfig;
      this.va_support = va_support == null ? true : va_support;
      this.showSocializationInNewTab =
        showSocializationInNewTab == null ? true : showSocializationInNewTab;
      this.showVMSCountInList =
        showVMSCountInList == null ? true : showVMSCountInList;
      this.showVMSCountInListInTop =
        showVMSCountInListInTop == null ? true : showVMSCountInListInTop;
      this.showVMSCountInListInBottom =
        showVMSCountInListInBottom == null ? false : showVMSCountInListInBottom;
      this.socialization_support =
        socialization_support == null ? true : socialization_support;
      this.showVMSCountIgnoreDefault =
        showVMSCountIgnoreDefault == null ? false : showVMSCountIgnoreDefault;
      this.monitorsFieldSearch =
        monitorsFieldSearch == null ? ["name"] : monitorsFieldSearch;
      this.showElapTime = showElapTime == null ? false : showElapTime;
      this.showReload = showReload == null ? true : showReload;
      this.hiddenExportInMobile =
        hiddenExportInMobile == null ? true : hiddenExportInMobile;
      this.va_event_view = this.apiConfig.va_event_view;
      this.va_event_type_map = this.apiConfig.va_event_type_map;
      this.cameraVMSController = new CameraVMSController(
        this.apiConfig,
        this.updateCameraDataHandler,
        this.newTokenUpdateHandler
      );
      this.cameraVAController = new CameraVAController(
        this.apiConfig,
        this.cameraVMSController.vmsManager,
        this.updateAICameraHandler,
        this.updateAIEventHandler
      );
      // this.cameraCMSController = new CameraCMSController(this.apiConfig, this.updateCameraDataHandler, this.cameraVMSController);
      this.cameraVMSController.start();
      if (this.va_support) {
        this.cameraVAController.start();
      }
      this.timeElapseInterval = this.showElapTime
        ? setInterval(() => {
            let now = new Date();
            let elapse =
              (this.state.timeDataUpdate == null
                ? 0
                : now.getTime() - this.state.timeDataUpdate.getTime()) / 1000;
            let hour = Math.floor(elapse / 60);
            let second = Math.floor(elapse - 60 * hour);
            let timeElapse = `${hour < 10 ? "0" : ""}${hour}:${
              second < 10 ? "0" : ""
            }${second}`;
            this.setState({
              timeElapse: timeElapse
            });
          }, 1000)
        : null;
      this.initVietBanDoMap();
    });
    this.props.glContainer.on("resize", this.handleResize);
    console.log("________________v________________" + 170);

    loadModules(
      [
        "esri/Map",
        "esri/views/MapView",
        "esri/widgets/Search",
        "esri/layers/FeatureLayer",
        "esri/widgets/BasemapGallery"
      ],
      { css: true }
    ).then(([ArcGISMap, MapView, Search, FeatureLayer, BasemapGallery]) => {
      let searchWidget, view;
      let map = new ArcGISMap({
        basemap: "streets-navigation-vector"
      });

      this.setState({
        map: map
      });

      this.view = new MapView({
        container: this.mapRef.current,
        map: map,
        zoom: this.zoomDefault,
        center: [this.lngCenter, this.latCenter]
        // center: [-122.18, 37.49] // longitude, latitude
      });

      this.setState({
        view: this.view
      });

      view = this.view;

      // var basemapGallery = new BasemapGallery({
      //   view: view,
      //   source: {
      //     portal: {
      //       url: "http://www.arcgis.com",
      //       useVectorBasemaps: true // Load vector tile basemap group
      //     }
      //   }
      // });

      // view.ui.add(basemapGallery, "top-right"); // Add to the view

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

      searchWidget.watch("activeSource", function(evt) {
        evt.placeholder = "Tìm kiếm theo địa chỉ";
      });

      // create icon marker
      for (let i = 0; i < cameraIcons.length; i++) {
        const monumentLayer = new FeatureLayer({
          // create an instance of esri/layers/support/Field for each field object
          objectIdField: "ObjectID",
          layerId: i,
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
              url: cameraIcons[i],
              width: "26",
              height: "26"
            }
          }
          // popupTemplate: {
          //     title: "{Name}"
          // }
        });

        map.add(monumentLayer);
        imageMarker[i] = monumentLayer;
      }

      var that = this;

      view.on("click", function(evt) {
        var screenPoint = evt.screenPoint;
        view.hitTest(screenPoint).then(function(response) {
          // do something with the result graphic
          let graphic = response.results[0].graphic;

          let clickedMarker = dataCamera[graphic.layer.layerId].filter(
            marker => marker.ObjectID == graphic.attributes.ObjectID
          )[0];
          // console.log(clickedMarker);
          let marker = listDisplayCamera.filter(
            camera => camera.id == clickedMarker.IDCAMERA
          )[0];

          // console.log(marker);

          that.handleClickCamera(marker);
        });
      });

      view.on("pointer-move", function(event) {
        view.hitTest(event).then(function(response) {
          // check if a feature is returned from the hurricanesLayer
          // do something with the result graphic

          if (response.results[0].graphic.attributes.ObjectID) {
            // console.log(response.results[0].graphic.attributes.ObjectID);
            response.results.filter(function(result) {
              let graphicMarker = result.graphic;
              let clickedMarker = dataCamera[
                graphicMarker.layer.layerId
              ].filter(
                marker => marker.ObjectID == graphicMarker.attributes.ObjectID
              )[0];
              // console.log(clickedMarker);
              let marker = listDisplayCamera.filter(
                camera => camera.id == clickedMarker.IDCAMERA
              )[0];

              result.mapPoint.latitude = marker.latitude;
              result.mapPoint.longitude = marker.longitude;

              document.getElementById("arcgisMap").style.cursor = "pointer";

              view.popup.open({
                // Set the popup's title to the coordinates of the location
                title: marker.name,
                location: result.mapPoint, // Set the location of the popup to the clicked location
                // content: marker.address
                content:
                  "<div style='color: black'>" + marker.address + "</div>"
                // + "<div>ADs</div>"
              });
            });
          } else {
            document.getElementById("arcgisMap").style.cursor = "default";
            view.popup.close();
          }
        });
      });
    });
  }

  filterByClusterIDHandler(item, clusterDataID = null) {
    if (this.cameraVMSController.applyMultipleVMS) {
      return clusterDataID == null ? true : item.clusterDataID == clusterDataID;
    }
    return true;
  }

  updateAICameraHandler(aicameras, clusterDataID = null) {
    let methodTag = "updateAICameraHandler";
    const { cameraData, status } = this.state;
    let aicamIDs = [];
    console.log(`${methodTag}:${clusterDataID}`);
    let cameraDataInCluster = cameraData.filter(camera =>
      this.filterByClusterIDHandler(camera, clusterDataID)
    );
    aicameras.forEach(aicamera => {
      let camera = cameraDataInCluster.find(
        camera => camera.vmsCamId == aicamera.vmsCameraId
      );
      if (camera != null) {
        if (camera.ailevel !== 4 && camera.ailevel !== 5) {
          camera.ailevel = 3;
        }
        camera.aiStatus = 1;
        aicamIDs.push(camera.vmsCamId);
      }
    });
    status.isNeedUpdate = true;
    this.setState({
      cameraData: cameraData,
      status: status
    });
  }

  updateAIEventHandler(aievents, clusterDataID = null) {
    const {
      lastestEvent,
      newestAIcamerasHaveEvent,
      allAIcamerasHaveEvent
    } = aievents;
    const { cameraData, status, liveCamera } = this.state;
    let allCamIDs = [];

    let cameraDataInCluster = cameraData.filter(camera =>
      this.filterByClusterIDHandler(camera, clusterDataID)
    );

    allAIcamerasHaveEvent.forEach(vmsID => {
      let camera = cameraDataInCluster.find(camera => camera.vmsCamId == vmsID);
      if (!!camera) {
        camera.ailevel = 5;
        allCamIDs.push(vmsID);
      }
    });
    let newestCamIDs = [];
    newestAIcamerasHaveEvent.forEach(vmsID => {
      let camera = cameraDataInCluster.find(camera => camera.vmsCamId == vmsID);
      if (!!camera) {
        camera.ailevel = 4;
        newestCamIDs.push(vmsID);
      }
    });

    const eventDetectData = [];
    let cacheds = [];
    let cachedCam = [];
    let turn = new Date().getTime();
    lastestEvent.forEach(event => {
      let camID = cacheds.find((vmsID, index) => event.vmsCameraId == vmsID);
      let camera = cacheds.find(cam => event.vmsCameraId == cam.vmsCamId);
      if (camera == null) {
        camera = cameraDataInCluster.find(
          camera => camera.vmsCamId == event.vmsCameraId
        );
        if (camera != null) {
          camID = camera.vmsCamId;
          cacheds.push(camID);
          cachedCam.push(camera);
        }
      }
      if (camera == null) {
        return;
      }
      let new_event = {};
      new_event.id = event.id;
      new_event.vmsCamId = event.vmsCameraId;
      new_event.eventName = this.getEventName(event);
      new_event.eventType = this.getEventType(event); //event.type;
      new_event.startDate = new Date(event.createdAt).getTime() / 1000;
      new_event.endDate = new_event.startDate + event.duration;
      new_event.objectId = event.id;
      new_event.imagePath = event.id;
      new_event.XYWH = "";
      new_event.objectName = event.id;
      new_event.objectNote = event.id;
      new_event.level = event.level;

      new_event.type = new_event.eventName;
      new_event.from = new_event.startDate * 1000;
      new_event.clusterDataID = clusterDataID;
      eventDetectData.push(new_event);
      if (camera.eventTurn == null || camera.eventTurn != turn) {
        camera.events = [];
        camera.eventTurn = turn;
      }
      if (camera.events.length < 10) {
        //order.... save recently
        camera.events.push(new_event);
      }
    });
    eventDetectData.sort((e1, e2) => {
      return e2.startDate - e1.startDate;
    });
    let lives = [...liveCamera.map(c => c.vmsCamId)];
    eventDetectData.forEach(event => {
      if (lives.length === 3) return;
      if (lives.find(id => event.vmsCamId == id) == null) {
        this.addLiveCamera(event.vmsCamId, event.level, clusterDataID);
        lives.push(event.vmsCamId);
      }
    });
    status.isNeedUpdate = true;
    this.setState({
      status: status,
      eventDetectData: eventDetectData,
      cameraData: cameraData
    });
  }

  newTokenUpdateHandler(new_token) {
    // update api get data/live current
  }

  getTSearch(object, fields) {
    let tSearch = [];
    if (typeof object !== "object" || !Array.isArray(fields)) {
      return tSearch;
    }
    fields.forEach(field => {
      let value = object[field];
      if (typeof value === "string" && value.length > 0) {
        let valueNormaled = TextHelper.normalText(value);
        if (valueNormaled != null && valueNormaled.length > 0) {
          tSearch.push(valueNormaled);
        }
      } else if (Array.isArray(value)) {
        value
          .filter(item => typeof item === "string" && item.length > 0)
          .map(item => TextHelper.normalText(item))
          .filter(item => item != null && item.length > 0)
          .forEach(item => tSearch.push(item));
      }
    });
    return tSearch;
  }

  updateCameraDataHandler(datas) {
    const cameraData = [];
    let isFirst =
      this.state.cameraData == null || this.state.cameraData.length === 0;
    let minLat = null;
    let maxLat = null;
    let minLng = null;
    let maxLng = null;
    let nodeHandler = (monitor, node, parentNode) => {
      parentNode.numberAll++;
      let level =
        monitor.Enabled == 1
          ? "Connected" === monitor.Status
            ? 1
            : 0
          : "Connected" === monitor.LastStatusBKA
          ? 2
          : 0; //"Connected" === monitor.Status ? monitor.Enabled == 1 ? 1 : 2 : 0;
      if (level > 0) {
        parentNode.numberLive++;
      }
      if (monitor.cameraData != null) {
        let camera = monitor.cameraData;
        camera.values.push(node.value);
        camera.svalues.push(node.svalue);
        if (
          this.monitorsFieldSearch.indexOf("values") >= 0 ||
          this.monitorsFieldSearch.indexOf("svalues") >= 0
        ) {
          camera.tSearch = this.getTSearch(camera, this.monitorsFieldSearch);
        }
        return camera;
      }
      const camera = {
        id: monitor.Id,
        vmsCamId: monitor.Id,
        name: monitor.Name,
        displayName: monitor.DisplayNameBKA,
        address: parentNode.name,
        longitude: parseFloat(monitor.Longitude),
        latitude: parseFloat(monitor.Latitude),
        url: monitor.Liveview,
        username: monitor.User,
        password: monitor.Pass,
        lastIncidentTime: 0,
        events: null,
        cameraType: 0,
        broke: 0,
        cameraStatus: monitor.Status,
        functionStatus: monitor.Enabled,
        aiStatus: 0,
        status: monitor.Enabled,
        layer: monitor.Name,
        Liveview: monitor.Liveview,
        Snapshot: monitor.Snapshot,
        LastStatusBKA: monitor.LastStatusBKA,
        clusterDataID: monitor.clusterDataID,
        cameraCategory: monitor.CameraCategoryKA,
        isSocialization: monitor.CameraCategoryKA == 2,
        numberChilds: parseInt(monitor.NumberCameraManagedKA),
        description: monitor.Description
      };
      if (camera.displayName != null && camera.displayName.length > 0) {
        camera.name = camera.displayName;
      }
      if (camera.address == null || camera.address.length === 0) {
        camera.address = camera.name;
      }
      let lng = camera.longitude; //parseFloat(camera.longitude);
      let lat = camera.latitude; //parseFloat(camera.latitude);
      if (!isNaN(lng)) {
        if (minLng == null || minLng > lng) {
          minLng = lng;
        }
        if (maxLng == null || maxLng < lng) {
          maxLng = lng;
        }
      }
      if (!isNaN(lat)) {
        if (minLat == null || minLat > lat) {
          minLat = lat;
        }
        if (maxLat == null || maxLat < lat) {
          maxLat = lat;
        }
      }
      camera.level = level;
      camera.values = [node.value];
      camera.svalues = [node.svalue];
      if (camera.isSocialization && this.socialization_support) {
        camera.level = 6;
        camera.glevel = 6;
      }
      camera.tSearch = this.getTSearch(camera, this.monitorsFieldSearch);
      monitor.cameraData = camera;
      cameraData.push(camera);
      return camera;
    };
    const {
      alwaysShowRootNode,
      ignoreGroupOnlyHaveOneChild,
      ignoreCameraNotInGroup,
      addCameraChildInTree,
      ignoreGroupInvalid
    } = this.viewConfig.treeConfig;
    let tree = CameraTreeHelper.updateTreeData(
      datas,
      ignoreGroupInvalid,
      ignoreCameraNotInGroup
    );
    let root = CameraTreeHelper.buildUITreeData(
      tree,
      null,
      addCameraChildInTree,
      nodeHandler
    );
    // Mock social camera.
    // for (let index = 0; index < cameraData.length / 3; index++) {
    //     const cameraSocial = cameraData[index];
    //     cameraSocial.isSocialization = true;
    //     cameraSocial.glevel = 6;
    //     cameraSocial.level = 6;
    //     cameraSocial.numberChilds = index + 2;
    //     cameraSocial.url = `https://web.vcam.viettel.vn?index=${index}`;
    //     cameraSocial.username = `q12_tx_${index}`;
    //     cameraSocial.password = `admin@123_${index}`;
    // }

    let treeData = root.children;
    if (!alwaysShowRootNode && treeData.length === 1) {
      do {
        treeData = treeData[0].children;
      } while (ignoreGroupOnlyHaveOneChild && treeData.length === 1);
    }
    if (minLat != null && maxLat != null)
      this.latCenter = (minLat + maxLat) / 2;
    if (minLng != null && maxLng != null)
      this.lngCenter = (minLng + maxLng) / 2;
    if (minLat != null) this.southwestLat = minLat;
    if (maxLat != null) this.northeastLat = maxLat;
    if (minLng != null) this.southwestLng = minLng;
    if (maxLng != null) this.northeastLng = maxLng;
    let deltaLat = Math.abs(this.northeastLat - this.southwestLat);
    let deltaLng = Math.abs(this.northeastLng - this.southwestLng);
    // TODO update zoomDefault (number cam || rectange)
    console.log(
      `[lat(${minLat}-${maxLat}):lng(${minLng}-${maxLng})][center(${
        this.latCenter
      },${this.lngCenter})][south(${this.southwestLat},${
        this.southwestLng
      })][north(${this.northeastLat},${
        this.northeastLng
      })][delta(${deltaLat},${deltaLng}---${Math.max(deltaLat, deltaLng)}]})]`
    );
    this.zoomDefault = this.getZoomBySize(deltaLng, deltaLat);
    if (isFirst) {
      this.resetMap();
    }
    // this.handleFitBounds(this.southwestLat, this.southwestLng, this.northeastLat, this.northeastLng);
    // TODO update defaultSearch
    const { status } = this.state;
    status.isNeedUpdate = true;
    this.setState({
      cameraData: cameraData,
      treeData: treeData,
      cameraDataByLayer: null,
      status: status,
      timeDataUpdate: new Date(),
      isLoadingData: false
    });
    if (this.va_support) {
      Promise.all([
        this.cameraVAController.loadAICameras(),
        this.cameraVAController.loadEvents()
      ]);
    }
  }

  getZoomBySize(width, height) {
    // TODO udate zoom with size, resolutive, screen size...
    if (width == null || width < 0 || height == null || height < 0)
      return this.zoomDefault;
    let delta = Math.max(width, height);
    let zoomWidth =
      this.zoomScaleWidthValues == null ||
      this.zoomScaleWidthValues.length === 0
        ? this.zoomDefault
        : this.maxZoom + 1;
    let isContainWidth = false;
    for (let index = 0; index < this.zoomScaleWidthValues.length; index++) {
      if (delta <= this.zoomScaleWidthValues[index]) {
        zoomWidth -= index;
        isContainWidth = true;
        break;
      }
    }
    zoomWidth = isContainWidth ? zoomWidth : this.zoomDefault;
    let zoomHeight =
      this.zoomScaleHeightValues == null ||
      this.zoomScaleHeightValues.length === 0
        ? this.zoomDefault
        : this.maxZoom + 1;
    let isContainHeight = false;
    for (let index = 0; index < this.zoomScaleHeightValues.length; index++) {
      if (delta <= this.zoomScaleHeightValues[index]) {
        zoomHeight -= index;
        isContainHeight = true;
        break;
      }
    }
    zoomHeight = isContainHeight ? zoomHeight : this.zoomDefault;
    let zoom = Math.min(zoomWidth, zoomHeight);
    if (zoom < this.minZoom) {
      zoom = this.minZoom;
    }
    if (zoom > this.maxZoom) {
      zoom = this.maxZoom;
    }
    console.log(
      `${this.zoomScaleWidthValues}|${this.zoomScaleHeightValues}|${this.zoomDefault}[${width},${height}]-->[${zoomWidth},${zoomHeight},${zoom}]`
    );
    return zoom;
  }

  getEventType(event) {
    let type = event.type;
    if (this.va_event_type_map == null) {
      this.va_event_type_map = {
        default: 1,
        fire: 4,
        access: 2,
        face: 2,
        motion: 1, // administration:1
        violence: 6
      };
    }
    let _type = this.va_event_type_map[type];
    if (_type == null) {
      _type = this.va_event_type_map.default;
    }
    if (_type == null || _type <= 0 || _type > 6) {
      _type = 1;
    }
    return _type;
  }

  getEventName(event) {
    let type = event.type;
    if (this.va_event_view == null) {
      this.va_event_view = {
        default: "Có sự kiện",
        fire: "Cháy nổ",
        access: "Xâm nhập",
        face: "Nhận diện",
        motion: "Chuyển động",
        administration: "Hành chính công",
        violence: "Bạo lực"
      };
    }
    let _name = this.va_event_view[type];
    if (_name == null) {
      _name = this.va_event_view.default;
    }
    if (_name == null || _name.length === 0) {
      _name = "Có sự kiện";
    }
    return _name;
  }

  componentWillMount() {
    this.handleResize();
  }

  componentDidUpdate(prevProps, prevState) {
    // if (
    //   prevState.cameraData != this.state.cameraData ||
    //   prevState.eventDetectData != this.state.eventDetectData ||
    //   prevState.currentFilter != this.state.currentFilter ||
    //   prevState.treeData != this.state.treeData ||
    //   prevState.map != this.state.map ||
    //   prevState.view != this.state.view ||
    //   prevState.cameraDataByLayer != this.state.cameraDataByLayer ||
    //   prevState.updateCameraData != this.state.updateCameraData
    // ) {

    // }
    // console.log(this.state);

    if(prevState.liveCamera == this.state.liveCamera){
      this.addMarkerToMap();
    }

    const prevLayer = prevState.currentLayer;
    if (prevLayer != this.state.currentLayer) {
      this.onChangeLayer(this.state.currentLayer);
    }
  }

  componentWillUnmount() {
    this.cameraVAController.stop();
    this.cameraVMSController.stop();
    clearInterval(this.timeElapseInterval);
    window.stop();

    if (this.view) {
      // destroy the map view
      this.view.container = null;
    }
  }

  // Khoi tao ban do
  initVietBanDoMap() {
    var mapContainer = document.getElementById("vbdContainer");
    const centerDefault = new vbd.LatLng(this.latCenter, this.lngCenter);
    // const sw = new vbd.LatLng(this.southwestLat, this.southwestLng);
    // const ne = new vbd.LatLng(this.northeastLat, this.northeastLng);
    var mapProp = {
      center: centerDefault,
      zoom: this.zoomDefault,
      zoomControl: false,
      minZoom: this.minZoom
      // limitBounds: new vbd.latLngBounds(sw, ne)
    };
    incidentMap = new vbd.Map(mapContainer, mapProp);

    //Khi click vào bản đồ, bỏ focus các ô text, xóa hết các infoWindow
    vbd.event.addListener(incidentMap, "click", function(param) {
      $("input#searchByName").blur();
      $("input#searchByMaps").blur();
      if (infoWindows) {
        infoWindows.map(iw => {
          iw.close();
        });
      }
    });
  }

  handleResize() {
    const { glContainer } = this.props;
    let isMobile = isMobileBrowser();

    // if (glContainer.width > glContainer.height || glContainer.width > 500)
    //     isMobile = false;

    // if (!isMobile) {
    glContainer.height = $(window).height() - 65;
    glContainer.width = $(window).width();
    // }

    // Nếu màn hình có chiều rộng nhỏ hơn chiều cao hoặc chiều rộng bé hơn 1000 thì hiển thị popup live came thay vì 3 cam bên dưới
    let showPopupLiveCam =
      glContainer.width < glContainer.height || glContainer.width < 1000;

    this.setState({
      width: glContainer.width,
      height: glContainer.height,
      isMobile: isMobile,
      showPopupLiveCam: showPopupLiveCam
    });
  }

  handleClickCamera(camera) {
    if (camera.level === 0) {
      alert("Camera không hoạt động");
    } else {
      //if (camera.level == 1 || camera.level == 2 || camera.level == 3 || camera.level == 4 || camera.level == 5) {
      if (camera.glevel == 6) {
        if (this.showSocializationInNewTab) {
          window.open(camera.url, "_blank");
        } else {
          this.showLiveCamOnMobile(camera.vmsCamId, camera.clusterDataID);
        }
      } else if (this.state.isMobile || this.state.showPopupLiveCam) {
        // || camera.glevel == 6) {
        this.showLiveCamOnMobile(camera.vmsCamId, camera.clusterDataID);
      } else {
        this.addLiveCamera(camera.vmsCamId, camera.level, camera.clusterDataID);
      }
    }
  }

  addLiveCamera(vmsCamId, level, clusterDataID = null) {
    this.setState(prevState => {
      return {
        liveCamera:
          prevState.liveCamera.find(
            item =>
              item.vmsCamId == vmsCamId &&
              this.filterByClusterIDHandler(item, clusterDataID)
          ) != null
            ? prevState.liveCamera
            : prevState.liveCamera.length === 3
            ? prevState.liveCamera
                .slice(1, prevState.liveCamera.length)
                .concat({ vmsCamId, level, clusterDataID })
            : prevState.liveCamera.concat({ vmsCamId, level, clusterDataID })
      };
    });
  }

  showInfoWindow(camera) {
    // Xóa hết các infowindow khác
    if (infoWindows) {
      infoWindows.map(iw => {
        iw.close();
      });
    }

    const markerLatLng = new vbd.LatLng(camera.latitude, camera.longitude);
    const markerIcon =
      camera.ailevel != null
        ? cameraIcons[camera.ailevel]
        : cameraIcons[camera.level];
    const vIcon = new vbd.Icon({
      url: markerIcon,
      size: new vbd.Size(32, 32)
    });
    const vMarker = new vbd.Marker({
      position: markerLatLng,
      icon: vIcon
    });
    vMarker.setMap(incidentMap);

    var contentShow = renderInfoWindowContent({
      id: camera.id,
      vmsCamId: camera.vmsCamId,
      title: camera.name,
      address: camera.address,
      description: camera.name,
      events: camera.events,
      username: camera.username,
      password: camera.password,
      numberChilds: camera.numberChilds
    });

    var vbdInfowindow = new vbd.InfoWindow({ content: contentShow });
    vbdInfowindow.open(incidentMap, vMarker);
    infoWindows.push(vbdInfowindow);
    setTimeout(() => {
      incidentMap.removeMarker(vMarker);
    }, 1000);
  }

  showLiveCamOnMobile(vmsCamId, clusterDataID = null) {
    const liveCameraData = this.state.cameraData.find(
      cam =>
        cam.vmsCamId === vmsCamId &&
        this.filterByClusterIDHandler(cam, clusterDataID)
    );
    if (liveCameraData) {
      let liveCamSrc = liveCameraData.Liveview; // resp.data.monitor.mjpeg;
      if (liveCameraData.glevel === 6) {
        liveCamSrc = `${liveCameraData.url}${
          liveCameraData.url.indexOf("?") > 0 ? "&" : "?"
        }`;
        if (liveCamSrc.indexOf("username=") < 0) {
          liveCamSrc = `${liveCamSrc}${
            liveCamSrc.indexOf("?") > 0 ? "&" : "?"
          }username=${liveCameraData.username}`;
        }
        if (liveCamSrc.indexOf("password=") < 0) {
          liveCamSrc = `${liveCamSrc}${
            liveCamSrc.indexOf("?") > 0 ? "&" : "?"
          }password=${liveCameraData.password}`;
        }
      }
      if (liveCameraData.level === 2 && liveCameraData.glevel !== 6) {
        this.cameraVMSController
          .turnOnCameraToVMS(
            liveCameraData.clusterDataID,
            liveCameraData.vmsCamId
          )
          .then(resp => {})
          .catch(error => {})
          .then(() => {
            this.setState({
              videoEventSrc: loadingIconLarge,
              videoEventTitle: liveCameraData.name,
              videoEventDataType: "image",
              videoEventVisible: true
            });
            setTimeout(() => {
              if (this.state.videoEventVisible) {
                this.setState({
                  videoEventSrc: liveCamSrc
                });
              }
            }, 5000);
          });
      } else {
        this.setState({
          videoEventSrc: liveCamSrc,
          videoEventTitle: liveCameraData.name,
          videoEventDataType: liveCameraData.glevel === 6 ? "frame" : "image",
          videoEventVisible: true
        });
      }
    }
  }

  getCameraDataByLayer(layer) {
    let cameraData = this.state.cameraData;
    if (cameraData == null) return [];
    if (typeof layer == "undefined") return cameraData;
    return cameraData.filter(item => {
      return item.values.find(item => item.startsWith(layer)) != null;
    });
  }

  addMarkerToMap() {
    //reset data before update
    for (let index = 0; index < dataCamera.length; index++) {
      dataCamera[index] = [];
    }

    let displayCamera = this.getCameraDataByLayer(this.state.currentLayer);
    listDisplayCamera = displayCamera;

    let cameraDataByLayer = this.state.cameraDataByLayer;
    if (!cameraDataByLayer) {
      cameraDataByLayer = this.getCameraDataByLayer(this.state.currentLayer);
      this.setState({
        cameraDataByLayer: cameraDataByLayer
      });
    }
    displayCamera = cameraDataByLayer; //this.getCameraDataByLayer(this.state.currentLayer);

    // Add cac marker vao map va khoi tao su kien cho marker
    const { currentFilter, currentClusterDataID } = this.state;
    displayCamera = displayCamera.filter(item => {
      return (
        this.filterByClusterIDHandler(item, currentClusterDataID) &&
        (currentFilter == StatisData.ALL ||
          (currentFilter == StatisData.UNBROKEN &&
            (item.level === 1 || item.level === 2)) ||
          (currentFilter == StatisData.ACTIVE && item.level === 1) ||
          (currentFilter == StatisData.UNACTIVE && item.level === 2) ||
          (currentFilter == StatisData.BROKEN && item.level === 0) ||
          (currentFilter == StatisData.AI &&
            (item.ailevel === 3 || item.ailevel === 4 || item.ailevel === 5)) ||
          (currentFilter == StatisData.EVENT5P && item.ailevel === 4) ||
          (currentFilter == StatisData.EVENT24H &&
            (item.ailevel === 5 || item.ailevel === 4)) ||
          (currentFilter == StatisData.SOCIAL && item.glevel === 6))
      );
    });

    displayCamera.map(camera => {
      if (camera.latitude && camera.longitude) {
        let objectCamera = {
          IDCAMERA: camera.id,
          NAME: camera.name,
          LATITUDE: camera.latitude,
          LONGITUDE: camera.longitude
        };

        if (camera.ailevel != null) {
          dataCamera[camera.ailevel].push(objectCamera);
        } else {
          dataCamera[camera.level].push(objectCamera);
        }
      }
    });

    // delete marker before adding
    for (let i = 0; i < imageMarker.length; i++) {
      this.removeFeatures(imageMarker[i]);
    }

    if (this.state.map) {
      for (let i = 0; i < dataCamera.length; i++) {
        if (imageMarker[i] && dataCamera[i].length > 0) {
          this.addFeatures(imageMarker[i], dataCamera[i]);
        }
      }
    } else {
      setTimeout(() => {
        if (this.state.map) {
          for (let i = 0; i < dataCamera.length; i++) {
            if (imageMarker[i] && dataCamera[i].length > 0) {
              this.addFeatures(imageMarker[i], dataCamera[i]);
            }
          }
        }
      }, 5000);
    }
  }

  handleFilter(newFilter, newClusterDataID) {
    let { currentFilter, currentClusterDataID } = this.state;
    if (currentFilter == newFilter) {
      currentFilter = StatisData.ALL;
    } else {
      currentFilter = newFilter;
    }
    if (currentClusterDataID == newClusterDataID) {
      currentClusterDataID = null;
    } else {
      currentClusterDataID = newClusterDataID;
    }
    this.setState({
      currentFilter: currentFilter,
      currentClusterDataID: currentClusterDataID
    });
  }

  handleCatchCameraClick(eventFrom, title, event) {
    let isSupportVideo = browser() !== "safari";
    let apiUrl = isSupportVideo
      ? this.cameraVAController.getEventVideoLink(event.id)
      : this.cameraVAController.getEventImageLink(event.id);
    this.setState({
      videoEventSrc: apiUrl,
      videoEventTitle: title,
      videoEventDataType: isSupportVideo ? "video" : "image",
      videoEventVisible: true
    });
  }

  handleLiveCameraClick(videoEventSrc, title) {
    if (this.videoEventSrc != videoEventSrc) {
      this.setState({
        videoEventSrc: loadingIconLarge,
        videoEventTitle: title,
        videoEventDataType: "image",
        videoEventVisible: true
      });
      setTimeout(() => this.setState({ videoEventSrc: videoEventSrc }), 100);
    }
  }

  handleFitBounds(s, w, n, e) {
    if (incidentMap) {
      console.log("handleFitBounds:" + s);
      const sw = new vbd.LatLng(s, w);
      const ne = new vbd.LatLng(n, e);
      incidentMap.zoomFitEx([sw, ne]);
    }
  }

  resetMap() {
    if (incidentMap) {
      console.log(
        `resetMap:${this.latCenter}:${this.lngCenter}:${this.zoomDefault}`
      );
      const centerDefault = new vbd.LatLng(this.latCenter, this.lngCenter);
      incidentMap.setZoom(this.zoomDefault);
      incidentMap.setCenter(centerDefault);
    }

    if (this.state.view) {
      this.state.view.center = [this.lngCenter, this.latCenter];
      this.state.view.zoom = this.zoomDefault;
    }
  }

  focusMap(camera) {
    if (!incidentMap) return;
    console.log(
      `focusMap:${this.latCenter}:${this.lngCenter}:${this.zoomDefault}`
    );
    let latCenter = this.latCenter;
    let lngCenter = this.lngCenter;
    let zoom = 13;
    if (Array.isArray(camera)) {
      if (camera.length == 0) {
        return;
      }
      latCenter = camera[0].latitude;
      lngCenter = camera[0].longitude;
      if (this.autoZoomForSelectedGroup) {
        let minLat = null;
        let maxLat = null;
        let minLng = null;
        let maxLng = null;
        camera.forEach(cam => {
          const lng = cam.longitude;
          const lat = cam.latitude;
          if (!isNaN(lng)) {
            if (minLng == null || minLng > lng) {
              minLng = lng;
            }
            if (maxLng == null || maxLng < lng) {
              maxLng = lng;
            }
          }
          if (!isNaN(lat)) {
            if (minLat == null || minLat > lat) {
              minLat = lat;
            }
            if (maxLat == null || maxLat < lat) {
              maxLat = lat;
            }
          }
        });
        if (
          minLat != null &&
          maxLat != null &&
          minLng != null &&
          maxLng != null
        ) {
          latCenter = (minLat + maxLat) / 2;
          lngCenter = (minLng + maxLng) / 2;
          let deltaLat = Math.abs(maxLat - minLat);
          let deltaLng = Math.abs(maxLng - minLng);
          zoom = this.getZoomBySize(deltaLng, deltaLat);
        }
      }
    } else {
      latCenter = camera.latitude;
      lngCenter = camera.longitude;
    }

    if (this.state.view) {
      this.state.view.center = [lngCenter, latCenter];
      this.state.view.zoom = zoom;
    }

    const centerDefault = new vbd.LatLng(latCenter, lngCenter);
    // if (incidentMap.getZoom()  < zoom) {
    incidentMap.setZoom(zoom);
    // }
    incidentMap.setCenter(centerDefault);
  }

  handleSelectSearch(camera) {
    if (typeof camera != "undefined") {
      // Zoom bản đồ vào vị trí cam
      if (incidentMap) {
        const center = new vbd.LatLng(camera.latitude, camera.longitude);
        if (incidentMap.getZoom() < 18) {
          incidentMap.setZoom(18);
        }
        incidentMap.setCenter(center);
      }

      this.showInfoWindow(camera);
      this.handleClickCamera(camera);
    } else {
      this.onChangeLayer(this.state.currentLayer);
    }
    // TODO filter not contain current camera.
  }

  closeVideoPopup() {
    setTimeout(
      () =>
        this.setState({
          videoEventVisible: false,
          videoEventSrc: loadingIconLarge
        }),
      200
    );
  }

  handleRemoveLiveCam(camId, clusterDataID = null) {
    const liveCam = this.state.liveCamera;
    this.setState({
      liveCamera: liveCam.filter(
        item =>
          item.vmsCamId != camId &&
          this.filterByClusterIDHandler(item, clusterDataID)
      )
    });
  }

  onChangeLayer(layer) {
    let cameraDataByLayer;
    if (layer && layer.length > 0) {
      cameraDataByLayer = this.getCameraDataByLayer(layer);
      if (cameraDataByLayer.length > 0) this.focusMap(cameraDataByLayer);
    } else {
      cameraDataByLayer = this.getCameraDataByLayer(undefined);
      this.resetMap();
    }

    if (this.state.currentLayer != layer) {
      this.setState({
        currentLayer: layer,
        cameraDataByLayer: cameraDataByLayer
      });
    }
  }

  exportData() {
    const { currentLayer, cameraData, treeData } = this.state;

    CameraExportHelper.exportData(currentLayer, cameraData, treeData);
  }

  handleReloadData(target) {
    this.cameraVMSController.loadCameras();
    this.setState({
      isLoadingData: true
    });
  }

  setViewMap(camera) {
    //focus map
    if (this.state.view) {
      this.state.view.center = [camera.LONGITUDE, camera.LATITUDE];
      this.state.view.zoom = 13;
    }
  }

  applyEditsToLayer(typelayer, edits) {
    typelayer
      .applyEdits(edits)
      .then(function(results) {
        //delete marker
        if (results.deleteFeatureResults.length > 0) {
          // console.log(
          //     results.deleteFeatureResults.length,
          //     "features have been removed"
          // );
        }

        //apply add marker
        if (results.addFeatureResults.length > 0) {
          var objectIds = [];
          results.addFeatureResults.forEach(function(item) {
            objectIds.push(item.objectId);
          });

          // query the newly added features from the layer
          typelayer
            .queryFeatures({
              objectIds: objectIds
            })
            .then(function(results) {
              // console.log(
              //     results.features.length,
              //     "features have been added."
              // );
            });
        }
      })
      .catch(function(error) {
        console.log(error);
      });
  }

  addFeatures(monumentLayer, markerCamera) {
    if (markerCamera.length > 0) {
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
                longitude: markerCamera[i].LONGITUDE
              },
              attributes: markerCamera[i]
            });
            graphics.push(graphic);
          }
        }
      });

      // addEdits object tells applyEdits that you want to add the features
      const addEdits = {
        addFeatures: graphics
      };

      // apply the edits to the layer
      this.applyEditsToLayer(monumentLayer, addEdits);
      // this.setViewMap(markerCamera[0]);
    }
  }

  removeFeatures(monumentLayer) {
    // if (markerCamera.length > 0) {
    if (monumentLayer) {
      let deleteEdits;
      // query for the features you want to remove
      monumentLayer.queryFeatures().then(function(results) {
        // edits object tells apply edits that you want to delete the features
        deleteEdits = {
          deleteFeatures: results.features
        };

        monumentLayer
          .applyEdits(deleteEdits)
          .then(function(results) {
            if (results.deleteFeatureResults.length > 0) {
            }
          })
          .catch(function(error) {
            // console.log(error);
          });
      });
    }
  }

  render() {
    const {
      currentFilter,
      currentClusterDataID,
      videoEventVisible,
      videoEventDataType,
      videoEventTitle,
      videoEventSrc,
      liveCamera,
      cameraData,
      eventDetectData,
      isMobile,
      width,
      height,
      currentLayer,
      treeData,
      status,
      timeElapse,
      isLoadingData
    } = this.state;
    let showLeftMenu = this.state.showLeftMenu;
    let cameraDataByLayer = this.state.cameraDataByLayer;
    if (!cameraDataByLayer) {
      cameraDataByLayer = this.getCameraDataByLayer(currentLayer);
      console.log(
        `cameraDataByLayer:${currentLayer}:${cameraDataByLayer.length}`
      );
    }
    const vbdStyle =
      !isMobile && liveCamera.length > 0
        ? { height: "75%", width: "100%" }
        : { height: "100%", width: "100%" };
    const leftSide = !isMobile
      ? {
          height: "100%",
          width: width * 0.25,
          minWidth: 285,
          display: "block",
          float: "left",
          borderLeft: "1px solid #13222a",
          paddingLeft: "10px",
          overflowY: "auto"
        }
      : { height: width, width: "100%" };

    const leftSideHidden = !isMobile
      ? {
          height: "100%",
          width: 0,
          display: "none",
          minWidth: 285,
          float: "left",
          borderLeft: "1px solid #13222a",
          paddingLeft: "10px",
          overflowY: "auto"
        }
      : { height: width, width: "0" };

    const rightSide = !isMobile
      ? {
          height: "100%",
          width: width * 0.75,
          maxWidth: this.props.glContainer.width - 285,
          float: "right"
        }
      : { height: "80%", width: "100%" };

    const rightSideFullWidth = !isMobile
      ? {
          height: "100%",
          width: width,
          maxWidth: this.props.glContainer.width,
          float: "right"
        }
      : { height: "80%", width: "100%" };

    const style = isMobile
      ? {
          width: width,
          height: height,
          position: "relative",
          top: 0
        }
      : {
          width: width,
          height: height,
          position: "relative",
          top: 0
        };

    const styleSearchBox = isMobile
      ? {
          position: "absolute",
          top: 0,
          right: 252,
          zIndex: 100,
          color: "black"
        }
      : {
          position: "absolute",
          top: 0,
          right: 252,
          zIndex: 100,
          color: "black"
        };

    const showIconNext = showLeftMenu
      ? {
          width: "50px",
          position: "absolute",
          marginLeft: width * 0.25 - 24,
          marginTop: height * 0.5
        }
      : {
          width: "50px",
          position: "absolute",
          marginLeft: "-25px",
          marginTop: height * 0.5
        };

    return (
      <div style={style}>
        {
          <div
            id={"rightSide"}
            style={showLeftMenu ? rightSide : rightSideFullWidth}
          >
            <div style={styleSearchBox}>
              <Button
                icon="home"
                style={{
                  marginRight: "4px",
                  marginLeft: "2px",
                  marginTop: "15px"
                }}
                onClick={this.resetMap}
              ></Button>
            </div>
            <div id={"vbdContainer"} style={{ display: "none" }} />
            <div
              id={"arcgisMap"}
              className="webmap"
              style={vbdStyle}
              ref={this.mapRef}
            />

            {!this.state.isMobile && liveCamera.length > 0 && (
              <div
                id={"liveCamera"}
                style={{
                  height: "25%",
                  width: "100%",
                  borderTop: "1px solid #081922"
                }}
              >
                <ListCameraComponent
                  width={rightSide.width / liveCamera.length - 8}
                  liveCamera={liveCamera}
                  cameraData={cameraData}
                  height={(this.props.glContainer.height * 25) / 100}
                  handleLiveCameraClick={this.handleLiveCameraClick}
                  handleRemoveLiveCam={this.handleRemoveLiveCam}
                  cameraVMSController={this.cameraVMSController}
                  filterByClusterIDHandler={this.filterByClusterIDHandler}
                />
              </div>
            )}
          </div>
        }
        {
          <img
            src={nextIcon}
            // style={!isMobile ? showIconNext : { display: "none" }}
            style={{ display: "none" }}
            onClick={() => {
              this.setState({
                showLeftMenu: !showLeftMenu
              });
            }}
          />
        }
        {
          <div id={"leftSide"} style={showLeftMenu ? leftSide : leftSideHidden}>
            <div>
              <div style={{ paddingTop: "10px" }}>
                <TreeSelect
                  showSearch
                  style={{
                    width: "100%",
                    position: "unset",
                    paddingRight: "10px"
                  }}
                  value={this.state.currentLayer}
                  treeDefaultExpandedKeys={[this.state.currentLayer]}
                  dropdownStyle={{ maxHeight: 400, overflow: "auto" }}
                  placeholder="Bộ lọc"
                  allowClear
                  onChange={this.onChangeLayer}
                  treeData={treeData}
                />
                <SearchBoxByName
                  cameraData={cameraDataByLayer}
                  handleSelectSearch={this.handleSelectSearch}
                />
              </div>
              <hr
                style={{
                  borderTop: "1px solid",
                  marginTop: "10px",
                  marginBottom: "10px"
                }}
              />
            </div>
            <div style={{ paddingTop: 15 }}>
              <span
                style={{
                  fontSize: "17px",
                  fontWeight: "bold",
                  marginLeft: "10px"
                }}
              >
                {this.showElapTime
                  ? `TÌNH TRẠNG CAMERA (${timeElapse})`
                  : `TÌNH TRẠNG CAMERA`}{" "}
              </span>
              {this.showReload && (
                <Button
                  type={isLoadingData ? "disabled" : "primary"}
                  icon="reload"
                  style={{
                    float: "right",
                    marginRight: "10px",
                    marginTop: "-5px"
                  }}
                  onClick={this.handleReloadData}
                  disabled={isLoadingData}
                />
              )}
              {(!this.hiddenExportInMobile || !this.state.isMobile) && (
                <Button
                  type="primary"
                  icon="download"
                  style={{
                    float: "right",
                    marginRight: "10px",
                    marginTop: "-5px"
                  }}
                  onClick={this.exportData}
                  disabled={isLoadingData}
                />
              )}
              <hr
                style={{
                  borderTop: "1px solid",
                  marginTop: "10px",
                  marginBottom: "10px"
                }}
              />
              <CameraStatusCounting
                currentLayer={currentLayer}
                cameraDataByLayer={cameraDataByLayer}
                handleFilter={this.handleFilter}
                currentFilterValue={currentFilter}
                currentFilter={currentFilter}
                status={status}
                va_support={this.va_support}
                cameraVMSController={this.cameraVMSController}
                currentClusterDataID={currentClusterDataID}
                showVMSCountInList={this.showVMSCountInList}
                showVMSCountInListInTop={this.showVMSCountInListInTop}
                showVMSCountInListInBottom={this.showVMSCountInListInBottom}
                socialization_support={this.socialization_support}
                showVMSCountIgnoreDefault={this.showVMSCountIgnoreDefault}
              />
            </div>
            {this.va_support === true ? (
              <div style={{ paddingTop: 35 }}>
                <span
                  style={{
                    fontSize: "17px",
                    fontWeight: "bold",
                    marginLeft: "10px"
                  }}
                >
                  SỰ KIỆN GẦN ĐÂY
                </span>
                <hr
                  style={{
                    borderTop: "1px solid",
                    marginTop: "11px",
                    marginBottom: "10px"
                  }}
                />
                <ListEventComponent
                  eventDetectData={eventDetectData}
                  cameraData={cameraData}
                  handleCatchCameraClick={this.handleCatchCameraClick}
                  filterByClusterIDHandler={this.filterByClusterIDHandler}
                />
              </div>
            ) : (
              <div style={{ paddingTop: 35 }}></div>
            )}
          </div>
        }
        <Modal
          title={videoEventTitle}
          width={
            ((height + 60) * 1280) / 720 < width
              ? ((height + 60) * 1280) / 720
              : width
          }
          visible={videoEventVisible}
          footer={null}
          destroyOnClose={true}
          style={{ top: "0px" }}
          zIndex={1500}
          bodyStyle={{ padding: "5px" }}
          onCancel={this.closeVideoPopup}
        >
          {videoEventDataType == "image" ? (
            <img
              src={videoEventSrc}
              style={{ width: "100%" }}
              onError={e => {
                e.target.onerror = null;
                e.target.src = disconnectLarge;
              }}
            />
          ) : videoEventDataType == "frame" ? (
            <iframe src={videoEventSrc} style={{ width: "100%" }}>
              <p>Your browser does not support iframes.</p>
            </iframe>
          ) : (
            <div>
              {videoEventSrc ? (
                <video
                  src={videoEventSrc}
                  style={{ width: "100%" }}
                  autoPlay={true}
                  controls
                >
                  Trình duyệt không hỗ trợ xem video
                </video>
              ) : (
                <span>Không thể kết nối đến Camera</span>
              )}
            </div>
          )}
        </Modal>
      </div>
    );
  }
}
