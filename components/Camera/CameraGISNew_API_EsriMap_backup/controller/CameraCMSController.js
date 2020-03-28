const defaultAuthHandler = {
    token: null,
    user:{username:"admin", password:"password"},
    getToken: function() {
        return this.token;
    },
    updateToken: function(isForce = false) {
        return new Promise((res, rej) => res(this.token));
    },
    current_user: function() {
        return this.user;
    },
    reportErrorToken: function() {
        this.token = null;
    }
};

export default class CameraCMSController {
    constructor(configs, updateCMSDataHandler, authHandler = null) {
        this.configs = configs;
        this.updateCMSDataHandler = updateCMSDataHandler;
        this.authHandler = authHandler;
        if (this.authHandler == null) {
            this.authHandler = defaultAuthHandler;
        }
        const {cms_protocol, cms_domain, cms_port, cms_camera_data_api_template, cms_profile_api_template} = this.configs;
        this.cms_camera_data_api = cms_camera_data_api_template.replace("{cms_protocol}", cms_protocol).replace("{cms_domain}", cms_domain).replace("{cms_port}", cms_port);
        this.cms_profile_api = cms_profile_api_template.replace("{cms_protocol}", cms_protocol).replace("{cms_domain}", cms_domain).replace("{cms_port}", cms_port);
        this.cms_profile_id = this.configs.cms_profile_id;
        this.vms_domain = this.configs.vms_domain;
        this.vms_port = this.configs.vms_port;

        this.loadProfileID = this.loadProfileID.bind(this);
        this.loadCMSData = this.loadCMSData.bind(this);
        this.loadCMSData = this.loadCMSData.bind(this);
    }

    loadProfileID() {
        let methodTag = "loadProfile";
        console.log(`${methodTag}`);
        if (this.cms_profile_id != null) return new Promise.resolve(this.cms_profile_id);
        if (this.authHandler == null) return Promise.reject('authHandler undefined');
        const vms_token_api = this.authHandler.getToken();
        if (vms_token_api == null) return this.authHandler.updateToken(true).then(this.loadProfileID);
        const {username} = this.authHandler.current_user();
        if (username == null) return Promise.reject('current_user invalid');
        const UUID = require('uuid/v5');
        const newProfileID = `${UUID(`${username}@${this.vms_domain}`, UUID.URL)}`;
        let apiUrl = this.cms_profile_api;
        let params = {Id: newProfileID, Username: username, Domain: `${this.vms_domain}`, Port: this.vms_port};
        const axios = require('axios');
        const qs = require('querystring');
        return axios({
            method: "post",
            url: apiUrl,
            headers: {Authorization: `Bearer ${vms_token_api}`},
            data: qs.stringify(params)
        }).then(resp => {
            if (!!resp.data) {
                this.cms_profile_id = resp.data.id;
            }
        }).catch(async error => {
            let status = 500;
            if (error.response != null) {
                status = error.response.status;
                console.error(`${methodTag}:${error.message}:${status}`);
            } else {
                console.error(`${methodTag}:${error}`);
            }
            if (status === 401 || status === 403) {
                this.cms_profile_api = null;
                try {
                    this.cms_profile_id = await this.authHandler.updateToken(true).then(this.loadProfileID);
                } catch (error) {
                    this.cms_profile_id = null;
                }
            }
        }).then(() => {
            return this.cms_profile_id;
        });
    }

    loadCMSData() {
        let methodTag = "loadCMSData";
        console.log(`${methodTag}`);
        if (this.authHandler == null) return Promise.reject('authHandler undefined');
        const vms_token_api = this.authHandler.getToken();
        if (vms_token_api == null) return this.authHandler.updateToken(true).then(this.loadCMSData);
        if (this.cms_profile_id == null) {
            return this.loadProfileID().then(this.loadCMSData);
        }
        let apiUrl = this.cms_camera_data_api;
        let params = {profileId: this.cms_profile_id};
        const axios = require('axios');
        console.log(`${methodTag}:request`);
        axios({
            method: "get",
            url: apiUrl,
            headers: {Authorization: `Bearer ${vms_token_api}`},//{Authorization: `Basic ${Buffer.from(`${current_vms.username}:${current_vms.password}`).toString('base64')}`},
            params: params
        }).then(resp => {
            if (!!resp.data) {
                this.updateCMSData(resp.data);
                return resp.data;
            }
            return null;
        }).catch(async error => {
            let status = 500;
            if (error.response != null) {
                status = error.response.status;
                console.error(`${methodTag}:${error.message}----${status}`);
            } else {
                console.error(`${methodTag}:${error}`);
            }
            if (status === 401 || status === 403) {
                return await this.authHandler.updateToken(true).then(this.loadCMSData);
            }
            return null;
        });
    }

    updateCMSData(datas) {
        if (this.updateCMSDataHandler != null) {
            const {groupCameras, cameras, cameraInGroups} = datas;

            let monitors = cameras.map((cam) => {
                return {Id: cam.externalCameraId, Name: cam.name}
            });
            let groups = groupCameras.map(group => {
                return {Id: group.id, Name: group.name, ParentId: group.parentId};
            });
            let monitors_groups = [];
            cameraInGroups.forEach(cg => {
                let groupId = cg.groupId;
                let cameraId = cg.cameraId;
                // let group = monitors_groups.find(item => item.GroupId === groupId);
                // if (group == null) {
                //     group = {GroupId: groupId, MonitorId: []};
                //     monitors_groups.push(group);
                // }
                // let camera = cameras.find(c => c.id === cameraId);
                // if (camera != null) {
                //     group.MonitorId.push(camera.externalCameraId)
                // }
                monitors_groups.push({GroupId: groupId, MonitorId: cameraId});
            });
            this.updateCMSDataHandler({monitors, groups, monitors_groups});
        }
    }
}


// exports.CameraCMSController = CameraCMSController;