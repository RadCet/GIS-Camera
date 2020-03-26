import {Component} from 'react';

import cameraIcon0 from './resources/icons/statisicon/0.png';
import cameraIcon1 from './resources/icons/statisicon/1.png';
import cameraIcon2 from './resources/icons/statisicon/2.png';
import cameraIcon3 from './resources/icons/statisicon/3.png';
import cameraIcon4 from './resources/icons/statisicon/4.gif';
import cameraIcon5 from './resources/icons/statisicon/5.png';
import cameraIcon6 from './resources/icons/statisicon/6.png';
import cameraIcon7 from './resources/icons/statisicon/7.png';

export const StatisData ={
    ALL:   { title: "Tổng số Camera", color: "#0abf71", icon: cameraIcon1 },
    UNBROKEN:  { title: "Camera đang hoạt động", color: "#0abf71", icon: cameraIcon1 },
    ACTIVE: { title: "Có lưu trữ TTĐH", color: "#0abf71", icon: cameraIcon1},
    UNACTIVE: { title: "Không lưu trữ TTĐH", color: "#2dc0d2", icon: cameraIcon2 },
    BROKEN: { title: "Camera không hoạt động", color: "#ec1c23", icon: cameraIcon0 },
    AI: { title: "Camera phân tích AI", color: "#0abf71", icon: cameraIcon3 },
    EVENT5P: { title: "Mới có sự kiện", color: "#ec1c23", icon: cameraIcon4 },
    EVENT24H: { title: "Có sự kiện trong ngày", color: "#ff7708", icon: cameraIcon5 },
    SOCIAL: { title: "Camera xã hội hóa", color: "#751f13", icon: cameraIcon6 },
    UNDONE: { title: "Chưa lấy về", color: "#777777", icon: cameraIcon7 },
    VMS:  { title: "Danh sách VMS", color: "#0abf71", icon: cameraIcon1 },
};

class CameraStatusCounting extends Component {
    constructor(props) {
        super(props);

        this.state = {
            camAll: 0,
            camUnbroken: 0,
            camActive: 0,
            camUnactive: 0,
            camBroken: 0,
            camAI: 0,
            camAI5pEvent: 0,
            camAI24hpEvent: 0,
            camSocial: 0,
            sumCamSocial: 0,
            sumUnDone: 0,
            ignoreVMSIDs: [],
            countVMS:[]
        };
        this.onCount = this.onCount.bind(this);
    }

    componentDidUpdate(prevProps) {
        const {currentLayer, status, cameraDataByLayer} = this.props;
        if(prevProps.currentLayer != currentLayer || prevProps.cameraDataByLayer != cameraDataByLayer || (status != null && status.isNeedUpdate)) {
            status.isNeedUpdate = false;
            this.onCount();
        }
    }

    onCount() {
        const {cameraDataByLayer, cameraVMSController, showVMSCountIgnoreDefault} = this.props;
        const listVMS = cameraVMSController == null ? [] : cameraVMSController.vmsManager.getListVMS();
        const countVMS = listVMS.reduce((output, vms, index) => {
            output[vms.id] = 0;// vms.getValue("monitors").length;
            return output;
        }, {});
        let ignoreVMSIDs = [];
        if (showVMSCountIgnoreDefault) {
            let clusterDataIDDefault = cameraVMSController == null ? null : cameraVMSController.vmsManager == null ? null : cameraVMSController.vmsManager.getDefaultID();
            if (clusterDataIDDefault != null) ignoreVMSIDs.push(clusterDataIDDefault);
        }
        // let _camBroken = cameraDataByLayer.filter((item) => item.level === 0).length;
        // let _camActive = cameraDataByLayer.filter((item) => item.level === 1).length;
        // let _camUnactive = cameraDataByLayer.filter((item) => item.level === 2).length;
        // let _camUnbroken = _camActive + _camUnactive;
        // let _camAINoEvent = cameraDataByLayer.filter((item) => item.ailevel === 3).length;
        // let _camAI5pEvent = cameraDataByLayer.filter((item) => item.ailevel === 4).length;
        // let _camAI24hEvent = cameraDataByLayer.filter((item) => item.ailevel === 5 || item.ailevel === 4).length;
        //
        // let _camSocial = 0;
        // const _sumCamSocial = cameraDataByLayer
        //     .filter((item) => item.glevel === 6)
        //     .reduce((output, item, index) => {
        //         _camSocial++;
        //         if (typeof(item.numberChilds) === "number") {
        //             output += item.numberChilds;
        //         }
        //     return output;
        // }, 0);
        // let _camAI = _camAINoEvent + _camAI24hEvent;// + _camAI5pEvent;
        //
        // let _camAll = _camBroken + _camUnbroken + _sumCamSocial;// - _camSocial;

//-----------------------------
        let _camBroken = 0;
        let _camActive = 0;
        let _camUnactive = 0;
        let _camAINoEvent = 0;
        let _camAI5pEvent = 0;
        let _camAI24hEvent = 0;
        let _camSocial = 0;
        let _sumCamSocial = 0;
        let _camUnDone = 0;

        cameraDataByLayer.forEach(item => {
            const {level, glevel, ailevel, clusterDataID} = item;
            let numberChilds = 1;
            if (level === 0) {
                _camBroken++;
            } else if (level === 1) {
                _camActive++;
            } else if (level === 2) {
                _camUnactive++;
            }
            if (ailevel === 3) {
                _camAINoEvent++;
            } else if (ailevel === 4) {
                _camAI5pEvent++;
                _camAI24hEvent++;
            } else if (ailevel === 5) {
                _camAI24hEvent++;
            } else if (ailevel === 9) {
                _camAINoEvent++;
            } else if (ailevel === 10) {
                _camAINoEvent++;
            }
            if (glevel === 6) {
                _camSocial++;
                if (typeof(item.numberChilds) === "number") {
                    numberChilds = item.numberChilds;
                    _sumCamSocial += numberChilds;
                }
            }
            if (glevel === 7) {
                _camUnDone++;
            }
            if (clusterDataID != null) {
                if (!countVMS[clusterDataID]) countVMS[clusterDataID] = 0;
                countVMS[clusterDataID]+=numberChilds;
            }
        });
        let _camUnbroken = _camActive + _camUnactive;
        let _camAI = _camAINoEvent + _camAI24hEvent;// + _camAI5pEvent;
        let _camAll = _camBroken + _camUnbroken + _sumCamSocial;// + _camUnDone;// - _camSocial;

        this.setState({
            camAll: _camAll,
            camUnbroken: _camUnbroken,
            camActive: _camActive,
            camUnactive: _camUnactive,
            camBroken: _camBroken,
            camAI: _camAI,
            camAI5pEvent: _camAI5pEvent,
            camAI24hpEvent: _camAI24hEvent,
            camSocial: _camSocial,
            sumCamSocial: _sumCamSocial,
            countVMS: countVMS,
            ignoreVMSIDs:ignoreVMSIDs,
            cameUnDone:_camUnDone
        });
    }

    render() {
        // TODO distinct cam
        const {handleFilter, currentFilter, va_support, cameraVMSController,
            socialization_support, currentClusterDataID,
            showVMSCountInList, showVMSCountInListInTop, showVMSCountInListInBottom,
            camera_undone_support
        } = this.props;
        const {ignoreVMSIDs, countVMS, camAll, camUnbroken, camActive, camUnactive, camBroken, camAI, camAI5pEvent, camAI24hpEvent, camSocial, sumCamSocial, cameUnDone} = this.state;
        const boldStyle = {fontWeight: 'bold'};
        return (
            <div style={{fontSize: '15px'}}>
                <div style={{marginBottom: '8px', cursor: 'pointer'}} onClick={()=>handleFilter(StatisData.ALL, currentClusterDataID)}>
                    <img src={StatisData.ALL.icon} style={{width: '25px'}} />
                    <span style={currentFilter==StatisData.ALL? boldStyle: {}}>&nbsp;{StatisData.ALL.title}</span>
                    <span style={{float: 'right', color: StatisData.ALL.color, paddingRight: '10px', fontWeight: 'bold'}}>&nbsp;{camAll}&nbsp;</span>
                </div>
                <div style={{paddingLeft: 23}}>
                    {((showVMSCountInList == false || showVMSCountInListInTop == false || cameraVMSController == null || cameraVMSController.applyMultipleVMS == false || cameraVMSController.vmsManager.getListVMS().length <= 1) ? [] : cameraVMSController.vmsManager.getListVMS())
                        .filter((vms, index) => vms.id != null && ignoreVMSIDs.indexOf(vms.id) < 0)
                        .map((vms, index) => {
                        return  <div style={{marginBottom: '8px', cursor: 'pointer'}} onClick={()=>handleFilter(currentFilter, vms.id)}>
                            <img src={StatisData.VMS.icon} style={{width: '25px'}} />
                            <span style={currentClusterDataID==vms.id ? boldStyle : {}}>&nbsp;{vms.Name}</span>
                            <span style={{float: 'right', color: StatisData.VMS.color, paddingRight: '10px', fontWeight: 'bold'}}>&nbsp;{countVMS[vms.id]}&nbsp;</span>
                        </div>
                    })}
                    <div style={{marginBottom: '8px', cursor: 'pointer'}} onClick={()=>handleFilter(StatisData.UNBROKEN, currentClusterDataID)}>
                        <img src={StatisData.UNBROKEN.icon} style={{width: '25px'}} />
                        <span style={currentFilter==StatisData.UNBROKEN? boldStyle: {}}>&nbsp;{StatisData.UNBROKEN.title}</span>
                        <span style={{float: 'right', color: StatisData.UNBROKEN.color, paddingRight: '10px', fontWeight: 'bold'}}>&nbsp;{camUnbroken}&nbsp;</span>
                    </div>
                    <div style={{paddingLeft: 23}}>
                        <div style={{marginBottom: '8px', cursor: 'pointer'}} onClick={()=>handleFilter(StatisData.ACTIVE, currentClusterDataID)}>
                            <img src={StatisData.ACTIVE.icon} style={{width: '25px'}}/>
                            <span style={currentFilter == StatisData.ACTIVE ? boldStyle : {}}>&nbsp;{StatisData.ACTIVE.title}</span>
                            <span style={{float: 'right', color: StatisData.ACTIVE.color, paddingRight: '10px', fontWeight: 'bold'}}>&nbsp;{camActive}&nbsp;</span>
                        </div>
                        <div style={{marginBottom: '8px', cursor: 'pointer'}} onClick={() => handleFilter(StatisData.UNACTIVE, currentClusterDataID)}>
                            <img src={StatisData.UNACTIVE.icon} style={{width: '25px'}}/>
                            <span style={currentFilter == StatisData.UNACTIVE ? boldStyle : {}}>&nbsp;{StatisData.UNACTIVE.title}</span>
                            <span style={{float: 'right', color: StatisData.UNACTIVE.color, paddingRight: '10px', fontWeight: 'bold'}}>&nbsp;{camUnactive}&nbsp;</span>
                        </div>
                    </div>
                    <div style={{marginBottom: '8px', cursor: 'pointer'}} onClick={()=>handleFilter(StatisData.BROKEN, currentClusterDataID)}>
                        <img src={StatisData.BROKEN.icon} style={{width: '25px'}} />
                        <span style={currentFilter==StatisData.BROKEN? boldStyle: {}}>&nbsp;{StatisData.BROKEN.title}</span>
                        <span style={{float: 'right', color: StatisData.BROKEN.color, paddingRight: '10px', fontWeight: 'bold'}}>&nbsp;{camBroken}&nbsp;</span>
                    </div>
                    {
                        (va_support == true ?
                            <div style={{marginBottom: '8px', cursor: 'pointer'}} onClick={()=>handleFilter(StatisData.AI, currentClusterDataID)}>
                                <img src={StatisData.AI.icon} style={{width: '25px'}} />
                                <span style={currentFilter==StatisData.AI? boldStyle: {}}>&nbsp;{StatisData.AI.title}</span>
                                <span style={{float: 'right', color: StatisData.AI.color, paddingRight: '10px', fontWeight: 'bold'}}>&nbsp;{camAI}&nbsp;</span>
                            </div>
                            :
                            <div></div>)
                    }
                    {
                        (va_support == true ?
                            <div style={{paddingLeft: 23}}>
                                <div style={{marginBottom: '8px', cursor: 'pointer'}} onClick={()=>handleFilter(StatisData.EVENT24H, currentClusterDataID)}>
                                    <img src={StatisData.EVENT24H.icon} style={{width: '25px'}} />
                                    <span style={currentFilter==StatisData.EVENT24H? boldStyle: {}}>&nbsp;{StatisData.EVENT24H.title}</span>
                                    <span style={{float: 'right', color: StatisData.EVENT24H.color, paddingRight: '10px', fontWeight: 'bold'}}>&nbsp;{camAI24hpEvent}&nbsp;</span>
                                </div>
                                <div style={{marginBottom: '8px', cursor: 'pointer'}} onClick={()=>handleFilter(StatisData.EVENT5P, currentClusterDataID)}>
                                    <img src={StatisData.EVENT5P.icon} style={{width: '25px'}} />
                                    <span style={currentFilter==StatisData.EVENT5P? boldStyle: {}}>&nbsp;{StatisData.EVENT5P.title}</span>
                                    <span style={{float: 'right', color: StatisData.EVENT5P.color, paddingRight: '10px', fontWeight: 'bold'}}>&nbsp;{camAI5pEvent}&nbsp;</span>
                                </div>
                            </div>
                            :
                            <div></div>)
                    }
                    {
                        (cameUnDone > 0 && camera_undone_support) ?
                            <div style={{marginBottom: '8px', cursor: 'pointer'}} onClick={()=>handleFilter(StatisData.UNDONE, currentClusterDataID)}>
                                <img src={StatisData.UNDONE.icon} style={{width: '25px'}} />
                                <span style={currentFilter==StatisData.UNDONE? boldStyle: {}}>&nbsp;{StatisData.UNDONE.title}</span>
                                <span style={{float: 'right', color: StatisData.UNDONE.color, paddingRight: '10px', fontWeight: 'bold'}}>&nbsp;{cameUnDone}&nbsp;</span>
                            </div>
                            :
                            <div></div>
                    }
                    {
                        (sumCamSocial > 0 && socialization_support) ?
                            <div style={{marginBottom: '8px', cursor: 'pointer'}} onClick={()=>handleFilter(StatisData.SOCIAL, currentClusterDataID)}>
                                <img src={StatisData.SOCIAL.icon} style={{width: '25px'}} />
                                <span style={currentFilter==StatisData.SOCIAL? boldStyle: {}}>&nbsp;{StatisData.SOCIAL.title}</span>
                                <span style={{float: 'right', color: StatisData.SOCIAL.color, paddingRight: '10px', fontWeight: 'bold'}}>&nbsp;{sumCamSocial}&nbsp;</span>
                            </div>
                            :
                            <div></div>
                    }
                    {((showVMSCountInList == false || showVMSCountInListInBottom == false || cameraVMSController == null || cameraVMSController.applyMultipleVMS == false || cameraVMSController.vmsManager.getListVMS().length <= 1) ? [] : cameraVMSController.vmsManager.getListVMS())
                        .filter((vms, index) => vms.id != null && ignoreVMSIDs.indexOf(vms.id) < 0)
                        .map((vms, index) => {
                        return  <div style={{marginBottom: '8px', cursor: 'pointer'}} onClick={()=>handleFilter(currentFilter, vms.id)}>
                            <img src={StatisData.VMS.icon} style={{width: '25px'}} />
                            <span style={currentClusterDataID==vms.id ? boldStyle : {}}>&nbsp;{vms.Name}</span>
                            <span style={{float: 'right', color: StatisData.VMS.color, paddingRight: '10px', fontWeight: 'bold'}}>&nbsp;{countVMS[vms.id]}&nbsp;</span>
                        </div>
                    })}
                </div>
            </div>
        );
    }
}

export default CameraStatusCounting;
