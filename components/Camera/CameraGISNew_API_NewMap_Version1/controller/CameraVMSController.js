// const EncryptHelper = require('./Helper').EncryptHelper;
// const VMSManager = require('./VMS').VMSManager;
// const VMSController = require('./VMS').VMSController;
// const defaultPersistentHandler = require('./PersistentHelper').cookiePersistentHandler;
import  {VMSManager, VMSController} from './VMS';
import {localStoragePersistentHandler as defaultPersistentHandler} from './PersistentHelper'
import {EncryptHelper} from './Helper';

class CameraVMSController {

    constructor(configs, updateCamerasHandler, newTokenUpdateHandler = null) {
        this.configs = configs;
        this.updateCamerasHandler = updateCamerasHandler;
        this.newTokenUpdateHandler = newTokenUpdateHandler;

        this.vms_multi_cluster_config = this.configs.vms_multi_cluster_config;
        if (this.vms_multi_cluster_config == null) {
            this.vms_multi_cluster_config = {
                isSupported: false,
                isConnectDirectToCluster: false
            }
        }
        this.vms_authentication_config = this.configs.vms_authentication_config;
        if (this.vms_authentication_config == null) {
            this.vms_authentication_config = {authentication_without_token: false};
        }
        this.applyMultipleVMS = this.vms_multi_cluster_config.isSupported;
        this.isConnectDirectToCluster = this.vms_multi_cluster_config.isConnectDirectToCluster;
        this.isSupportGetTreeData = this.configs.vms_support_get_tree_data;
        this.applyWithoutToken = this.vms_authentication_config.authentication_without_token;
        const {vms_protocol, vms_domain, vms_port, vms_username_default, vms_password_default} = this.configs;
        const {vms_login_api_template, vms_update_token_api_template} = this.configs;
        const {vms_monitors_api_template, vms_groups_api_template, vms_monitors_groups_api_template,
            vms_users_groups_api_template, vms_turn_on_camera_api_template, vms_get_live_camera_api_template, vms_get_tree_data_api_template} = this.applyMultipleVMS ? this.vms_multi_cluster_config : this.configs;
        const {vms_get_targets_api_template} = this.vms_multi_cluster_config;

        this.cameraUpdateIntervalValue = this.configs.cameraUpdateIntervalValue;

        this.vms_login_api_template = vms_login_api_template;
        this.vms_update_token_api_template = vms_update_token_api_template;
        this.vms_monitors_api_template = vms_monitors_api_template;
        this.vms_groups_api_template = vms_groups_api_template;
        this.vms_monitors_groups_api_template = vms_monitors_groups_api_template;
        this.vms_users_groups_api_template = vms_users_groups_api_template;
        this.vms_turn_on_camera_api_template = vms_turn_on_camera_api_template;
        this.vms_get_targets_api_template = vms_get_targets_api_template;
        this.vms_get_tree_data_api_template = vms_get_tree_data_api_template;
        this.vms_get_live_camera_api_template = vms_get_live_camera_api_template;

        this.vms_login_api = vms_login_api_template.replace("{vms_protocol}", vms_protocol).replace("{vms_domain}", vms_domain).replace("{vms_port}", vms_port);
        this.vms_update_token_api = vms_update_token_api_template.replace("{vms_protocol}", vms_protocol).replace("{vms_domain}", vms_domain).replace("{vms_port}", vms_port);
        this.vms_monitors_api = vms_monitors_api_template.replace("{vms_protocol}", vms_protocol).replace("{vms_domain}", vms_domain).replace("{vms_port}", vms_port);
        this.vms_groups_api = vms_groups_api_template.replace("{vms_protocol}", vms_protocol).replace("{vms_domain}", vms_domain).replace("{vms_port}", vms_port);
        this.vms_monitors_groups_api = vms_monitors_groups_api_template.replace("{vms_protocol}", vms_protocol).replace("{vms_domain}", vms_domain).replace("{vms_port}", vms_port);
        this.vms_users_groups_api = vms_users_groups_api_template.replace("{vms_protocol}", vms_protocol).replace("{vms_domain}", vms_domain).replace("{vms_port}", vms_port);
        this.vms_get_targets_api = vms_get_targets_api_template.replace("{vms_protocol}", vms_protocol).replace("{vms_domain}", vms_domain).replace("{vms_port}", vms_port);
        this.vms_get_tree_data_api = vms_get_tree_data_api_template.replace("{vms_protocol}", vms_protocol).replace("{vms_domain}", vms_domain).replace("{vms_port}", vms_port);
        this.vms_get_live_camera_api = vms_get_live_camera_api_template.replace("{vms_protocol}", vms_protocol).replace("{vms_domain}", vms_domain).replace("{vms_port}", vms_port);

        this.cameraUpdateInterval = null;

        this.state = {};
        this.timeouts = [];
        this.encryptHelper = new EncryptHelper(defaultPersistentHandler);
        this.vmsManager = new VMSManager(null, this.configs);

        this.loadFromPersistence = this.loadFromPersistence.bind(this);
        this.saveToPersistence = this.saveToPersistence.bind(this);
        this.setState = this.setState.bind(this);
        this.start = this.start.bind(this);
        this.stop = this.stop.bind(this);
        this.loadVMS = this.loadVMS.bind(this);
        this.updateToken = this.updateToken.bind(this);

        this.startUpdateCameras = this.startUpdateCameras.bind(this);
        this.stopUpdateCameras = this.stopUpdateCameras.bind(this);
        this.reportErrorToken = this.reportErrorToken.bind(this);
        this.current_user = this.current_user.bind(this);
        this.getToken = this.getToken.bind(this);
        this.callAPI = this.callAPI.bind(this);

        this.loadMonitors = this.loadMonitors.bind(this);
        this.loadGroups = this.loadGroups.bind(this);
        this.loadMonitorsGroups = this.loadMonitorsGroups.bind(this);
        this.loadUserGroupIDs = this.loadUserGroupIDs.bind(this);
        this.loadCameras = this.loadCameras.bind(this);
        this.loadTreeData = this.loadTreeData.bind(this);

        this.updateMonitors = this.updateMonitors.bind(this);
        this.updateGroups = this.updateGroups.bind(this);
        this.updateMonitorsGroups = this.updateMonitorsGroups.bind(this);
        this.updateCameras = this.updateCameras.bind(this);
        this.updateUserGroupIds = this.updateUserGroupIds.bind(this);

        this.getDefaultTarget = this.getDefaultTarget.bind(this);
        this.callAPIToVMS = this.callAPIToVMS.bind(this);
        this.turnOnCameraToVMS = this.turnOnCameraToVMS.bind(this);
        this.getListVMS = this.getListVMS.bind(this);

        this.state = {
            current_vms: this.loadFromPersistence("current_vms"),
            cameras: null,
            groupCameras: null,
            cameraInGroups: null,
            cameraDatas: []
        };
        if (this.state.current_vms == null) {
            this.state.current_vms = {
                id: null,
                name: "Default",
                ip: this.vms_domain,
                port: this.vms_port,
                type: null,//"zm", "bkav-vms,
                username: vms_username_default,
                password: vms_password_default,
                auth: {}
            };
            this.saveToPersistence("current_vms", this.state.current_vms);
        }
        this.vmsManager.updateDefaultData(this.getDefaultTarget());
        this.current_token = this.state.current_vms.auth.access_token;
    }

    start() {
        console.log("CameraVMSController:start");
        this.startUpdateCameras();
    }

    stop() {
        console.log("CameraVMSController:stop");
        this.stopUpdateCameras();
        this.saveToPersistence("current_vms", this.state.current_vms);
        this.timeouts.forEach(timeout => clearTimeout(timeout));
    }

    setState(data) {
        // console.log("setState:" + JSON.stringify(data));
        if (!!data) {
            for (let att in data) {
                if (this.state.hasOwnProperty(att)) {
                    this.state[att] = data[att];
                }
            }
        }
    }

    loadFromPersistence(key) {
        return this.encryptHelper.loadFromPersistence(key);
    }

    saveToPersistence(key, value, time = null) {
        this.encryptHelper.saveToPersistence(key, value, time);
    }

    getToken() {
        return this.current_token;
    }

    reportErrorToken() {
        this.current_token = null;
    }

    current_user() {
        return this.state.current_vms;
    }

    loadVMS() {
        let {current_vms} = this.state;
        if (current_vms == null) {
            current_vms = this.loadFromPersistence("current_vms");
            this.setState({current_vms: current_vms});
        }
        return Promise.resolve(current_vms);
    }

    getListVMS() {
        return this.callAPI(this.vms_get_targets_api, {})
            .then(multi_cluster => {
                return multi_cluster == null ? this.vmsManager.getListVMS() : multi_cluster.map(item => this.vmsManager.updateVMS(item.target)).filter(item => item != null);
            });
    }

    updateToken(isForce = false) {
        let methodTag = "updateToken";
        let {current_vms} = this.state;
        if (current_vms == null) return this.loadVMS().then(vms => this.updateToken());
        if (!isForce && this.current_token != null) return Promise.resolve(this.current_token);
        const {username, password} = current_vms;
        const vms_access_token_api = current_vms.auth == null ? null : current_vms.auth.access_token;
        const vms_refresh_token_api = current_vms.auth == null ? null : current_vms.auth.refresh_token;
        let isNeedRequestLogin = vms_access_token_api == null || vms_refresh_token_api == null;//and expire
        let apiUrl = isNeedRequestLogin ? this.vms_login_api : this.vms_update_token_api;
        let params = isNeedRequestLogin ? {user: username, pass: password} : {token: vms_refresh_token_api};
        if (isNeedRequestLogin && (username == null || password == null)) {
            let error_message =  `${methodTag}:vms_username or vms_password invalid`;
            return Promise.reject(error_message);
        }
        const axios = require('axios');
        return axios.post(apiUrl, params)
            .then(resp => {
                if (!!resp.data && !!resp.data.access_token) {//const {access_token, refresh_token, access_token_expires, refresh_token_expires} = resp.data;
                    if (current_vms.auth == null) {
                        current_vms.auth = {};
                    }
                    for (let att in resp.data) {
                        current_vms.auth[att] = resp.data[att];
                    }
                    let now = new Date().getTime();
                    current_vms.auth.token_time_update = now;
                    if (resp.data.refresh_token != null) {
                        current_vms.auth.refresh_token_time_update = now;
                    }
                    this.setState({current_vms: current_vms});
                    this.saveToPersistence("current_vms", current_vms);
                    this.vmsManager.updateVMS(this.getDefaultTarget());
                    this.current_token = current_vms.auth.access_token;
                    if (this.newTokenUpdateHandler != null) {
                        this.newTokenUpdateHandler(this.current_token);
                    }
                    // TODO schedule next update token by expires value
                }
                return this.current_token;
            }).catch(error => {
                let status = null;
                if (error.response != null) {
                    status = error.response.status;
                    console.error(`${methodTag}:${error.message}:${status}`);
                } else {
                    console.error(`${methodTag}:${error}`);
                }
                if (status === 401 || status === 403) {
                    if (!isNeedRequestLogin) {
                        current_vms.auth = {};//reset auth to need Login.
                    }
                    this.setState({current_vms: current_vms});
                    this.saveToPersistence("current_vms", current_vms);
                    this.current_token = null;
                    return this.updateToken(true);
                }
                return this.current_token;
            });
    }

    getDefaultTarget() {
        const {current_vms} = this.state;
        let target = {};
        target.Id = 1;
        target.Name = current_vms.name;
        target.Protocol = this.configs.vms_protocol;
        target.Hostname = this.configs.vms_domain;
        target.Port = this.configs.vms_port;
        target.auth = current_vms.auth;
        target.token = "";
        target.Description = "";
        target.Username = current_vms.username;
        target.Password = current_vms.password;
        return target;
    }

    callAPI(apiUrl, params = {}, responseHandler = null, method = "get", responseMapHandler = null) {
        let methodTag = "callAPI";
        // console.log(`${methodTag}:${apiUrl}:${method}${this.applyWithoutToken}`);
        const {current_vms} = this.state;
        if (current_vms == null) return this.loadVMS().then(vms => this.callAPI(apiUrl, params, responseHandler, method, responseMapHandler));
        const vms_token_api = current_vms.auth == null ? null : current_vms.auth.access_token;
        if (vms_token_api == null && !this.applyWithoutToken) {
            return this.updateToken().then(token => this.callAPI(apiUrl, params, responseHandler, method, responseMapHandler));
        }
        const axios = require('axios');
        const headers = {};
        if (!this.applyWithoutToken) {
            headers.Authorization =  `Bearer ${vms_token_api}`;//{Authorization: `Basic ${Buffer.from(`${current_vms.username}:${current_vms.password}`).toString('base64')}`},
        }
        return axios({
            method: method,
            url: apiUrl,
            headers: headers,
            params: "get" === method ? params : require('querystring').stringify(params)
        }).then(resp => {
            if (!!resp.data) {
                let response = resp.data;
                if (responseMapHandler != null) {
                    response = responseMapHandler(response);
                }
                if (responseHandler != null) {
                    responseHandler(response);
                }
                if (this.applyMultipleVMS) {
                    if (this.isConnectDirectToCluster) {
                        // TODO update respose for isConnectDirectToCluster
                    } else {
                        if (Array.isArray(response)) {
                            if (response.length > 0 && response[0].target == null) {
                                response = [{target : this.getDefaultTarget(), data : response}];
                            }
                        } else {
                            response = [{target : this.getDefaultTarget(), data : response}];
                        }
                        response.forEach(item => {
                            this.vmsManager.updateVMS(item.target);
                        });
                    }
                }
                return response;
            }
            return null;
        }).catch(error => {
            let status = 500;
            if (error.response != null) {
                status = error.response.status;
                console.error(`${methodTag}:${error.message}----${status}`);
            } else {
                console.error(`${methodTag}:${error}`);
            }
            if (this.applyWithoutToken) {
                return null;
            }
            if (status === 401 || status === 403) {
                this.current_token = null;
                return this.updateToken().then(token => this.callAPI(apiUrl, params, responseHandler, method, responseMapHandler));
            } else {
                if (current_vms.auth != null && current_vms.auth.token_time_update != null) {
                    if ((new Date().getTime() - new Date(current_vms.auth.token_time_update).getTime()) > current_vms.auth.access_token_expires * 1000) {
                        this.current_token = null;
                        return this.updateToken().then(token => this.callAPI(apiUrl, params, responseHandler, method, responseMapHandler));
                    }
                }
            }
            return null;
        });
    }

    loadMonitors() {
        return this.callAPI(this.vms_monitors_api);
    }
    loadGroups() {
        return this.callAPI(this.vms_groups_api);
    }
    loadMonitorsGroups() {
        return this.callAPI(this.vms_monitors_groups_api);
    }
    loadUserGroupIDs() {
        return this.callAPI(this.vms_users_groups_api);
    }

    loadTreeData() {
        return this.callAPI(this.vms_get_tree_data_api);
    }

    loadCameras() {
        const methodTag = "loadCameras";
        if (this.applyMultipleVMS && this.isConnectDirectToCluster) {
            return this.getListVMS().then(vmss => {
                const tasks = vmss.map(vms => vms.getVMSController()).map(vmsControler => vmsControler.loadCameras().catch(ex => null));
                return Promise.all(tasks)
                    .then(datas => {
                        return datas.map((data, index) => {
                            let target = vmss[index];
                            return {target, data};
                        })
                    })
            }).then(cameraDatas => {
                this.updateCameras(cameraDatas);
                return cameraDatas;
            });
        }
        const defaultDatas = [null, null, null, null];
        const datasName = ["monitors", "groups", "monitors_groups", "users_groups"];
        const normalDataHandler = (index, value, name, target) => {
            let defaultValue = defaultDatas[index];
            if ("monitors_groups" === name) {
                if (!Array.isArray(value)) return defaultValue;
                return value.flatMap(mg => {
                    return [...new Set(mg.MonitorId)].map(m => {
                        return {GroupId: mg.GroupId, MonitorId: m}
                    });
                });
            }
            if (value == null) {
                console.error(`${methodTag}:Input invalid:${name}:${value}:[${target == null ? null : target.Hostname}]`);
                return defaultValue;
            }
            return value;
        };
        if (this.isSupportGetTreeData) {
            return this.loadTreeData().then(datas => {
                let cameraDatas;
                if (this.applyMultipleVMS) {
                    const targetMapHandler = target => {
                        let dataItem = datas.find(item => target.same(item.target));
                        let data = datasName.reduce((output, _name, index) => {
                            let data = dataItem == null ? null : dataItem.data;
                            output[_name] = normalDataHandler(index, data == null ? null : data[_name], _name, target);
                            return output;
                        }, {});
                        return {target, data};
                    };
                    let listTargets = (datas == null || datas.length == 0) ? [] :
                        datas.map(item => this.vmsManager.updateVMS(item.target)).filter(item => item != null);//this.vmsManager.getListVMS()
                    cameraDatas = listTargets.map(targetMapHandler);
                } else {
                    const targetMapHandler = (dataItem) => {
                        return datasName.reduce((output, _name, index) => {
                            let data = dataItem[_name];
                            output[_name] = normalDataHandler(index, data, _name, this.vmsManager.getDefaultTarget());
                            return output;
                        }, {});
                    };
                    cameraDatas = targetMapHandler(datas);
                }
                this.updateCameras(cameraDatas);
            });
        }
        // TODO ignore updateToken when error in all promise...
        const tasks = [this.loadMonitors(), this.loadGroups(), this.loadMonitorsGroups(), this.loadUserGroupIDs()];
        return Promise.all(tasks).then(datas => {
            if (datas == null || datas.length < tasks.length || datas.filter(item => !Array.isArray(item)).length > 0) {
                throw new Error('result task invalid')
            }
            let cameraDatas;
            if (this.applyMultipleVMS) {
                const targetMapHandler = target => {
                    let data = datas.reduce((data, dataArray, index) => {
                        let _name = datasName[index];
                        let _itemData = dataArray.find(item => target.same(item.target));
                        data[_name] = normalDataHandler(index, _itemData == null ? null : _itemData.data, _name, target);
                        return data;
                    }, {});
                    return {target, data};
                };
                let listTargets = (datas == null || datas.length == 0) ? [] :
                    datas[0].map(item => this.vmsManager.updateVMS(item.target)).filter(item => item != null);//this.vmsManager.getListVMS()
                cameraDatas = listTargets.map(targetMapHandler);
            } else {
                const targetMapHandler = (dataArrays) => {
                    return dataArrays.reduce((data, dataArray, index) => {
                        let _name = datasName[index];
                        data[_name] = normalDataHandler(index, dataArray, _name, this.vmsManager.getDefaultTarget());
                        return data;
                    }, {});
                };
                cameraDatas = targetMapHandler(datas);
            }
            this.updateCameras(cameraDatas);
        }).catch(error => {
            console.error(error);
        });
    }

    startUpdateCameras() {
        if (!!this.cameraUpdateInterval) {
            return;
        }
        this.loadCameras();
        this.cameraUpdateInterval = setInterval(this.loadCameras, this.cameraUpdateIntervalValue);
    }

    stopUpdateCameras() {
        if (!!this.cameraUpdateInterval) {
            clearInterval(this.cameraUpdateInterval);
            this.cameraUpdateInterval = null;
        }
    }

    updateMonitors(datas) {
        this.setState({cameras: datas});
    }

    updateGroups(datas) {
        this.setState({groupCameras: datas});
    }

    updateMonitorsGroups(datas) {
        this.setState({cameraInGroups: datas});
    }

    updateUserGroupIds(datas) {
        this.setState({user_group_ids:datas});
    }

    updateCameras(datas) {
        if (this.updateCamerasHandler != null) {
            this.updateCamerasHandler(datas);
        }
    }

    callAPIToVMS(vmsID, apiUrlTemplate, params, responseHandler = null, method = "get", responseMapHandler = null) {
        let methodTag = "callAPIToVMS";
        // console.log(`${methodTag}:${apiUrlTemplate}:${method}${this.applyWithoutToken}`);
        if (vmsID == null) {
            vmsID = this.vmsManager.getDefaultID();
        }
        const current_vms = this.vmsManager.get(vmsID);
        if (current_vms == null) {
            return Promise.reject('vmsID invalid');
        }
        return current_vms.getVMSController()
            .callAPIWithTemplate(apiUrlTemplate, params, method, responseMapHandler)
            .catch(error => null);
    }

    turnOnCameraToVMS(vmsID, vmsCameraID) {
        let methodTag = "turnOnCameraToVMS";
        return this.callAPIToVMS(vmsID, this.vms_turn_on_camera_api_template.replace("{id}", vmsCameraID), {},  null,"put");
    }
}

// exports.CameraVMSController = CameraVMSController;
export default CameraVMSController;