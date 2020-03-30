import React, { Component } from 'react';
import Grid from '@material-ui/core/Grid';
import SelectCameraComponent from './SelectCameraComponent';
import disconnect from './resources/image/disconnect.png';
import loadingIcon from './resources/image/loading.gif';
import dataloading from './resources/image/dataloading.gif';

class CameraComponent extends Component {

    constructor(props) {
        super(props);

        this.state = {
            liveCamSrc: '',
            liveCamName: '',
            fetchError: false,
            lastCamData: null
        };

        this.fetchCamData = this.fetchCamData.bind(this);
        this.handleClickClose = this.handleClickClose.bind(this);
        this.handleFilterCameraId = this.handleFilterCameraId.bind(this);
        this.onError = this.onError.bind(this);
        this.onLoad = this.onLoad.bind(this);
        this.clearWaitingProcess = this.clearWaitingProcess.bind(this);
        this.handleLiveCameraClick = this.handleLiveCameraClick.bind(this);
        this.clearScheduleProcess = this.clearScheduleProcess.bind(this);
        this.intervalValues = [];
        this.timeoutValues = [];
        this.intervalCount = 1;
        this.srcLoaded = null;
        this.coutError = 0;

        this.srcSet = null;
        this.titleSet = null;
        this.srcLoaded = null;
        this.timeStartShowLoading = -1;

        this.intervalValues.push(setInterval(() => {
            let {srcSet, titleSet, srcLoaded, timeStartShowLoading} = this;//.state;
            if (++this.intervalCount > 1000) {
                this.intervalCount = 1;
            }
            if (timeStartShowLoading < 0) return;
            let now = new Date().getTime();
            if ((now - timeStartShowLoading) > 60000 && (srcLoaded === loadingIcon)) {//} disconnect)) {
                console.log(`Update:${titleSet}:${timeStartShowLoading}`);
                this.timeStartShowLoading = -1;
                this.setState({ liveCamSrc: disconnect });
                return;
            }
            if (this.intervalCount % 10 === 0
                && (srcLoaded === null || srcLoaded === loadingIcon || (this.intervalCount % 30 && srcLoaded === disconnect))) {
                console.log(`ReUpdate:${titleSet}:${timeStartShowLoading}:${this.intervalCount}`);
                this.setState({ liveCamSrc: loadingIcon });
                setTimeout(() => this.setState({ liveCamSrc: srcSet }), 100);
                return;
            }
        }, 1000));
    }

    componentDidMount() {
        const { liveCamData, filterByClusterIDHandler, cameraDataByLayer} = this.props;
        const {clusterDataID, vmsCamId} = liveCamData;
        const liveCameraData = cameraDataByLayer.find((camera) => camera.vmsCamId === vmsCamId && filterByClusterIDHandler(camera, clusterDataID));
        this.fetchCamData(liveCameraData);
    }

    componentDidUpdate(prevProps, prevState) {
        const { liveCamData, filterByClusterIDHandler, cameraDataByLayer, resolution_mode} = this.props;
        if (liveCamData != prevProps.liveCamData || resolution_mode.key != prevProps.resolution_mode.key) {
            this.clearScheduleProcess();
            const {clusterDataID, vmsCamId} = liveCamData;
            const liveCameraData = cameraDataByLayer.find((camera) => camera.vmsCamId === vmsCamId && filterByClusterIDHandler(camera, clusterDataID));
            this.fetchCamData(liveCameraData);
        }
    }

    componentWillUnmount() {
        this.clearWaitingProcess();
        this.setState({ liveCamSrc: loadingIcon });
        this.coutError = 0;
    }

    fetchCamData(camera) {
        this.liveCameraData = camera;
        if (!camera) return;
        const { cameraVMSController, updateNow, resolution_mode, getLiveURLMonitorByResolutionMode} = this.props;
        const {srcLoaded} = this;
        console.log(`fetchCamData:${updateNow}`);
        const title = camera.name;
        let liveCamSrc = getLiveURLMonitorByResolutionMode(camera, resolution_mode, "default");
        const now = new Date().getTime();
        this.srcSet = liveCamSrc;
        if (updateNow || srcLoaded == null) {
            this.titleSet = title;
            this.setState({ liveCamSrc: loadingIcon, liveCamName: this.titleSet});
        }
        if (liveCamSrc == null || liveCamSrc.length === "") {
            this.setState({fetchError: true});
        } else if (camera.level === 2 && cameraVMSController != null) {
            if (camera.timeCallTurnOn == null || (now - camera.timeCallTurnOn) > 10000) {
                cameraVMSController.turnOnCameraToVMS(camera.clusterDataID, camera.vmsCamId)
                    .then(resp => {}).catch(error => {})
                    .then(() => {
                        camera.timeCallTurnOn = new Date().getTime();
                        this.timeoutValues.push(setTimeout(() => {
                            this.setState({ liveCamSrc: this.srcSet })
                        }, 2000));
                    });
            } else {
                this.timeoutValues.push(setTimeout(() => {
                    this.setState({ liveCamSrc: this.srcSet })
                }, 1000));
            }
        } else {
            this.timeoutValues.push(setTimeout(() => {
                this.setState({ liveCamSrc: this.srcSet });
            }, updateNow ? 100 : 0));
        }
        this.coutError = 0;
    }

    handleClickClose() {
        const { liveCamData } = this.props;
        const { lastCamData } = this.state;
        if (lastCamData) {
            this.setState({ lastCamData: null });
        } else {
            this.setState({ lastCamData: liveCamData });
        }
    }

    handleFilterCameraId(camera) {
        const { handleUpdateLiveCam, liveCamData} = this.props;
        const { lastCamData } = this.state;
        handleUpdateLiveCam(lastCamData, camera.vmsCamId, camera.clusterDataID);
        this.setState({ lastCamData: null });
    }

    onError(e) {
        this.coutError++;
        console.log(`onError:${e.target.src}:${this.coutError}`);
        e.target.src =  this.coutError >= 7 ? disconnect : loadingIcon;
    }

    onLoad(e) {
        const {titleSet, srcSet, timeStartShowLoading} = this;//.state;
        let src = e.target.src;
        let isDoned = src != null && src !== loadingIcon && src !== disconnect;
        this.coutError = isDoned ? 0 : this.coutError;
        let newtimeStartShowLoading =  isDoned ? -1 : timeStartShowLoading >= 0 ? timeStartShowLoading : new Date().getTime();
        this.srcLoaded = src;
        this.timeStartShowLoading = newtimeStartShowLoading;
        this.setState({ liveCamName: titleSet });
        console.log(`onLoad:${isDoned}:${titleSet}:${timeStartShowLoading}:${srcSet == null ? null : srcSet.length}:${src == null ? null : src.length}`);
    }

    clearWaitingProcess() {
        this.intervalValues.forEach(item => clearInterval(item));
        this.intervalValues = [];
    }

    clearScheduleProcess() {
        this.timeoutValues.forEach(item => clearTimeout(item));
        this.timeoutValues = [];
    }

    handleLiveCameraClick(liveCamSrc, liveCamName) {
        const { resolution_mode, getLiveURLMonitorByResolutionMode} = this.props;
        let srcCamera = this.srcSet ? this.srcSet : this.state.liveCamSrc;
        if (this.liveCameraData) {
            srcCamera = getLiveURLMonitorByResolutionMode(this.liveCameraData, resolution_mode, "max");
        }
        this.props.handleLiveCameraClick(srcCamera, this.titleSet ? this.titleSet :this.state.liveCamName);
        // this.props.handleLiveCameraClick(liveCamSrc, liveCamName);
    }

    render() {
        const { mode, liveCamData, height, muiTheme, filterByClusterIDHandler,
            cameraDataByLayer, numberListCameraDisplay } = this.props;
        const {clusterDataID, vmsCamId} = liveCamData;
        const { liveCamSrc, liveCamName, fetchError, lastCamData } = this.state;
        const isClosed = lastCamData != null && lastCamData.vmsCamId == vmsCamId && filterByClusterIDHandler(lastCamData, clusterDataID);

        return (
            <Grid item xs={12 / mode} style={{ height: height, position: "relative" }}>
                <div style={{ position: 'absolute', right: '0px', fontWeight: 'bold', fontSize: '18px', backgroundColor: 'white', color: 'black'}}>
                    <span>{liveCamName}</span>
                    <a title="Đóng" onClick={this.handleClickClose} style={{ float: 'right', cursor: 'pointer', marginRight: 5, marginLeft: 5 }}>X</a>
                </div>
                {
                    !isClosed
                        ? (
                            !fetchError
                                ? (
                                    <img
                                        src={liveCamSrc}
                                        style={{ width: '100%', height: 'calc(100% - 5px)' }}
                                        onLoad={(e) => { this.onLoad(e) }}
                                        onError={(e) => { this.onError(e) }}
                                        // onClick={() => this.handleLiveCameraClick(this.srcSet ? this.srcSet : liveCamSrc, this.titleSet ? this.titleSet : liveCamName)}
                                        onClick={this.handleLiveCameraClick}
                                    />
                                ) : (
                                    <div style={{
                                        width: '100%', height: '100%', fontSize: '30px',
                                        display: 'flex', justifyContent: 'center', alignItems: 'center',
                                        backgroundColor: '#081922', color: '#ffffff'
                                    }}>
                                        <div>  Mất kết nối đến Camera</div>
                                    </div>
                                )
                        ) : (
                            <div>
                                <SelectCameraComponent
                                    muiTheme={muiTheme}
                                    cameraDataByLayer={cameraDataByLayer}
                                    height={height}
                                    handleFilterCamera={this.handleFilterCameraId}
                                    numberListCameraDisplay={numberListCameraDisplay}
                                />
                            </div>
                        )
                }
            </Grid>
        );
    }
}

class ListCameraComponent extends Component {

    componentWillUnmount() {
        window.stop()
    }

    render() {
        const { height, width, liveCameraDatas, getLiveCameraApi,
            handleLiveCameraClick, handleUpdateLiveCam, mode, turnOnCameraApi, cameraVMSController,
            filterByClusterIDHandler, cameraDataByLayer, updateNow, numberListCameraDisplay,
            isLoadedData,
            resolution_mode, getLiveURLMonitorByResolutionMode
        } = this.props;
        const _height = width > height ? height : (width * width / height + 4);
        return (
            liveCameraDatas.length > 0 ? (
            <Grid container spacing={0} style={{ width: width, height: _height }}>
                {
                    liveCameraDatas.map(liveCamData => {
                        return (
                            <CameraComponent
                                height={_height / mode - 2}
                                mode={mode}
                                liveCamData={liveCamData}
                                cameraDataByLayer={cameraDataByLayer}
                                handleLiveCameraClick={handleLiveCameraClick}
                                handleUpdateLiveCam={handleUpdateLiveCam}
                                getLiveCameraApi={getLiveCameraApi}
                                turnOnCameraApi={turnOnCameraApi}
                                cameraVMSController={cameraVMSController}
                                filterByClusterIDHandler={filterByClusterIDHandler}
                                updateNow={updateNow}
                                numberListCameraDisplay={numberListCameraDisplay}
                                resolution_mode={resolution_mode}
                                getLiveURLMonitorByResolutionMode={getLiveURLMonitorByResolutionMode}
                            />
                        );
                    })
                }
            </Grid> ) :
                (
                    isLoadedData ? <div style={{
                            width: '100%', height: '100%', fontSize: '30px',
                            display: 'flex', justifyContent: 'center', alignItems: 'center',
                            backgroundColor: 'white', color: '#000000'
                        }}>Không có camera</div> :
                    <div style={{
                        width: '100%', height: '100%', fontSize: '30px',
                        display: 'flex', justifyContent: 'center', alignItems: 'center',
                        backgroundColor: 'white', color: '#777777'
                    }}>
                        <img
                            src={dataloading}
                            // style={{ width: '80%', height: 'calc(80% - 5px)' }}
                        />
                    </div>
                )
        )
    }
}

export default ListCameraComponent;
