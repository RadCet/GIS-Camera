import React from "react";
import Widget from "@wso2-dashboards/widget";
import ListCameraComponent from "./ListCameraComponent";
import { TreeSelect, Button, Icon, Modal, Radio, message } from "antd";
import "antd/dist/antd.css";
import "./styles/Modal.css";

import loadingIconLarge from "./resources/image/loading_large.gif";
import disconnectLarge from "./resources/image/disconnect_large.png";
import CameraVMSController from "./controller/CameraVMSController";
// import CameraVMSController from './controller/CameraVMSController_withouttoken';
import CameraTreeHelper from "./controller/CameraTreeHelper";
import { isMobileBrowser } from "./MobileCheck";
import { TextHelper } from "./controller/TextHelper";
import { isMobileBrowserFunction } from "./MobileCheck";
import { localStoragePersistentHandler as defaultPersistentHandler } from "./controller/PersistentHelper";
import { EncryptHelper } from "./controller/Helper";
import FormSubmitStatusCamera from "./FormSubmitStatusCamera";

class CameraMonitoring extends Widget {
  constructor(props) {
    super(props);
    this.default_resolution_mode = {
      key: "auto",
      titles: { en: "Auto", vi: "Tự động" },
      value: { scale: 0 }
    };
    this.default_monitoring_playing_mode = "manual"; //"manual|auto"
    this.state = {
      mode: 2,
      cameraData: [],

      width: props.glContainer.width,
      height: props.glContainer.height,

      // popup
      videoEventTitle: "",
      videoEventSrc: "",
      videoEventDataType: "video",
      videoEventVisible: false,
      infoVisible: false,
      infoTitle: "",
      infoContent: "",
      fetchError: false,

      liveCameraDatas: [],
      currentLayer: undefined,
      treeData: [],
      isPlaying: this.default_monitoring_playing_mode === "auto",
      updateNow: true,
      isLoadedData: false,
      resolution_mode: this.default_resolution_mode,

      // report camera
      currentClusterDataID: null,
      permissionReport: null,
      showFormSubmit: false,
      idVMSForCurrentCamera: "",
      idCurrentCameraModal: "",
      isCamdie: false,
      defineConditionCamera: [],
      defineConditionNotGoodCamera: []
    };
    this.handleResize = this.handleResize.bind(this);
    this.handleLiveCameraClick = this.handleLiveCameraClick.bind(this);
    this.handleUpdateLiveCam = this.handleUpdateLiveCam.bind(this);
    this.addLiveCamIds = this.addLiveCamIds.bind(this);
    this.closeVideoPopup = this.closeVideoPopup.bind(this);
    this.onChangeLayer = this.onChangeLayer.bind(this);
    this.playMonitoring = this.playMonitoring.bind(this);
    this.newTokenUpdateHandler = this.newTokenUpdateHandler.bind(this);
    this.updateCameraDataHandler = this.updateCameraDataHandler.bind(this);
    this.filterByClusterIDHandler = this.filterByClusterIDHandler.bind(this);
    this.getCameraDataByLayer = this.getCameraDataByLayer.bind(this);
    this.showInfo = this.showInfo.bind(this);
    this.closeInfoPopup = this.closeInfoPopup.bind(this);
    this.visibleFormSubmit = this.visibleFormSubmit.bind(this);
    this.invisibleFormSubmit = this.invisibleFormSubmit.bind(this);

    this.onImgLoad = this.onImgLoad.bind(this);
    this.onImgError = this.onImgError.bind(this);
    this.onChangeResolution = this.onChangeResolution.bind(this);
    this.getLiveURLMonitorByResolutionMode = this.getLiveURLMonitorByResolutionMode.bind(
      this
    );

    this.refreshInterval = 6000;
    this.refreshCount = Math.floor(Math.random() * 100 + 1);
    this.addMode = { NEXT: "next", PREV: "previous" };

    this.countImgLoadError = 0;

    this.language = "vi";
    this.resolution_options = [
      {
        key: "auto",
        titles: { en: "Auto", vi: "Tự động" },
        value: { scale: { default: 100, min: 50, max: 50, mobile: 50 } }
      }
    ];
    this.overview_view_options = [
      { key: "default", titles: { en: "Default", vi: "Mặc định" }, value: {} }
    ];
    this.resolution_options_auto_mode_order_switch = {
      default: ["heigh", "medium", "low", "verylow", "snapshot"]
    };
    this.mobile_scale = 50;
    this.encryptHelper = new EncryptHelper(defaultPersistentHandler);
    this.monitoring_options = {
      playing_mode: this.default_monitoring_playing_mode
    };
  }

  componentWillMount() {
    this.handleResize();
  }

  componentDidMount() {
    const { id, widgetID } = this.props;
    super.getWidgetConfiguration(widgetID).then(message => {
      this.refreshInterval =
        message.data.configs.providerConfig.configs.refreshInterval;
      this.getLiveCameraApi =
        message.data.configs.providerConfig.configs.getLiveCameraApi;
      this.turnOnCameraApi =
        message.data.configs.providerConfig.configs.turnOnCameraApi;

      this.apiConfig = message.data.configs.providerConfig.apiConfig; //config;
      this.viewConfig = message.data.configs.providerConfig.viewConfig; //config;
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
      CameraTreeHelper.checkDisableHandler = target => {
        if (typeof target.numberLive === "number") {
          return target.numberLive === 0;
        }
        return false;
      };
      const {
        monitorsFieldSearch,
        socialization_support,
        numberListCameraDisplay,
        mobile_scale,
        camera_undone_support,
        language,
        resolution_options,
        resolution_options_auto_mode_order_switch,
        persistentProfile
      } = this.apiConfig;
      this.mobile_scale = mobile_scale ? mobile_scale : this.mobile_scale;
      this.camera_undone_support =
        camera_undone_support == null ? true : camera_undone_support;
      this.monitorsFieldSearch =
        monitorsFieldSearch == null ? ["name"] : monitorsFieldSearch;
      this.widget_version = `15.10`;
      this.widget_time_update = "2020-04-04T09:00:00.000+07:00";
      this.widget_update_content = "";
      this.socialization_support =
        socialization_support == null ? false : socialization_support;
      this.numberListCameraDisplay =
        numberListCameraDisplay == null ? -1 : numberListCameraDisplay;

      this.language = language ? language : this.language;
      if (resolution_options) {
        resolution_options.forEach(option => {
          const save = this.resolution_options.find(
            item => item.key === option.key
          );
          if (save) {
            for (let key in option) save[key] = option[key];
          } else {
            this.resolution_options.push(option);
          }
        });
      }
      let save_resolution_mode = this.encryptHelper.loadFromPersistence(
        "resolution_mode"
      );
      if (
        save_resolution_mode == null ||
        this.resolution_options.find(
          item => item.key === save_resolution_mode.key
        ) == null
      ) {
        save_resolution_mode = this.default_resolution_mode;
      }
      if (resolution_options_auto_mode_order_switch) {
        for (let key in resolution_options_auto_mode_order_switch) {
          this.resolution_options_auto_mode_order_switch[key] =
            resolution_options_auto_mode_order_switch[key];
        }
      }
      let save_monitoring_options = this.encryptHelper.loadFromPersistence(
        "monitoring_options"
      );
      if (save_monitoring_options) {
        for (let key in save_monitoring_options) {
          this.monitoring_options[key] = save_monitoring_options[key];
        }
      }
      let isPlaying = this.monitoring_options.playing_mode === "auto";

      this.setState({
        resolution_mode: save_resolution_mode,
        isPlaying: isPlaying
      });

      this.cameraVMSController = new CameraVMSController(
        this.apiConfig,
        this.updateCameraDataHandler,
        this.newTokenUpdateHandler,
        defaultPersistentHandler
      );
      this.cameraVMSController.start();
      console.log(
        `CAMERAMONITORING[version=${this.widget_version}:${new Date(
          this.widget_time_update
        ).toLocaleString("vi-VN")}]`
      );
    });
    this.props.glContainer.on("resize", this.handleResize);
  }

  newTokenUpdateHandler(token) {
    console.log(`newTokenUpdateHandler`);
    // TODO refresh link
    // const {liveCameraDatas, updateNow, currentLayer} = this.state;
    // let cameraDataByLayer = this.getCameraDataByLayer(currentLayer);
    // this.setState({
    //     cameraDataByLayer: cameraDataByLayer,
    //     liveCameraDatas: liveCameraDatas,
    //     updateNow: false
    // })
  }

  getCameraDataByLayer(layer) {
    let cameraData = this.state.cameraData;
    if (cameraData == null) return [];
    if (typeof layer == "undefined") return cameraData;
    return cameraData.filter(item => {
      return item.values.find(item => item.startsWith(layer)) != null;
    });
  }

  filterByClusterIDHandler(item, clusterDataID = null) {
    if (clusterDataID) {
      this.setState({
        currentClusterDataID: clusterDataID
      });
    } else {
      this.setState({
        currentClusterDataID: null
      });
    }
    if (this.cameraVMSController.applyMultipleVMS) {
      return clusterDataID == null ? true : item.clusterDataID == clusterDataID;
    }
    return true;
  }

  updateCameraDataHandler(datas) {
    const cameraData = [];
    let isNeedUpdateTSearch =
      this.monitorsFieldSearch.indexOf("values") >= 0 ||
      this.monitorsFieldSearch.indexOf("svalues") >= 0;
    let nodeHandler = (monitor, node, parentNode) => {
      let clusterDataID = monitor.clusterDataID;
      if (parentNode.allIDs == null) parentNode.allIDs = [];
      if (parentNode.liveIDs == null) parentNode.liveIDs = [];
      let allIDObjectByCluster = parentNode.allIDs.find(
        item => item.clusterDataID == clusterDataID
      );
      if (!allIDObjectByCluster) {
        allIDObjectByCluster = {
          clusterDataID: clusterDataID,
          monitorIDs: new Set()
        };
        parentNode.allIDs.push(allIDObjectByCluster);
      }
      allIDObjectByCluster.monitorIDs.add(monitor.Id);
      let level =
        monitor.Enabled == 1
          ? "Connected" === monitor.Status
            ? 1
            : 0
          : "Connected" === monitor.LastStatusBKA
          ? 2
          : 0;
      if (level > 0) {
        let liveDObjectByCluster = parentNode.liveIDs.find(
          item => item.clusterDataID == clusterDataID
        );
        if (!liveDObjectByCluster) {
          liveDObjectByCluster = {
            clusterDataID: clusterDataID,
            monitorIDs: new Set()
          };
          parentNode.liveIDs.push(liveDObjectByCluster);
        }
        liveDObjectByCluster.monitorIDs.add(monitor.Id);
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
        longitude: monitor.Longitude,
        latitude: monitor.Latitude,
        url: monitor.Liveview,
        username: null,
        password: null,
        lastIncidentTime: 0,
        events: null,
        cameraType: 0,
        broke: 0,
        cameraStatus: monitor.Status,
        functionStatus: monitor.Enabled,
        aiStatus: 0,
        status: monitor.Enabled,
        layer: parentNode.name,
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

      camera.LiveviewSmall = camera.Liveview
        ? `${camera.Liveview}${
            camera.Liveview.indexOf("?") > 0 ? "&" : "?"
          }scale=${this.mobile_scale}`
        : camera.Liveview;
      camera.isSocialization = camera.cameraCategory == 2;
      camera.isUnDone = camera.cameraCategory == 3;

      camera.level = level;
      camera.values = [node.value];

      camera.level = level;
      camera.values = [node.value];
      camera.svalues = [node.svalue];
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
      ignoreCameraNotInGroup,
      null,
      this.cameraVMSController.combineDefaultGroupTarget,
      this.cameraVMSController.combineRootByTag
    );
    let root = CameraTreeHelper.buildUITreeData(
      tree,
      null,
      addCameraChildInTree,
      nodeHandler,
      true
    );
    let treeData = root.children;
    if (!alwaysShowRootNode && treeData.length === 1) {
      do {
        treeData = treeData[0].children;
      } while (ignoreGroupOnlyHaveOneChild && treeData.length === 1);
    }
    this.setState({
      cameraData: cameraData,
      treeData: treeData,
      cameraDataByLayer: null,
      isLoadedData: true
    });
  }

  componentDidUpdate(prevProps, prevState) {
    const { isPlaying, liveCameraDatas } = this.state;
    let turnOnCameraBeforeLive =
      liveCameraDatas != null && liveCameraDatas.length > 0;
    if (prevState.cameraData !== this.state.cameraData) {
      // TODO check need when update cameraData ???
      this.addLiveCamIds(this.addMode.NEXT, turnOnCameraBeforeLive, 3000, true);
    } else if (prevState.currentLayer !== this.state.currentLayer) {
      this.addLiveCamIds(this.addMode.NEXT, turnOnCameraBeforeLive, 3000, true);
    }

    if (prevState.isPlaying !== isPlaying) {
      if (isPlaying) {
        this.playingInterval = setInterval(() => {
          this.addLiveCamIds(this.addMode.NEXT, true, 5000);
        }, this.refreshInterval * 1000);
      } else {
        clearInterval(this.playingInterval);
      }
    }

    if (this.state.permissionReport == null && this.cameraVMSController) {
      if (
        this.cameraVMSController
          .getCurrentVMS()
          .auth.permission.includes("Report")
      ) {
        this.setState({
          permissionReport: true
        });
      } else {
        this.setState({
          permissionReport: false
        });
      }
    }

    if (
      (JSON.stringify(prevState.defineConditionCamera) !=
        JSON.stringify(this.state.defineConditionCamera) ||
        this.state.defineConditionCamera.length == 0 ||
        JSON.stringify(prevState.defineConditionNotGoodCamera) !=
          JSON.stringify(this.state.defineConditionNotGoodCamera) ||
        this.state.defineConditionNotGoodCamera.length == 0) &&
      this.cameraVMSController != null
    ) {
      this.cameraVMSController.getDefineError(2).then(result => {
        if (result[0].target) {
          this.setState({
            defineConditionCamera: result[0].data
          });
        } else {
          this.setState({
            defineConditionCamera: result
          });
        }
      });
      this.cameraVMSController.getDefineError(1).then(result => {
        if (result[0].target) {
          this.setState({
            defineConditionNotGoodCamera: result[0].data
          });
        } else {
          this.setState({
            defineConditionNotGoodCamera: result
          });
        }
      });
    }
  }

  componentWillUnmount() {
    this.cameraVMSController.stop();
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
    // let showPopupLiveCam = glContainer.width < glContainer.height || glContainer.width < 1000;

    this.setState({
      width: glContainer.width,
      height: glContainer.height,
      isMobile: isMobile,
      isMobileFunction: isMobileFunction
      // showPopupLiveCam: showPopupLiveCam
    });
  }

  addLiveCamIds(
    addMode,
    turnOnCameraBeforeLive = false,
    timeDelayBeforeLive = 3000,
    updateNow = false
  ) {
    switch (addMode) {
      case this.addMode.NEXT:
        this.refreshCount += 4;
        break;
      case this.addMode.PREV:
        this.refreshCount -= 4;
        break;
    }
    let cameraDataByLayer = this.state.cameraDataByLayer;
    if (!cameraDataByLayer) {
      cameraDataByLayer = this.getCameraDataByLayer(this.state.currentLayer);
      this.setState({
        cameraDataByLayer: cameraDataByLayer,
        updateNow: updateNow
      });
    }
    const camerePlayAble = cameraDataByLayer.filter(
      item => item.level === 1 || item.level === 2
    );
    const length = camerePlayAble.length;
    if (length > 0) {
      const arr = [];
      const camarr = [];
      const displayCameraNumber = length < 4 ? length : 4;
      for (let i = 0; i < displayCameraNumber; i++) {
        let cam = camerePlayAble[(this.refreshCount + i) % length];
        camarr.push(cam);
        arr.push({ clusterDataID: cam.clusterDataID, vmsCamId: cam.vmsCamId });
      }

      // TODO turn on next camera.
      const nextCameraNumber = displayCameraNumber; //TODO need check
      const nextRefreshCount =
        addMode === this.addMode.NEXT
          ? this.refreshCount + 4
          : this.refreshCount - 4;
      const nextTasks = [];
      const nextCams = [];
      for (let i = 0; i < nextCameraNumber; i++) {
        let camera = camerePlayAble[(nextRefreshCount + i) % length];
        if (camera && camera.level === 2) {
          nextCams.push(camera);
          nextTasks.push(
            this.cameraVMSController
              .turnOnCameraToVMS(camera.clusterDataID, camera.vmsCamId)
              .catch(error => {})
          );
        }
      }
      // ----------------
      const mode = length == 1 ? 1 : 2;
      //Turn on before.
      if (turnOnCameraBeforeLive) {
        if (updateNow) {
          this.setState({
            liveCameraDatas: arr,
            mode: mode,
            updateNow: updateNow
          });
        }
        const tasks = camarr
          .filter(camera => camera.level === 2)
          .map(camera =>
            this.cameraVMSController
              .turnOnCameraToVMS(camera.clusterDataID, camera.vmsCamId)
              .catch(error => {})
          );
        Promise.all(tasks)
          .then(results => {
            let now = new Date().getTime();
            for (let i = 0; i < results.length; i++) {
              camarr[i].timeCallTurnOn = now;
            }
          })
          .catch(error => {
            console.error(error);
          })
          .then(() => {
            setTimeout(
              () =>
                this.setState({
                  liveCameraDatas: arr,
                  mode: mode,
                  updateNow: updateNow
                }),
              timeDelayBeforeLive
            );
            // TODO turn on next camera.
            Promise.all(nextTasks).then(results => {
              console.log(`Turn next doned:${results.length}`);
              let now = new Date().getTime();
              for (let i = 0; i < results.length; i++) {
                nextCams[i].timeCallTurnOn = now;
              }
            });
          });
      } else {
        this.setState({
          liveCameraDatas: arr,
          mode: mode,
          updateNow: updateNow
        });
        // TODO turn on next camera.
        Promise.all(nextTasks).then(results => {
          console.log(`Turn next doned:${results.length}`);
          let now = new Date().getTime();
          for (let i = 0; i < results.length; i++) {
            nextCams[i].timeCallTurnOn = now;
          }
        });
      }
    }
  }

  handleLiveCameraClick(videoEventSrc, title, idVMS, idCamera) {
    if (this.videoEventSrc !== videoEventSrc) {
      this.setState({
        videoEventSrc: loadingIconLarge,
        videoEventTitle: title,
        videoEventDataType: "image",
        videoEventVisible: true
      });
      setTimeout(() => this.setState({ videoEventSrc: videoEventSrc }), 1000);
    }
    this.setState({
      idVMSForCurrentCamera: idVMS,
      idCurrentCameraModal: idCamera,
      isCamdie: false
    });
  }

  handleUpdateLiveCam(lastData, newVmsCamId, clusterDataID = null) {
    const liveCameraDatas = this.state.liveCameraDatas;
    for (let index = 0; index < liveCameraDatas.length; index++) {
      let liveCameraData = liveCameraDatas[index];
      if (
        liveCameraData.vmsCamId == lastData.vmsCamId &&
        this.filterByClusterIDHandler(liveCameraData, lastData.clusterDataID)
      ) {
        liveCameraDatas[index] = {
          clusterDataID: clusterDataID,
          vmsCamId: newVmsCamId
        };
        break;
      }
    }
    this.setState({
      liveCameraDatas: liveCameraDatas
    });
  }

  closeVideoPopup() {
    this.setState({
      videoEventSrc: loadingIconLarge
    });
    setTimeout(() => this.setState({ videoEventVisible: false }), 200);
  }

  onChangeLayer(layer) {
    if (this.state.currentLayer !== layer) {
      let cameraDataByLayer = this.getCameraDataByLayer(layer);
      this.setState({
        currentLayer: layer,
        cameraDataByLayer: cameraDataByLayer
      });
    }
  }

  playMonitoring() {
    const { isPlaying } = this.state;
    let newPlaying = !isPlaying;
    let playing_mode = newPlaying === true ? "auto" : "manual";
    this.monitoring_options.playing_mode = playing_mode;
    this.encryptHelper.saveToPersistence(
      "monitoring_options",
      this.monitoring_options
    );
    this.setState({
      isPlaying: newPlaying
    });
  }

  showInfo() {
    let date = new Date(this.widget_time_update);
    this.setState({
      infoVisible: true,
      infoTitle: `CameraMonitoring.Beta`,
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
    // console.log(`onError:${e.target.src}:${this.countImgLoadError}`);
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

  onChangeResolution(e) {
    let modeKey = e.target.value;
    let mode = this.resolution_options.find(item => item.key === modeKey);
    this.encryptHelper.saveToPersistence("resolution_mode", mode);
    this.setState({
      resolution_mode: mode
    });
  }

  getLiveURLMonitorByResolutionMode(
    monitor,
    resolution_mode,
    screenMode = "default"
  ) {
    if (monitor == null) return null;
    if (resolution_mode == null) {
      resolution_mode = this.state.resolution_mode;
    }
    let key = resolution_mode.key;
    let url = monitor.Liveview;
    if (["auto"].indexOf(key) >= 0) {
      let auto_resolution_mode = null;
      let modes_order = this.resolution_options_auto_mode_order_switch.default;
      if (
        this.state.isMobileFunction &&
        this.resolution_options_auto_mode_order_switch.mobile
      ) {
        modes_order = this.resolution_options_auto_mode_order_switch.mobile;
      }
      for (let index = 0; index < modes_order.length; index++) {
        if (auto_resolution_mode != null) break;
        auto_resolution_mode = this.resolution_options.find(
          item => item.key == modes_order[index]
        );
      }
      if (auto_resolution_mode == null) {
        auto_resolution_mode = this.default_resolution_mode;
      }
      resolution_mode = auto_resolution_mode;
    }
    let scale =
      typeof screenMode === "string"
        ? resolution_mode.value.scale[screenMode]
        : null;
    if (scale == null) {
      scale = this.state.isMobileFunction
        ? resolution_mode.value.scale.mobile
        : resolution_mode.value.scale.default;
    }
    if (!isNaN(scale) && scale > 0 && scale !== 100) {
      url = url
        ? `${url}${url.indexOf("?") > 0 ? "&" : "?"}scale=${scale}`
        : url;
    }
    return url;
  }

  visibleFormSubmit() {
    this.setState({ showFormSubmit: true });
  }

  invisibleFormSubmit() {
    this.setState({ showFormSubmit: false });
  }

  render() {
    const {
      width,
      height,
      mode,
      videoEventSrc,
      videoEventVisible,
      videoEventTitle,
      videoEventDataType,
      liveCameraDatas,
      treeData,
      currentLayer,
      isPlaying,
      updateNow,
      infoVisible,
      infoTitle,
      infoVersion,
      infoTimeUpdate,
      infoContent,
      isMobileFunction,
      isMobile,
      isLoadedData,
      resolution_mode,
      currentClusterDataID,
      permissionReport,
      showFormSubmit,
      idVMSForCurrentCamera,
      idCurrentCameraModal,
      isCamdie,
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
    const { muiTheme } = this.props;
    return (
      <div>
        <div>
          <TreeSelect
            showSearch
            style={{ width: "250px" }}
            value={this.state.currentLayer}
            dropdownStyle={{ maxHeight: 400, overflow: "auto" }}
            placeholder="Bộ lọc"
            allowClear
            onChange={this.onChangeLayer}
            treeData={treeData}
          />
          <Button
            type="primary"
            title={isPlaying ? "Dừng tự động chạy" : "Bật tự động chạy"}
            onClick={this.playMonitoring}
            style={{ marginLeft: "3px" }}
          >
            <Icon type={isPlaying ? "pause-circle" : "play-circle"} />
          </Button>
          <Button
            type="primary"
            title="Thông tin"
            onClick={this.showInfo}
            style={{ marginLeft: "3px" }}
          >
            <Icon type="info-circle" />
          </Button>
          <div style={{ float: "right" }}>
            <Button
              type="primary"
              title="Trước đó"
              onClick={() =>
                this.addLiveCamIds(this.addMode.PREV, true, 3000, true)
              }
              style={{ marginRight: "3px" }}
            >
              <Icon type="caret-left" />
              Prev
            </Button>
            <Button
              type="primary"
              title="Tiếp theo"
              onClick={() =>
                this.addLiveCamIds(this.addMode.NEXT, true, 3000, true)
              }
            >
              Next
              <Icon type="caret-right" />
            </Button>
          </div>
        </div>
        <ListCameraComponent
          muiTheme={muiTheme}
          mode={mode}
          width={width}
          height={height - 10}
          liveCameraDatas={liveCameraDatas}
          getLiveCameraApi={this.getLiveCameraApi}
          turnOnCameraApi={this.turnOnCameraApi}
          handleLiveCameraClick={this.handleLiveCameraClick}
          handleUpdateLiveCam={this.handleUpdateLiveCam}
          cameraVMSController={this.cameraVMSController}
          filterByClusterIDHandler={this.filterByClusterIDHandler}
          cameraDataByLayer={cameraDataByLayer}
          updateNow={updateNow}
          numberListCameraDisplay={this.numberListCameraDisplay}
          isMobileFunction={isMobileFunction}
          isMobile={isMobile}
          isLoadedData={isLoadedData}
          resolution_mode={resolution_mode}
          getLiveURLMonitorByResolutionMode={
            this.getLiveURLMonitorByResolutionMode
          }
        />

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
          <div style={{ paddingTop: 15 }}>
            <p>
              <b>Độ phân giải</b>
            </p>
            <Radio.Group
              defaultValue={
                resolution_mode
                  ? resolution_mode.key
                  : this.resolution_options.length > 0
                  ? this.resolution_options[0].key
                  : "auto"
              }
              size="small"
              onChange={this.onChangeResolution}
            >
              {this.resolution_options.map((item, index) => (
                <Radio.Button value={item.key} key={index}>
                  {item.titles[this.language]}
                </Radio.Button>
              ))}
            </Radio.Group>
          </div>
        </Modal>

        <Modal
          title={videoEventTitle}
          width={
            ((height + 30) * 1280) / 720 < width
              ? ((height + 30) * 1280) / 720
              : width
          }
          visible={videoEventVisible}
          footer={null}
          destroyOnClose={true}
          style={{ top: "0px" }}
          zIndex={1500}
          bodyStyle={{ padding: "0px" }}
          onCancel={this.closeVideoPopup}
        >
          <Icon
            type="flag"
            theme="filled"
            style={
              permissionReport
                ? {
                    color: "#000000",
                    fontSize: "22px",
                    float: "right",
                    marginTop: "-23px",
                    marginRight: "15px"
                  }
                : {
                    display: "none"
                  }
            }
            onClick={this.visibleFormSubmit}
          />
          {videoEventDataType == "image" ? (
            <img
              src={videoEventSrc}
              style={{ width: "100%" }}
              onLoad={e => {
                this.onImgLoad(e);
              }}
              onError={e => {
                this.onImgError(e);
              }}
              // onError={(e) => { e.target.onerror = null; e.target.src = disconnectLarge }}
            />
          ) : (
            <div>
              {videoEventSrc ? (
                <video
                  src={videoEventSrc}
                  style={{ width: "100%" }}
                  autoPlay={true}
                  controls
                >
                  Your browser does not support the video tag
                </video>
              ) : (
                <span>Không thể xem, vui lòng kiểm tra lại đường truyền</span>
              )}
            </div>
          )}
        </Modal>
        <FormSubmitStatusCamera
          zIndex={1501}
          showSubmitForm={showFormSubmit}
          closeSubmitForm={this.invisibleFormSubmit}
          vmsID={idVMSForCurrentCamera}
          idCamera={idCurrentCameraModal}
          isCamdie={isCamdie}
          defineConditionCamera={defineConditionCamera}
          defineConditionNotGoodCamera={defineConditionNotGoodCamera}
          cameraVMSController={this.cameraVMSController}
        />
      </div>
    );
  }
}

export default CameraMonitoring;
