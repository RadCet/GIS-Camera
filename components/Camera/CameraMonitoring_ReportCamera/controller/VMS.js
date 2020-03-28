export class VMS {
    static check(vms) {
        return typeof (vms) === "object";
    }

    constructor(id, data) {
        const {Protocol, Hostname, Port, port, Name, name, auth, root, Username, username, Password, password, Id} = data;
        this.id = id == null ? Id : id;
        this.Name = Name == null ? name : Name;
        this.Protocol = Protocol;
        this.Hostname = Hostname;
        this.Port = Port == null ? port : Port;
        this.auth = auth;
        this.root = root;
        this.username = Username == null ? username : Username;
        this.password = Password == null ? password : Password;
        this.values = {monitors:[], groups:[], monitors_groups:[], user_group_ids:[]};

        if (this.Name == null) this.Name = this.Hostname;//.split('.')[0];
        this.vmsController = null;

        this.same = this.same.bind(this);
        this.update = this.update.bind(this);
        this.getID = this.getID.bind(this);
        this.getVMSController = this.getVMSController.bind(this);
        this.getValues = this.getValues.bind(this);
        this.getValue = this.getValue.bind(this);
        this.setValue = this.setValue.bind(this);
    }

    getValues() {
        return this.values;
    }

    setValue(key, value) {
        if (typeof(key) === "string" && key.length > 0) {
            this.values[key] = value;
        }
        return this.values[key];
    }

    getValue(key, defaultValue = null) {
        let value = defaultValue;
        if (typeof(key) === "string" && key.length > 0) {
            let _value = this.values[key];
            if (_value) value = _value;
        }
        return value;
    }

    getVMSController() {
        return this.vmsController;
    }

    getID() {
        return this.id;
    }

    same(vms) {
        if (vms === this) return true;
        const {Hostname, Port, Protocol, Username, username} = vms;
        const _username = Username == null ? username : Username;
        if (Protocol != null && Port != null && Hostname != null && _username != null) {
            return this.Port == Port
                && this.Hostname == Hostname
                && this.Protocol == Protocol
                // && (this.root || _username == null)
                // && (this.username == null || this.username == _username);
                && (this.username == _username);
        } else if (_username == null) {
            // TODO update same vms when username is null
        }
        return false;
    }

    update(vms) {
        if (vms === this) return this;
        if (this.same(vms)) {
            if (vms.auth != null && vms.auth.access_token != null) this.auth = vms.auth;
            if (vms.Name != null) this.Name = vms.Name;
            let userName = vms.Username == null ? vms.username : vms.Username;
            if (userName != null) this.username = userName;
            if (vms.Password != null) this.Password = vms.Password;
            if (vms.values && typeof(vms.values) === "object") {
                for (let key in vms.values) {
                    this.values[key] = vms.values[key];
                }
            }
            this.root = vms.root;
            return this;
        }
        return null;
    }
}

export class VMSManager {

    static default_vms_id = 0;

    constructor(default_target, configs) {
        this.datas = [];
        this.nextID = 1000;//0;
        this.configs = configs;
        this.getListVMS = this.getListVMS.bind(this);
        this.getNewID = this.getNewID.bind(this);
        this.clearListVMS = this.clearListVMS.bind(this);
        this.getID = this.getID.bind(this);
        this.updateDefaultData = this.updateDefaultData.bind(this);
        this.getDefaultID = this.getDefaultID.bind(this);
        this.getDefaultTarget = this.getDefaultTarget.bind(this);
        this.normalVMSData = this.normalVMSData.bind(this);

        this.updateDefaultData(default_target);
    }

    get(id) {
        return this.datas.find(item => item.id == id);
    }

    getDefaultID() {
        return this.default_id;
    }

    getDefaultTarget() {
        return this.default_target;
    }

    normalVMSData(data) {
        if (data == null) return data;
        if (data.Username == null && data.root === true) {
            data.Username = this.default_target ? this.default_target.username : null;
        }
        return data;
    }

    updateDefaultData(default_target = null) {
        this.default_target = this.updateVMS(default_target);
        this.default_id = this.default_target == null ? null : this.default_target.getID();
        if (this.default_id == null) {
            this.default_id = VMSManager.default_vms_id;
        }
        if (this.default_target != null) {
            this.getListVMS().forEach(item => item.isDefault = false);
            this.default_target.isDefault = true;
        }
    }

    getID(data) {
        let _vms = this.datas.find(item => item.same(data) != null);
        return _vms == null ? null : _vms.getID();
    }

    updateVMS(data) {
        let _vms = null;
        if (data == null) return _vms;
        let {Protocol, Hostname, Port, Id, Username, root} = data;
        if (Protocol == null || Hostname == null || Port == null) return _vms;
        data = this.normalVMSData(data);
        if (VMS.check(data)) {
            _vms = this.datas.find(item => item.update(data) != null);
            if (!_vms) {
                _vms = new VMS(Id ? Id : root === true ? 0 : this.getNewID(), data);
                _vms.vmsController = new VMSController(_vms, this.configs);
                this.datas.push(_vms);
            }
        }
        return _vms;
    }

    getListVMS() {
        return this.datas;
    }

    clearListVMS() {
        this.datas.clear();
    }

    getNewID() {
        return this.nextID++;
    }
}

export class VMSController {
    constructor(vms, config) {
        this.vms = vms;
        this.config = config;

        this.updateAPIURL = this.updateAPIURL.bind(this);
        this.updateToken = this.updateToken.bind(this);
        this.callAPI = this.callAPI.bind(this);
        this.callAPIWithTemplate = this.callAPIWithTemplate.bind(this);

        this.loadMonitors = this.loadMonitors.bind(this);
        this.loadGroups = this.loadGroups.bind(this);
        this.loadMonitorsGroups = this.loadMonitorsGroups.bind(this);
        this.loadUserGroupIDs = this.loadUserGroupIDs.bind(this);
        this.loadCameras = this.loadCameras.bind(this);
        this.loadTreeData = this.loadTreeData.bind(this);

        const {
            vms_login_api_template, vms_update_token_api_template, vms_monitors_api_template,
            vms_groups_api_template, vms_monitors_groups_api_template,
            vms_users_groups_api_template, vms_get_tree_data_api_template
        } = this.config;

        this.vms_authentication_config = this.config.vms_authentication_config;
        if (this.vms_authentication_config == null) {
            this.vms_authentication_config = {authentication_without_token: false};
        }
        this.applyWithoutToken = this.vms_authentication_config.authentication_without_token;
        this.isSupportGetTreeData = this.config.vms_support_get_tree_data;
        this.vms_login_api = this.updateAPIURL(vms_login_api_template);
        this.vms_update_token_api = this.updateAPIURL(vms_update_token_api_template);
        this.vms_monitors_api = this.updateAPIURL(vms_monitors_api_template);
        this.vms_groups_api = this.updateAPIURL(vms_groups_api_template);
        this.vms_monitors_groups_api = this.updateAPIURL(vms_monitors_groups_api_template);
        this.vms_users_groups_api = this.updateAPIURL(vms_users_groups_api_template);
        this.vms_get_tree_data_api = this.updateAPIURL(vms_get_tree_data_api_template);

        this.current_token = this.vms.auth == null ? null : this.vms.auth.access_token;
    }

    updateToken(isForce = false) {
        let methodTag = "updateToken";
        let current_vms = this.vms;
        // if (current_vms == null) return this.loadVMS().then(vms => this.updateToken());
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
                    this.current_token = current_vms.auth.access_token;
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
                    this.current_token = null;
                    return this.updateToken(true);
                }
                return this.current_token;
            });
    }

    updateAPIURL(template) {
        const {Protocol, Hostname, Port} = this.vms;
        return template
            .replace("{vms_protocol}", Protocol)
            .replace("{vms_domain}", Hostname)
            .replace("{vms_port}", Port);
    }

    callAPIWithTemplate(apiUrlTemplate, param = {}, method = "get", responseMapHandler = null) {
        console.log("callAPIWithTemplate:" + this.updateAPIURL(apiUrlTemplate));
        return this.callAPI(this.updateAPIURL(apiUrlTemplate), param, method, responseMapHandler);
    }

    callAPI(apiUrl, params = {}, method = "get", responseMapHandler = null) {
        let methodTag = "callAPI";
        console.log(`${methodTag}:${apiUrl}:${method}`);
        const current_vms = this.vms;
        // if (current_vms == null) return this.loadVMS().then(vms => this.callAPI(apiUrl, params));
        const vms_token_api = this.current_token;
        let isNeedToken = !(this.applyWithoutToken && this.vms.isDefault);
        if (vms_token_api == null && isNeedToken) {
            return this.updateToken(true).then(token => this.callAPI(apiUrl, params));
        }
        const axios = require('axios');
        const headers = {};
        if (!this.applyWithoutToken) {
            headers.Authorization =  `Bearer ${vms_token_api}`;//{Authorization: `Basic ${Buffer.from(`${current_vms.username}:${current_vms.password}`).toString('base64')}`},
        }
        let _params = {};
        let _data = {};
        if ("get" === method) {
            _params = require('querystring').stringify(params);
        } else {
            _data = params;
        }
        return axios({
            method: method,
            url: apiUrl,
            // headers: {Authorization: `Bearer ${vms_token_api}`},//{Authorization: `Basic ${Buffer.from(`${current_vms.username}:${current_vms.password}`).toString('base64')}`},
            // params: "get" === method ? params : require('querystring').stringify(params)
            headers: headers,
            params: _params,
            data: _data
        }).then(resp => {
            if (!!resp.data) {
                let response = resp.data;
                if (responseMapHandler != null) {
                    response = responseMapHandler(response);
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
            if (!isNeedToken) {
                throw error;
            }
            if (status === 401 || status === 403) {
                this.current_token = null;
                return this.updateToken().then(token => this.callAPI(apiUrl, params));
            } else {
                if (current_vms.auth != null && current_vms.auth.token_time_update != null) {
                    if ((new Date().getTime() - new Date(current_vms.auth.token_time_update).getTime()) > current_vms.auth.access_token_expires * 1000) {
                        this.current_token = null;
                        return this.updateToken(true).then(token => this.callAPI(apiUrl, params));
                    }
                }
            }
            throw error;
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
        const defaultDatas = [null, null, null, null];
        const datasName = ["monitors", "groups", "monitors_groups", "users_groups"];
        const normalDataHandler = (index, value, name, target) => {
            let returnValue = value;
            let defaultValue = defaultDatas[index];
            if ("monitors_groups" === name) {
                if (!Array.isArray(value)) {
                    returnValue = defaultValue;
                } else {
                    returnValue = value.flatMap(mg => {
                        return [...new Set(mg.MonitorId)].map(m => {
                            return {GroupId: mg.GroupId, MonitorId: m}
                        });
                    });
                }
            }
            if (returnValue == null) {
                console.error(`${methodTag}:Input invalid:${name}:${value}:[${target == null ? null : target.Hostname}]`);
                return defaultValue;
            }
            if (target != null && typeof(target.setValue) ===  "function") {
                target.setValue(name, returnValue);
            }
            return returnValue;
        };

        const targetMapHandler = this.isSupportGetTreeData ?
            (dataItem) => {
                return datasName.reduce((output, _name, index) => {
                    let data = dataItem == null ? null : dataItem[_name];
                    output[_name] = normalDataHandler(index, data, _name, this.vms);
                    return output;
                }, {});
            } : (dataArrays) => {
                if (!Array.isArray(dataArrays)) { return {}; }
                return dataArrays.reduce((data, dataArray, index) => {
                    let _name = datasName[index];
                    data[_name] = normalDataHandler(index, dataArray, _name, this.vms);
                    return data;
                }, {});
            };

        const getDataHandler = this.isSupportGetTreeData ?
            this.loadTreeData().catch(err => null)
            : Promise.all([
                this.loadMonitors(), this.loadGroups(), this.loadMonitorsGroups(), this.loadUserGroupIDs()
            ]).catch(err => null);
        return getDataHandler.then(data => {
            return targetMapHandler(data)
        });
    }
}

// exports.VMS = VMS;
// exports.VMSManager = VMSManager;
// exports.VMSController = VMSController;
