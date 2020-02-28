import { Component } from 'react';
import React from "react";
import loadingIcon from "./resources/icons/loading.gif";
import connectingIcon from "./resources/icons/connecting.gif";
import disconnect from './resources/icons/disconnect.png';

class CameraComponent extends Component {

    constructor(props) {
        super(props);

        this.state = {
            liveCamSrc: '',
            liveCamName: '',
            fetchError: false,
        };

        this.fetchCamUrl = this.fetchCamUrl.bind(this);
        this.handleRemoveLiveCam = this.handleRemoveLiveCam.bind(this);
    }

    componentDidMount() {
        const { camera, cameraData, filterByClusterIDHandler } = this.props;
        let clusterDataID = camera.clusterDataID;
        const liveCameraData = cameraData.find((cam) => cam.vmsCamId === camera.vmsCamId && filterByClusterIDHandler(cam, clusterDataID));
        if (liveCameraData) {
            this.fetchCamUrl(liveCameraData);
            this.setState({
                liveCamName: liveCameraData.name
            });
        }
    }

    componentDidUpdate(prevProps, prevState) {
        const { camera, cameraData, filterByClusterIDHandler } = this.props;
        let clusterDataID = camera.clusterDataID;
        const liveCameraData = cameraData.find((cam) => cam.vmsCamId === camera.vmsCamId && filterByClusterIDHandler(cam, clusterDataID));
        if (camera.vmsCamId != prevProps.camera.vmsCamId) {
            this.fetchCamUrl(liveCameraData);
        }
        if (liveCameraData && liveCameraData.name != prevState.liveCamName) {
            this.setState({
                liveCamName: liveCameraData.name
            });
        }
    }

    componentWillUnmount() {
    }

    fetchCamUrl(camera) {
        this.setState({
            liveCamSrc: loadingIcon
        });
        if (camera == null) {
            return this.setState({
                fetchError: true,
            });
        }
        const { cameraVMSController } = this.props;
        let liveCamSrc = camera.Liveview;
        if (liveCamSrc == null || liveCamSrc.length === "") {
            return this.setState({
                fetchError: true,
            });
        }
        if (camera.level === 2 && cameraVMSController != null) {// Trường hợp camera chưa bật thì dùng api bật camera
            cameraVMSController.turnOnCameraToVMS(camera.clusterDataID, camera.vmsCamId)
                .then(resp => {
                }).catch(error => {
                }).then(() => {
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

    handleRemoveLiveCam() {
        const { camera, handleRemoveLiveCam } = this.props;
        handleRemoveLiveCam(camera.vmsCamId, camera.clusterDataID);
    }

    render() {
        const { height, width } = this.props;
        const { liveCamSrc, liveCamName, fetchError } = this.state;
        return (
            <div style={{
                height: height, textAlign: 'center', position: 'relative', borderStyle: 'solid',
                borderLeftWidth: '5px',
                borderRightWidth: '5px',
                borderTopWidth: 0,
                borderBottomWidth: 0,
                color: '#ffffff',
                borderColor: '#081922',
                backgroundColor: '#081922'
            }}>
                <div style={{ height: '20px' }}>{liveCamName}
                    <a title="Đóng" onClick={this.handleRemoveLiveCam} style={{ float: 'right', cursor: 'pointer', padding: '2px 5px 0 0' }}>X</a>
                </div>
                {
                    !fetchError ?
                        <img
                            src={liveCamSrc}
                            style={{ maxHeight: height - 30, maxWidth: width }}
                            onClick={() => this.props.handleLiveCameraClick(liveCamSrc, liveCamName)}
                            onError={(e) => { e.target.onerror = null; e.target.src = disconnect }}
                        />
                        : <span>Mất kết nối đến Camera</span>
                }
            </div>
        );
    }
}

class ListCameraComponent extends Component {
    render() {
        const { height, width, liveCamera, cameraData, handleLiveCameraClick, handleRemoveLiveCam,
            cameraVMSController, filterByClusterIDHandler } = this.props;
        return (
            <div className={'row'} style={{ justifyContent: 'center', display: 'flex', flexDirection: 'row', alignItems: 'center', height: '100%', margin: 0 }}>
                {
                    liveCamera.map(liveCam => {
                        return <CameraComponent
                            width={width}
                            height={height}
                            camera={liveCam}
                            cameraData={cameraData}
                            handleLiveCameraClick={handleLiveCameraClick}
                            handleRemoveLiveCam={handleRemoveLiveCam}
                            cameraVMSController = {cameraVMSController}
                            filterByClusterIDHandler={filterByClusterIDHandler}
                        />
                    })
                }
            </div>
        )
    }
}

export default ListCameraComponent;
