import { Component } from "react";
import React from "react";
import loadingIcon from "./resources/icons/loading.gif";
import connectingIcon from "./resources/icons/connecting.gif";
import disconnect from "./resources/icons/disconnect.png";

class CameraComponent extends Component {
  constructor(props) {
    super(props);

    this.state = {
      liveCamSrc: "",
      liveCamName: "",
      idLiveCamera: "",
      fetchError: false
    };

    this.fetchCamUrl = this.fetchCamUrl.bind(this);
    this.handleRemoveLiveCam = this.handleRemoveLiveCam.bind(this);
    this.clearScheduleProcess = this.clearScheduleProcess.bind(this);
    this.clearWaitingProcess = this.clearWaitingProcess.bind(this);
    this.onLoad = this.onLoad.bind(this);
    this.onError = this.onError.bind(this);

    this.intervalValues = [];
    this.timeoutValues = [];
    this.intervalCount = 1;
    this.srcLoaded = null;

    this.coutError = 0;

    this.srcSet = null;
    this.titleSet = null;
    this.idCameraSet = null;
    this.srcLoaded = null;
    this.timeStartShowLoading = -1;

    this.intervalValues.push(
      setInterval(() => {
        let { srcSet, titleSet, srcLoaded, timeStartShowLoading } = this; //.state;
        if (++this.intervalCount > 1000) {
          this.intervalCount = 1;
        }
        if (timeStartShowLoading < 0) return;
        let now = new Date().getTime();
        if (now - timeStartShowLoading > 60000 && srcLoaded === loadingIcon) {
          //} disconnect)) {
          console.log(`Update:${titleSet}:${timeStartShowLoading}`);
          this.timeStartShowLoading = -1;
          this.setState({ liveCamSrc: disconnect });
          return;
        }
        if (
          this.intervalCount % 10 === 0 &&
          (srcLoaded === null ||
            srcLoaded === loadingIcon ||
            (this.intervalCount % 30 && srcLoaded === disconnect))
        ) {
          console.log(
            `ReUpdate:${titleSet}:${timeStartShowLoading}:${this.intervalCount}`
          );
          this.setState({ liveCamSrc: loadingIcon });
          setTimeout(() => this.setState({ liveCamSrc: srcSet }), 100);
          return;
        }
      }, 1000)
    );
  }

  componentDidMount() {
    const { camera, cameraData, filterByClusterIDHandler } = this.props;
    let clusterDataID = camera.clusterDataID;
    const liveCameraData = cameraData.find(
      cam =>
        cam.vmsCamId === camera.vmsCamId &&
        filterByClusterIDHandler(cam, clusterDataID)
    );
    if (liveCameraData) {
      this.fetchCamUrl(liveCameraData);
    }
  }

  componentDidUpdate(prevProps, prevState) {
    const { camera, cameraData, filterByClusterIDHandler } = this.props;
    const { vmsCamId, clusterDataID } = camera;
    const liveCameraData = cameraData.find(
      cam =>
        cam.vmsCamId === vmsCamId &&
        filterByClusterIDHandler(cam, clusterDataID)
    );
    if (vmsCamId != prevProps.camera.vmsCamId) {
      this.fetchCamUrl(liveCameraData);
    }
  }

  componentWillUnmount() {
    this.clearWaitingProcess();
    this.setState({ liveCamSrc: loadingIcon });
    this.coutError = 0;
  }

  fetchCamUrl2(camera) {
    this.setState({
      liveCamSrc: loadingIcon
    });
    if (camera == null) {
      return this.setState({
        fetchError: true
      });
    }
    const { cameraVMSController } = this.props;
    let liveCamSrc = camera.Liveview;
    if (liveCamSrc == null || liveCamSrc.length === "") {
      return this.setState({
        fetchError: true
      });
    }
    if (camera.level === 2 && cameraVMSController != null) {
      // Trường hợp camera chưa bật thì dùng api bật camera
      cameraVMSController
        .turnOnCameraToVMS(camera.clusterDataID, camera.vmsCamId)
        .then(resp => {})
        .catch(error => {})
        .then(() => {
          setTimeout(() => {
            this.setState({
              liveCamSrc: liveCamSrc
            });
          }, 5000);
        });
    } else {
      this.setState({
        liveCamSrc: liveCamSrc
      });
    }
  }

  fetchCamUrl(camera) {
    this.liveCameraData = camera;
    if (!camera) return;
    const {
      cameraVMSController,
      updateNow,
      isMobile,
      isMobileFunction
    } = this.props;
    const { srcLoaded } = this;
    console.log(`fetchCamData:${updateNow}`);
    const title = camera.name;
    const idCamera = camera.vmsCamId;
    let liveCamSrc = isMobileFunction ? camera.LiveviewSmall : camera.Liveview;
    const now = new Date().getTime();
    this.srcSet = liveCamSrc;
    if (updateNow || srcLoaded == null) {
      this.titleSet = title;
      this.idCameraSet = idCamera;
      this.setState({
        liveCamSrc: loadingIcon,
        liveCamName: this.titleSet,
        idLiveCamera: this.idCameraSet
      });
    }
    if (liveCamSrc == null || liveCamSrc.length === "") {
      this.setState({ fetchError: true });
    } else if (camera.level === 2 && cameraVMSController != null) {
      if (
        camera.timeCallTurnOn == null ||
        now - camera.timeCallTurnOn > 10000
      ) {
        cameraVMSController
          .turnOnCameraToVMS(camera.clusterDataID, camera.vmsCamId)
          .then(resp => {})
          .catch(error => {})
          .then(() => {
            camera.timeCallTurnOn = new Date().getTime();
            this.timeoutValues.push(
              setTimeout(() => {
                this.setState({ liveCamSrc: this.srcSet });
              }, 2000)
            );
          });
      } else {
        this.timeoutValues.push(
          setTimeout(() => {
            this.setState({ liveCamSrc: this.srcSet });
          }, 1000)
        );
      }
    } else {
      this.timeoutValues.push(
        setTimeout(
          () => {
            this.setState({ liveCamSrc: this.srcSet });
          },
          updateNow ? 100 : 0
        )
      );
    }
    this.coutError = 0;
  }

  handleRemoveLiveCam() {
    const { camera, handleRemoveLiveCam } = this.props;
    handleRemoveLiveCam(camera.vmsCamId, camera.clusterDataID);
  }

  onError(e) {
    this.coutError++;
    console.log(`onError:${e.target.src}:${this.coutError}`);
    e.target.src = this.coutError >= 7 ? disconnect : loadingIcon;
  }

  onLoad(e) {
    const { titleSet, srcSet, timeStartShowLoading, idCameraSet } = this; //.state;
    let src = e.target.src;
    let isDoned = src != null && src !== loadingIcon && src !== disconnect;
    this.coutError = isDoned ? 0 : this.coutError;
    this.timeStartShowLoading = isDoned
      ? -1
      : timeStartShowLoading >= 0
      ? timeStartShowLoading
      : new Date().getTime();
    this.srcLoaded = src;
    this.setState({ liveCamName: titleSet, idLiveCamera: idCameraSet });
    console.log(
      `onLoad:${isDoned}:${titleSet}:${timeStartShowLoading}:${
        srcSet == null ? null : srcSet.length
      }:${src == null ? null : src.length}`
    );
  }

  clearWaitingProcess() {
    this.intervalValues.forEach(item => clearInterval(item));
    this.intervalValues = [];
  }

  clearScheduleProcess() {
    this.timeoutValues.forEach(item => clearTimeout(item));
    this.timeoutValues = [];
  }

  render() {
    const { height, width } = this.props;
    const { liveCamSrc, liveCamName, fetchError, idLiveCamera } = this.state;
    const { srcSet } = this;
    return (
      <div
        style={{
          height: height,
          textAlign: "center",
          position: "relative",
          borderStyle: "solid",
          borderLeftWidth: "5px",
          borderRightWidth: "5px",
          borderTopWidth: 0,
          borderBottomWidth: 0,
          color: "#ffffff",
          borderColor: "#081922",
          backgroundColor: "#081922"
        }}
      >
        <div style={{ height: "20px" }}>
          {liveCamName}
          <a
            title="Đóng"
            onClick={this.handleRemoveLiveCam}
            style={{
              float: "right",
              cursor: "pointer",
              padding: "2px 5px 0 0"
            }}
          >
            X
          </a>
        </div>
        {!fetchError ? (
          <img
            src={liveCamSrc}
            style={{ maxHeight: height - 30, maxWidth: width }}
            onClick={() =>
              this.props.handleLiveCameraClick(
                srcSet ? srcSet : liveCamSrc,
                liveCamName,
                idLiveCamera
              )
            }
            onLoad={e => {
              this.onLoad(e);
            }}
            onError={e => {
              this.onError(e);
            }}
          />
        ) : (
          <span>Mất kết nối đến Camera</span>
        )}
      </div>
    );
  }
}

class ListCameraComponent extends Component {
  render() {
    const {
      height,
      width,
      liveCamera,
      cameraData,
      handleLiveCameraClick,
      handleRemoveLiveCam,
      cameraVMSController,
      filterByClusterIDHandler,
      isMobile,
      isMobileFunction
    } = this.props;
    return (
      <div
        className={"row"}
        style={{
          justifyContent: "center",
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          height: "100%",
          margin: 0
        }}
      >
        {liveCamera.map(liveCam => {
          return (
            <CameraComponent
              width={width}
              height={height}
              camera={liveCam}
              cameraData={cameraData}
              handleLiveCameraClick={handleLiveCameraClick}
              handleRemoveLiveCam={handleRemoveLiveCam}
              cameraVMSController={cameraVMSController}
              filterByClusterIDHandler={filterByClusterIDHandler}
              updateNow={true}
              isMobileFunction={isMobileFunction}
              isMobile={isMobile}
            />
          );
        })}
      </div>
    );
  }
}

export default ListCameraComponent;
