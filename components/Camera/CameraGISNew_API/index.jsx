import React from "react";
import Widget from "@wso2-dashboards/widget";
import { Button, Modal, TreeSelect, Icon } from "antd";
import "antd/dist/antd.css";

import ListCameraComponent from "./ListCameraComponent";
import ListEventComponent from "./ListEventComponent";
import CameraStatusCounting, { StatisData } from "./CameraStatusCounting";
import { renderInfoWindowContent } from "./InfoWindowTemplate";
import SearchBox from "./SearchBox";
import SearchBoxByName from "./SearchBoxByName";
import FormSubmitStatusCamera from "./FormSubmitStatusCamera";
import {
  browser,
  isMobileBrowser,
  isMobileBrowserFunction
} from "./MobileCheck";

import cameraIcon0 from "./resources/icons/statisicon/0.png";
import cameraIcon1 from "./resources/icons/statisicon/1.png";
import cameraIcon2 from "./resources/icons/statisicon/2.png";
import cameraIcon3 from "./resources/icons/statisicon/3.png";
import cameraIcon4 from "./resources/icons/statisicon/4.gif";
import cameraIcon5 from "./resources/icons/statisicon/5.png";
import cameraIcon6 from "./resources/icons/statisicon/6.png";
import cameraIcon7 from "./resources/icons/statisicon/7.png";
import cameraIcon8 from "./resources/icons/statisicon/8.gif";
import cameraIcon9 from "./resources/icons/statisicon/9.png";
import cameraIcon10 from "./resources/icons/statisicon/10.png";

import loadingIconLarge from "./resources/icons/loading_large.gif";
import disconnectLarge from "./resources/icons/disconnect_large.png";

import CameraVAController from "./controller/CameraVAController";
import CameraVMSController from "./controller/CameraVMSController";

import CameraTreeHelper from "./controller/CameraTreeHelper";
import CameraExportHelper from "./controller/CameraExportHelper";
import { TextHelper } from "./controller/TextHelper";

import "./styles/InfoWindow.css";
import "./styles/Modal.css";
import "./styles/ViewMap.css";
import { ca } from "date-fns/locale";

const { TreeNode } = TreeSelect;

let incidentMap = null;

let markers = [];
let infoWindows = [];

const cameraIcons = [
  cameraIcon0,
  cameraIcon1,
  cameraIcon2,
  cameraIcon3,
  cameraIcon4,
  cameraIcon5,
  cameraIcon6,
  cameraIcon7,
  cameraIcon8,
  cameraIcon9,
  cameraIcon10
];
var map = null;
// var iconCamBroken, iconCamActive, iconCamUnactive, iconCamAI;
var listIcons = [];
// var markerCamBroken, markerCamActive, markerCamUnactive, markerCamAI;
var listMarkerGroups = [];
var listClusters = [];
var listMarkerDatas = []; //name cam, lat long,....
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

      infoVisible: false,
      infoTitle: "",
      infoContent: "",

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
      showFormSubmit: false,
      idCurrentCameraModal: "",
      defineConditionCamera: [],
      defineConditionNotGoodCamera: []
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
    this.handleReloadData = this.handleReloadData.bind(this);
    this.showInfo = this.showInfo.bind(this);
    this.closeInfoPopup = this.closeInfoPopup.bind(this);
    this.visibleFormSubmit = this.visibleFormSubmit.bind(this);
    this.invisibleFormSubmit = this.invisibleFormSubmit.bind(this);

    this.getEventName = this.getEventName.bind(this);
    this.getEventType = this.getEventType.bind(this);

    this.onImgError = this.onImgError.bind(this);
    this.onImgLoad = this.onImgLoad.bind(this);

    this.latCenter = 10.762622;
    this.lngCenter = 106.660172;
    this.zoomDefault = 11;
    this.northeastLat = 20.738033;
    this.northeastLng = 106.4671359;
    this.southwestLat = 21.648634;
    this.southwestLng = 108.0591179;

    //API, Server Config
    this.defaultSearch = "";
    this.countImgLoadError = 0;

    this.mapEsriRef = React.createRef();
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
        hiddenExportInMobile,
        widget_version,
        mobile_scale,
        camera_undone_support
      } = this.apiConfig;
      this.mobile_scale = mobile_scale ? mobile_scale : 30;
      this.widget_version = `13.8`; // widget_version == null ? "1.0" : widget_version;
      this.widget_time_update = "2020-03-12T10:20:00.000+07:00";
      this.widget_update_content = "";
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
      this.camera_undone_support =
        camera_undone_support == null ? true : camera_undone_support;
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
      console.log(
        `CAMERAGIS[version=${this.widget_version}:${new Date(
          this.widget_time_update
        ).toLocaleString("vi-VN")}]`
      );
    });
    this.props.glContainer.on("resize", this.handleResize);

    require("leaflet");
    var esri = require("esri-leaflet");
    require("esri-leaflet-cluster");
    require("leaflet.markercluster");
    require("leaflet.markercluster/dist/MarkerCluster.Default.css");
    require("leaflet.markercluster/dist/MarkerCluster.css");
    require("leaflet/dist/leaflet.css");

    map = L.map("esriMap", {
      maxZoom: 17
    }).setView([this.latCenter, this.lngCenter], this.zoomDefault);
    esri.basemapLayer("Streets").addTo(map);

    // khởi tạo icon, marker
    for (let index = 0; index < cameraIcons.length; index++) {
      let icon = L.icon({
        iconUrl: cameraIcons[index]
      });
      listIcons.push(icon);
      listMarkerGroups.push(L.layerGroup());
    }

    //tao cluster
    for (let index = 0; index < cameraIcons.length; index++) {
      if (index == 0 || index == 1 || index == 2 || index == 4) {
        let cluster = L.markerClusterGroup({
          iconCreateFunction: function(cluster) {
            return L.divIcon({
              html: cluster.getChildCount(),
              className:
                "clusterLevel-" +
                index +
                " cluster digits-" +
                (cluster.getChildCount() + "").length,
              iconSize: null
            });
          },
          maxClusterRadius: 20
          //Disable all of the defaults:
          // spiderfyOnMaxZoom: false,
          // showCoverageOnHover: false,
          // zoomToBoundsOnClick: false,
          // disableClusteringAtZoom: 15
        });
        listClusters[index] = cluster;
        // console.log(cluster);
        cluster.addLayer(listMarkerGroups[index]);
        map.addLayer(cluster);
      } else if (index == 3) {
        // gop cac maker co chung mau: do, xanh la, xanh duong, cam; index = 3:xanh la, index = 5: cam, index = 9: do, index = 10: xanh duong
        listClusters[1].addLayer(listMarkerGroups[index]);
      } else if (index == 5 || index == 8) {
        listClusters[4].addLayer(listMarkerGroups[index]);
      } else if (index == 9) {
        listClusters[0].addLayer(listMarkerGroups[index]);
      } else if (index == 10) {
        listClusters[2].addLayer(listMarkerGroups[index]);
      }
    }

    // / sự kiện cluster
    let shownLayer, polygon;
    function removePolygon() {
      if (shownLayer) {
        shownLayer.setOpacity(1);
        shownLayer = null;
      }
      if (polygon) {
        map.removeLayer(polygon);
        polygon = null;
      }
    }
    //khởi tạo sự kiện hiển thị zone khi hover vào cluster
    for (let index = 0; index < listClusters.length; index++) {
      if (listClusters[index]) {
        listClusters[index].on("clustermouseover", function(a) {
          removePolygon();

          a.layer.setOpacity(0.2);
          shownLayer = a.layer;
          polygon = L.polygon(a.layer.getConvexHull());
          map.addLayer(polygon);
        });
        listClusters[index].on("clustermouseout", removePolygon);
      }
    }
  }

  filterByClusterIDHandler(item, clusterDataID = null) {
    if (this.cameraVMSController.applyMultipleVMS) {
      return clusterDataID == null ? true : item.clusterDataID == clusterDataID;
    }
    return true;
  }

  updateAICameraHandler(aicameras, clusterDataID = null) {
    const methodTag = "updateAICameraHandler";
    console.log(`${methodTag}:${clusterDataID}`);
    if (aicameras == null || aicameras.length === 0) return;
    const { cameraData, status } = this.state;
    const cameraDataInCluster = cameraData.filter(camera =>
      this.filterByClusterIDHandler(camera, clusterDataID)
    );
    aicameras.forEach(aicamera => {
      const camera = cameraDataInCluster.find(
        camera => camera.vmsCamId == aicamera.vmsCameraId
      );
      if (!camera) return;
      if (camera.ailevel == null) {
        camera.ailevel = camera.level === 1 ? 3 : camera.level === 2 ? 10 : 9;
      }
      camera.aiStatus = 1;
    });
    status.isNeedUpdate = true;
    this.setState({ cameraData: cameraData, status: status });
  }

  updateAIEventHandler(aievents, clusterDataID = null) {
    const {
      lastestEvent,
      newestAIcamerasHaveEvent,
      allAIcamerasHaveEvent
    } = aievents;
    const { cameraData, status, liveCamera } = this.state;
    const allCamIDs = [];
    const newestCamIDs = [];
    const cameraDataInCluster = cameraData.filter(camera =>
      this.filterByClusterIDHandler(camera, clusterDataID)
    );

    allAIcamerasHaveEvent.forEach(vmsID => {
      const camera = cameraDataInCluster.find(
        camera => camera.vmsCamId == vmsID
      );
      if (!!camera) {
        camera.ailevel = 5;
        allCamIDs.push(vmsID);
      }
    });

    newestAIcamerasHaveEvent.forEach(vmsID => {
      const camera = cameraDataInCluster.find(
        camera => camera.vmsCamId == vmsID
      );
      if (!!camera) {
        camera.ailevel = 4;
        newestCamIDs.push(vmsID);
      }
    });

    const eventDetectData = [];
    const cachedIDs = [];
    const cachedCams = [];
    const turn = new Date().getTime();
    lastestEvent.forEach(event => {
      let camID = cachedIDs.find((vmsID, index) => event.vmsCameraId == vmsID);
      let camera = cachedCams.find(cam => event.vmsCameraId == cam.vmsCamId);
      if (camera == null) {
        camera = cameraDataInCluster.find(
          camera => camera.vmsCamId == event.vmsCameraId
        );
        if (camera != null) {
          camID = camera.vmsCamId;
          cachedIDs.push(camID);
          cachedCams.push(camera);
        }
      }
      if (camera == null) return;
      let new_event = {};
      new_event.id = event.id;
      new_event.vmsCamId = event.vmsCameraId;
      new_event.eventName = this.getEventName(event);
      new_event.eventType = this.getEventType(event);
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
      if (camera.eventTurn == null || camera.eventTurn !== turn) {
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
    const lives = [...liveCamera.map(c => c.vmsCamId)];
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

  updateCameraDataHandler(datas) {
    const cameraData = [];
    let isFirst =
      this.state.cameraData == null || this.state.cameraData.length === 0;
    let minLat = null;
    let maxLat = null;
    let minLng = null;
    let maxLng = null;
    let isNeedUpdateTSearch =
      this.monitorsFieldSearch.indexOf("values") >= 0 ||
      this.monitorsFieldSearch.indexOf("svalues") >= 0;
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
        if (isNeedUpdateTSearch) {
          camera.tSearch = TextHelper.getTSearch(
            camera,
            this.monitorsFieldSearch
          );
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
        numberChilds: parseInt(monitor.NumberCameraManagedKA),
        description: monitor.Description
      };
      if (camera.displayName != null && camera.displayName.length > 0) {
        camera.name = camera.displayName;
      }
      if (camera.address == null || camera.address.length === 0) {
        camera.address = camera.name;
      }
      camera.LiveviewSmall = camera.Liveview
        ? `${camera.Liveview}${
            camera.Liveview.indexOf("?") > 0 ? "&" : "?"
          }scale=${this.mobile_scale}`
        : camera.Liveview;

      camera.isSocialization = camera.cameraCategory == 2;
      camera.isUnDone = camera.cameraCategory == 3;
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
      camera.ailevel = null;
      if (camera.isSocialization && this.socialization_support) {
        camera.level = 6;
        camera.glevel = 6;
      }
      if (camera.isUnDone && this.camera_undone_support) {
        camera.level = 7;
        camera.glevel = 7;
      }
      camera.tSearch = TextHelper.getTSearch(camera, this.monitorsFieldSearch);
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
    // TODO update zoom with size, resolutive, screen size...
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
    return this.cameraVAController.getEventType(event);
  }

  getEventName(event) {
    return this.cameraVAController.getEventName(event);
  }

  componentWillMount() {
    this.handleResize();
  }

  componentDidUpdate(prevProps, prevState) {
    if (
      JSON.stringify(prevState.cameraData) !=
        JSON.stringify(this.state.cameraData) ||
      this.state.cameraData.length == 0
    ) {
      this.addMarkerToMap();
    }

    if (
      (JSON.stringify(prevState.defineConditionCamera) !=
        JSON.stringify(this.state.defineConditionCamera) ||
        this.state.defineConditionCamera.length == 0 ||
        JSON.stringify(prevState.defineConditionNotGoodCamera) !=
          JSON.stringify(this.state.defineConditionNotGoodCamera) ||
        this.state.defineConditionNotGoodCamera.length == 0) &&
      this.cameraVAController != null
    ) {
      this.cameraVMSController.getDefineError(2).then(result => {
        this.setState({
          defineConditionCamera: result
        });
      });
      this.cameraVMSController.getDefineError(1).then(result => {
        this.setState({
          defineConditionNotGoodCamera: result
        });
      });
    }

    const prevLayer = prevState.currentLayer;
    if (prevLayer != this.state.currentLayer)
      this.onChangeLayer(this.state.currentLayer);
  }

  componentWillUnmount() {
    this.cameraVAController.stop();
    this.cameraVMSController.stop();
    clearInterval(this.timeElapseInterval);
    window.stop();
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
    let isMobileFunction = isMobileBrowserFunction();

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
      isMobileFunction: isMobileFunction,
      showPopupLiveCam: showPopupLiveCam
    });
  }

  handleClickCamera(camera) {
    if (camera.level === 0) {
      // alert(`Camera '${camera.name}' không hoạt động`);
      Modal.confirm({
        title: `Camera '${camera.name}' không hoạt động`,
        // content:
        //   "When clicked the OK button, this dialog will be closed after 1 second",
        okText: "Báo cáo",
        cancelText: "Hủy",
        onOk: () => {
          this.setState({
            idCurrentCameraModal: camera.vmsCamId
          });
          this.visibleFormSubmit();
        },
        onCancel() {}
      });
    } else if (camera.glevel === 6) {
      if (this.showSocializationInNewTab) {
        window.open(camera.url, "_blank");
      } else {
        this.showLiveCamOnMobile(camera.vmsCamId, camera.clusterDataID);
      }
    } else if (camera.glevel === 7) {
      // alert(
      //   `Camera '${camera.name}' chưa lấy được. ${
      //     camera.description ? camera.description : ""
      //   }`
      // );
      Modal.confirm({
        title: `Camera '${camera.name}' chưa lấy được. ${
          camera.description ? camera.description : ""
        }`,
        // content:
        //   "When clicked the OK button, this dialog will be closed after 1 second",
        okText: "Báo cáo",
        cancelText: "Hủy",
        onOk: () => {
          this.setState({
            idCurrentCameraModal: camera.vmsCamId
          });
          this.visibleFormSubmit();
        },
        onCancel() {}
      });
    } else if (this.state.isMobile || this.state.showPopupLiveCam) {
      this.showLiveCamOnMobile(camera.vmsCamId, camera.clusterDataID);
    } else {
      this.addLiveCamera(camera.vmsCamId, camera.level, camera.clusterDataID);
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
      description: camera.description,
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
      let liveCamSrc = this.state.isMobileFunction
        ? liveCameraData.LiveviewSmall
        : liveCameraData.Liveview; // resp.data.monitor.mjpeg;
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

    this.setState({
      idCurrentCameraModal: vmsCamId
    });
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
    if (incidentMap == null) {
      return;
    }

    // Remove cac marker hien tai
    markers.map(marker => {
      incidentMap.removeMarker(marker);
    });

    markers = [];
    let cameraDataByLayer = this.state.cameraDataByLayer;
    if (!cameraDataByLayer) {
      cameraDataByLayer = this.getCameraDataByLayer(this.state.currentLayer);
      this.setState({
        cameraDataByLayer: cameraDataByLayer
      });
    }
    let displayCamera = cameraDataByLayer; //this.getCameraDataByLayer(this.state.currentLayer);

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
          (currentFilter == StatisData.AI && item.ailevel !== null) ||
          (currentFilter == StatisData.EVENT5P && item.ailevel === 4) ||
          (currentFilter == StatisData.EVENT24H &&
            (item.ailevel === 5 || item.ailevel === 4)) ||
          (currentFilter == StatisData.SOCIAL && item.glevel === 6) ||
          (currentFilter == StatisData.UNDONE && item.glevel === 7))
      );
    });
    displayCamera.map(marker => {
      const markerLatLng = new vbd.LatLng(marker.latitude, marker.longitude);
      const markerIcon =
        marker.ailevel != null
          ? cameraIcons[marker.ailevel]
          : marker.glevel != null
          ? cameraIcons[marker.glevel]
          : cameraIcons[marker.level];
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
        id: marker.id,
        vmsCamId: marker.vmsCamId,
        title: marker.name,
        address: marker.address,
        description: marker.description,
        events: marker.events,
        username: marker.username,
        password: marker.password,
        numberChilds: marker.numberChilds
      });

      var vbdInfowindow = new vbd.InfoWindow({ content: contentShow });

      var that = this;

      vbd.event.addListener(vMarker, "click", function(event) {
        that.handleClickCamera(marker);
      });

      vbd.event.addListener(vMarker, "mouseover", function(param) {
        if (infoWindows) {
          infoWindows.map(iw => {
            iw.close();
          });
        }
        infoWindows = [];
        this.timer = setTimeout(function() {
          vbdInfowindow.open(incidentMap, vMarker);
          infoWindows.push(vbdInfowindow);

          // Thêm sự kiện khi click vào một event
          $(".aEvent").click(function(event) {
            var title = "";
            if ($(event.target).data("camname"))
              title += $(event.target).data("camname");
            if ($(event.target).data("type"))
              title += " - " + $(event.target).data("type");
            if ($(event.target).data("time"))
              title += " - " + $(event.target).data("time");

            const eventID = $(event.target).data("eventid");
            const clusterdataid = $(event.target).data("clusterdataid");

            let isSupportVideo = browser() !== "safari";
            let apiUrl = isSupportVideo
              ? that.cameraVAController.getEventVideoLink(
                  eventID,
                  clusterdataid
                )
              : that.cameraVAController.getEventImageLink(
                  eventID,
                  clusterdataid
                );
            that.setState({
              videoEventSrc: apiUrl,
              videoEventTitle: title,
              videoEventDataType: isSupportVideo ? "video" : "image",
              videoEventVisible: true
            });
          });
        }, 500);
      });

      vbd.event.addListener(vMarker, "mouseout", function() {
        clearTimeout(this.timer);
      });

      markers.push(vMarker);
    });

    //esri map
    listMarkerDatas = [];

    for (let index = 0; index < cameraIcons.length; index++) {
      listMarkerDatas[index] = displayCamera.filter(camera => {
        return (
          (!camera.glevel && !camera.ailevel && camera.level == index) ||
          camera.ailevel == index ||
          camera.glevel == index
        );
      });
    }

    // console.log(listMarkerDatas);

    this.removeAllMarker();
    for (let index = 0; index < listMarkerDatas.length; index++) {
      listMarkerDatas[index].map(camera => {
        if (camera.latitude && camera.longitude) {
          let objectMarker = L.marker([camera.latitude, camera.longitude], {
            icon: listIcons[index],
            idCamera: camera.id,
            nameCamera: camera.name,
            addressCamera: camera.address
          }).addTo(listMarkerGroups[index]);

          //set action for marker
          objectMarker.bindPopup(function(camera) {
            // console.log(camera);
            return (
              '<div style="font-size: 18px; font-weight: bold;">' +
              camera.options.nameCamera +
              "</div>" +
              "<p>" +
              camera.options.addressCamera +
              "</p"
            );
          });

          var that = this;

          objectMarker.on("click", function(e) {
            let targetCamera = displayCamera.filter(camera => {
              return camera.id == e.target.options.idCamera;
            })[0];
            that.handleClickCamera(targetCamera);
          });

          objectMarker.on("mouseover", function(e) {
            this.openPopup();
          });
          objectMarker.on("mouseout", function(e) {
            this.closePopup();
          });
        } else {
          // console.log(camera);
        }
      });

      //   listClusters[index].addLayer(listMarkerGroups[index]);
      if (index == 0 || index == 1 || index == 2 || index == 4) {
        listClusters[index].addLayer(listMarkerGroups[index]);
      } else if (index == 3) {
        // gop cac maker co chung mau: do, xanh la, xanh duong, cam; index = 3:xanh la, index = 5: cam, index = 9: do, index = 10: xanh duong
        listClusters[1].addLayer(listMarkerGroups[index]);
      } else if (index == 5 || index == 8) {
        listClusters[4].addLayer(listMarkerGroups[index]);
      } else if (index == 9) {
        listClusters[0].addLayer(listMarkerGroups[index]);
      } else if (index == 10) {
        listClusters[2].addLayer(listMarkerGroups[index]);
      }
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

  handleLiveCameraClick(videoEventSrc, title, idCamera) {
    if (this.videoEventSrc != videoEventSrc) {
      console.log(`handleLiveCameraClick:${videoEventSrc}`);
      this.setState({
        videoEventSrc: loadingIconLarge,
        videoEventTitle: title,
        videoEventDataType: "image",
        videoEventVisible: true
      });
      setTimeout(() => this.setState({ videoEventSrc: videoEventSrc }), 100);
    }

    this.setState({
      idCurrentCameraModal: idCamera
    });
  }

  handleFitBounds(s, w, n, e) {
    if (incidentMap) {
      console.log("handleFitBounds:" + s);
      const sw = new vbd.LatLng(s, w);
      const ne = new vbd.LatLng(n, e);
      incidentMap.zoomFitEx([sw, ne]);
    }

    if (map) {
      map.fitBounds([
        [s, w],
        [n, e]
      ]);
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

    if (map) {
      map.setView([this.latCenter, this.lngCenter], this.zoomDefault);
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
    const centerDefault = new vbd.LatLng(latCenter, lngCenter);
    // if (incidentMap.getZoom()  < zoom) {
    incidentMap.setZoom(zoom);
    // }
    incidentMap.setCenter(centerDefault);

    if (map) {
      map.setView([latCenter, lngCenter], zoom);
    }
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

  showInfo() {
    let date = new Date(this.widget_time_update);
    this.setState({
      infoVisible: true,
      infoTitle: `CameraGIS`,
      infoVersion: `${this.widget_version}`,
      infoTimeUpdate: `${date.toLocaleString("vi-VN")}`,
      infoContent: `${this.widget_update_content}`
    });
  }

  closeInfoPopup() {
    setTimeout(() => {
      this.setState({ infoVisible: false });
    }, 100);
  }

  onImgError(e) {
    this.countImgLoadError++;
    console.log(`onError:${e.target.src}:${this.countImgLoadError}`);
    // e.target.src =  this.countImgLoadError > 3 ? disconnectLarge : loadingIconLarge;
    e.target.src = disconnectLarge;
  }

  onImgLoad(e) {
    let src = e.target.src;
    let isDoned =
      src != null && src !== loadingIconLarge && src !== disconnectLarge;
    if (isDoned) {
      this.countImgLoadError = 0;
    }
  }

  removeAllMarker() {
    // for (let index = 0; index < listClusters.length; index++) {
    //   listClusters[index].removeLayer(listMarkerGroups[index]);
    //   listMarkerGroups[index]._layers = {};
    // }
    for (let index = 0; index < listMarkerDatas.length; index++) {
      //remove marker theo mau sac: do xanh la, xanh duong, cam
      if (index == 0 || index == 1 || index == 2 || index == 4) {
        listClusters[index].removeLayer(listMarkerGroups[index]);
      } else if (index == 3) {
        listClusters[1].removeLayer(listMarkerGroups[index]);
      } else if (index == 5 || index == 8) {
        listClusters[4].removeLayer(listMarkerGroups[index]);
      } else if (index == 9) {
        listClusters[0].removeLayer(listMarkerGroups[index]);
      } else if (index == 10) {
        listClusters[2].removeLayer(listMarkerGroups[index]);
      }
      listMarkerGroups[index]._layers = {};
    }
  }

  visibleFormSubmit() {
    this.setState({ showFormSubmit: true });
  }

  invisibleFormSubmit() {
    this.setState({ showFormSubmit: false });
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
      isLoadingData,
      infoVisible,
      infoTitle,
      infoVersion,
      infoTimeUpdate,
      infoContent,
      isMobileFunction,
      showFormSubmit,
      idCurrentCameraModal,
      defineConditionCamera,
      defineConditionNotGoodCamera
    } = this.state;
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
          width: width * 0.3,
          minWidth: 285,
          float: "left",
          borderLeft: "1px solid #13222a",
          paddingLeft: "10px",
          overflowY: "auto"
        }
      : { height: width, width: "100%" };

    const rightSide = !isMobile
      ? {
          height: "100%",
          width: width * 0.7,
          maxWidth: this.props.glContainer.width - 285,
          float: "right"
        }
      : { height: "80%", width: "100%" };

    const style = isMobile
      ? { width: width, height: height, position: "relative", top: 0 }
      : { width: width, height: height, position: "relative", top: 0 };

    const styleSearchBox = isMobile
      ? {
          position: "absolute",
          top: 0,
          right: 202,
          color: "black"
        }
      : {
          position: "absolute",
          top: 0,
          right: 252,
          color: "black"
        };

    return (
      <div style={style}>
        {
          <div style={rightSide}>
            <div id="searchBox" style={styleSearchBox}>
              <Button
                icon="home"
                style={{ marginRight: "2px", marginLeft: "2px" }}
                onClick={this.resetMap}
              />
              <div
                style={{
                  display: "inline-block",
                  position: "absolute",
                  top: "0"
                }}
              >
                <SearchBox
                  defaultSearch={this.defaultSearch}
                  isMobile={isMobile}
                  handleFitBounds={this.handleFitBounds}
                  northeastLat={this.northeastLat}
                  northeastLng={this.northeastLng}
                  southwestLat={this.southwestLat}
                  southwestLng={this.southwestLng}
                />
              </div>
            </div>
            <div id={"vbdContainer"} style={(vbdStyle, { display: "none" })} />
            <div
              id={"esriMap"}
              className="webmap"
              style={vbdStyle}
              ref={this.mapEsriRef}
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
                  isMobileFunction={isMobileFunction}
                  isMobile={isMobile}
                />
              </div>
            )}
          </div>
        }
        {
          <div style={leftSide}>
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
              <Button
                type="primary"
                icon="info-circle"
                title="Thông tin"
                onClick={this.showInfo}
                style={{
                  float: "right",
                  marginRight: "10px",
                  marginTop: "-5px"
                }}
              />
              {this.showReload && (
                <Button
                  type={isLoadingData ? "disabled" : "primary"}
                  icon="reload"
                  title="Cập nhật dữ liệu"
                  style={{
                    float: "right",
                    marginRight: "10px",
                    marginTop: "-5px"
                  }}
                  onClick={this.handleReloadData}
                  disabled={isLoadingData}
                />
              )}
              {(!this.hiddenExportInMobile || !this.state.isMobileFunction) && (
                <Button
                  type="primary"
                  icon="download"
                  title="Xuất dữ liệu"
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
                camera_undone_support={this.camera_undone_support}
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
          title="Thông tin"
          visible={infoVisible}
          footer={null}
          onCancel={this.closeInfoPopup}
        >
          <br />
          <p>
            <b>{infoTitle}</b>
          </p>
          <p>Version :{infoVersion}</p>
          <p>Thời gian cập nhật: {infoTimeUpdate}</p>
          <p>{infoContent}</p>
        </Modal>
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
          <Icon
            type="flag"
            theme="filled"
            style={{
              color: "#000000",
              fontSize: "24px",
              float: "right",
              marginRight: "20px",
              marginLeft: "20px"
            }}
            onClick={this.visibleFormSubmit}
          />

          {videoEventDataType == "image" ? (
            <img
              src={videoEventSrc}
              style={{ width: "100%" }}
              // onError={(e) => { e.target.onerror = null; e.target.src = disconnectLarge }}
              onLoad={e => {
                this.onImgLoad(e);
              }}
              onError={e => {
                this.onImgError(e);
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
        <FormSubmitStatusCamera
          zIndex={1501}
          showSubmitForm={showFormSubmit}
          closeSubmitForm={this.invisibleFormSubmit}
          idCamera={idCurrentCameraModal}
          defineConditionCamera={defineConditionCamera}
          defineConditionNotGoodCamera={defineConditionNotGoodCamera}
          cameraVMSController={this.cameraVMSController}
        />
      </div>
    );
  }
}
