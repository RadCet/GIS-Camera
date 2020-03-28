const DEFAULT_EVENT_TITLE = "Sự kiện mới";

const DEFAULT_EVENT_TITLES = {
    default: DEFAULT_EVENT_TITLE,
    abandon: "Cảnh báo",
    access: "Xâm nhập",
    activity: "Hoạt động",
    face: "Nhận diện",
    fire: "Cháy nổ",
    flood: "Lũ lụt",
    license_plate: "Biển số xe",
    lost: "Trộm cắp",
    motion: "Chuyển động",
    number: "Biển số xe",
    pedestrian: "Người đi bộ",
    people_in: "Người vào",
    people_out: "Người ra",
    protest: "Biểu tình",
    reception: "Tiếp dân",
    administration: "Hành chính công",
};

export default class CameraVAController {

    constructor(configs, vmsManager, updateAICameraHandler, updateEventsHandler) {
        this.configs = configs;
        const {va_protocol, va_domain, va_port, va_get_vms_api_template, va_events_api_template, va_get_cameras_api_template, va_get_event_image_template, va_get_event_video_template} = this.configs;
        this.updateAICameraHandler = updateAICameraHandler;
        this.updateEventsHandler = updateEventsHandler;
        this.va_vms_id = this.configs.va_vms_id;
        this.ai_cam_view_filter = this.configs.ai_cam_view_filter;
        this.max_last_vms_event = this.configs.max_last_vms_event;
        this.ai_cam_event_view_filter = this.configs.ai_cam_event_view_filter;
        this.aievent_newest_get_type = this.configs.aievent_newest_get_type;
        this.aievent_newest_minute_value = this.configs.aievent_newest_minute_value;
        this.aievent_get_day_mode = this.configs.aievent_get_day_mode;
        this.va_token_api = this.configs.va_token_api;
        this.va_event_view = this.configs.va_event_view;
        if (this.va_event_view == null) {
            this.va_event_view = DEFAULT_EVENT_TITLES;
        }
        for (let key in DEFAULT_EVENT_TITLES) {
            if (!this.va_event_view[key]) {
                this.va_event_view[key] = DEFAULT_EVENT_TITLES[key];
            }
        }
        this.va_event_type_map = this.configs.va_event_type_map;

        this.va_get_vms_api          = va_get_vms_api_template.replace("{va_protocol}", va_protocol).replace("{va_domain}", va_domain).replace("{va_port}", va_port);
        this.va_events_api           = va_events_api_template.replace("{va_protocol}", va_protocol).replace("{va_domain}", va_domain).replace("{va_port}", va_port);
        this.va_get_cameras_api      = va_get_cameras_api_template.replace("{va_protocol}", va_protocol).replace("{va_domain}", va_domain).replace("{va_port}", va_port);
        this.va_get_event_video_api  = va_get_event_video_template.replace("{va_protocol}", va_protocol).replace("{va_domain}", va_domain).replace("{va_port}", va_port);
        this.va_get_event_image_api  = va_get_event_image_template.replace("{va_protocol}", va_protocol).replace("{va_domain}", va_domain).replace("{va_port}", va_port);

        this.cameraUpdateInterval = null;
        this.eventUpdateInterval  = null;
        this.eventUpdateIntervalValue  = this.configs.eventUpdateIntervalValue;
        this.cameraUpdateIntervalValue = this.configs.cameraUpdateIntervalValue;
        this.isTokenError = false;

        this.loadAICameras = this.loadAICameras.bind(this);
        this.loadEvents = this.loadEvents.bind(this);
        this.startUpdateCameras = this.startUpdateCameras.bind(this);
        this.startUpdateEvents = this.startUpdateEvents.bind(this);
        this.stopUpdateCameras = this.stopUpdateCameras.bind(this);
        this.stopUpdateEvents = this.stopUpdateEvents.bind(this);
        this.loadVAToken = this.loadVAToken.bind(this);
        this.loadVMSID = this.loadVMSID.bind(this);

        this.getEventVideoLink = this.getEventVideoLink.bind(this);
        this.getEventImageLink = this.getEventImageLink.bind(this);
        this.updateAICameras = this.updateAICameras.bind(this);
        this.updateEvents = this.updateEvents.bind(this);

        this.start = this.start.bind(this);
        this.stop = this.stop.bind(this);

        this.getEventName = this.getEventName.bind(this);
        this.getEventType = this.getEventType.bind(this);

        this.timeouts = [];
        this.vmsManager = vmsManager;
    }

    getEventName(event) {
        let type = event.type.replace('-', '_');
        if (this.va_event_view == null) {
            this.va_event_view = DEFAULT_EVENT_TITLES;
        }
        let _name = this.va_event_view[type];
        if (_name == null) {
            _name = this.va_event_view.default;
        }
        if (_name == null || _name.length === 0) {
            _name = DEFAULT_EVENT_TITLE;
        }
        return _name;
    }

    getEventType(event) {
        let _type = event.type.replace('-', '_');
        // if (this.va_event_type_map == null) {
        //     this.va_event_type_map = {
        //         default: 1, fire:4, access:2, face:2, motion:1, // administration:1
        //         violence: 6
        //     };
        // }
        // let _type = this.va_event_type_map[type];
        // if (_type == null) {
        //     _type = this.va_event_type_map.default;
        // }
        // if (_type == null || _type <= 0 || _type > 6) {
        //     _type = 1;
        // }
        return _type;
    }

    start() {
        console.log("CameraVAController:start");
        // this.startUpdateCameras();
        this.startUpdateEvents();
    }

    stop() {
        console.log("CameraVAController:stop");
        // this.stopUpdateCameras();
        this.stopUpdateEvents();
        this.timeouts.forEach(timeout => clearTimeout(timeout));
    }

    loadVAToken() {
        if (this.isTokenError) {
            return Promise.reject('Token invalid');
        }
        if (this.va_token_api == null) {
            this.va_token_api = this.configs.va_token_api;
        }
        if (this.va_token_api == null) {
            this.isTokenError = true;
            return Promise.reject('Token invalid');
        }
        return Promise.resolve(this.va_token_api);
    }

    loadVMSID() {
        let methodTag = "loadVMSID";
        console.log(`${methodTag}`);
        if (this.va_vms_id != null) return Promise.resolve(this.va_vms_id);
        if (this.va_token_api == null) {
            return this.loadVAToken().then(token => this.loadVMSID());
        }
        let apiUrl = this.va_get_vms_api;
        let params = {};
        console.log(`${methodTag}:request`);
        const axios = require('axios');
        const {vms_domain, vms_port} = this.configs;
        return axios({
            method:"get",
            url:apiUrl,
            headers:{Authorization: `Bearer ${this.va_token_api}`},
            params:params
        }).then(resp => {
            if (!!resp.data) {
                if (!Array.isArray(resp.data)) return null;
                // let vms = resp.data.find(vms => vms.ip === vms_domain && vms.port === vms_port);
                let vmss = resp.data.filter(vms => vms.ip === vms_domain);
                let vms = vmss.find(vms => vms.port === vms_port);
                if (vms == null && vmss.length > 0) {
                    vms = vmss[0];
                }
                // if (vms == null && resp.data.length > 0) {
                //     vms = resp.data[0];
                // }
                if (vms == null) {
                    this.va_vms_id = null;
                    // if (resp.data.length == 1) {
                    //     this.va_vms_id = 1;
                    // }
                    throw new Error(`${methodTag}:not exited vms with ${vms_domain}:${vms_port}`);
                }
                this.va_vms_id = vms.id;
                console.log(`${methodTag}:vmsID=${this.va_vms_id}`);
                return this.va_vms_id;
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
            if (status === 401 || status === 403) {
                this.isTokenError = true;
            }
            return this.va_vms_id == null ? Promise.reject(error) : this.va_vms_id;
        });
    }

    loadAICameras() {
        let methodTag = "loadAICameras";
        console.log(`${methodTag}`);
        if (this.va_vms_id == null) return this.loadVMSID().then(vms_id => this.loadAICameras());
        if (this.va_token_api == null) return this.loadVAToken().then(token => this.loadAICameras());

        let apiUrl = this.va_get_cameras_api;
        let params = {vmsId:this.va_vms_id, view:this.ai_cam_view_filter};
        const axios = require('axios');
        return axios({
            method:"get",
            url:apiUrl,
            headers:{Authorization: `Bearer ${this.va_token_api}`},
            params:params
        }).then(resp => {
            if (!!resp.data) {
                if (!Array.isArray(resp.data)) return null;
                this.updateAICameras(resp.data);
                return resp.data;
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
            if (status === 401 || status === 403) {
                this.isTokenError = true;
            }
            return Promise.reject(error);
        });
    }

    loadEvents() {
        let methodTag = "loadEvents";
        if (this.va_vms_id == null) return this.loadVMSID().then(vms_id => this.loadEvents());
        if (this.va_token_api == null) {
            return this.loadVAToken().then(token => this.loadEvents());
        }
        let apiUrl = this.va_events_api;
        let now = new Date();
        let startDate;
        if ("start" === this.aievent_get_day_mode) {
            startDate = now;
            startDate.setHours(0, 0, 0,0);
        } else {
            startDate = new Date(now.getTime() - 86400000);//24h
        }
        console.log(`${methodTag}:${startDate}`);
        let params = {
            vmsId:this.va_vms_id, // count:max_last_vms_event,
            from: startDate.getTime() / 1000,
            view: this.ai_cam_event_view_filter
        };
        const axios = require('axios');
        return axios({
            method:"get",
            url:apiUrl,
            headers:{Authorization: `Bearer ${this.va_token_api}`},
            params:params
        }).then(resp => {
            if (!!resp.data) {
                if (!Array.isArray(resp.data)) return null;
                this.updateEvents(resp.data);
                return resp.data;
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
            if (status === 401 || status === 403) {
                this.isTokenError = true;
            }
            return Promise.reject(error);
        });
    }

    startUpdateCameras() {
        if (!!this.cameraUpdateInterval) {
            return;
        }
        this.loadAICameras();
        if (this.isTokenError) {
            return;
        }
        this.cameraUpdateInterval = setInterval(() => {
            if (this.isTokenError) {
                this.stopUpdateCameras();
            }
            this.loadAICameras();
        }, this.cameraUpdateIntervalValue);
    }

    startUpdateEvents() {
        if (!!this.eventUpdateInterval) {
            return;
        }
        this.loadEvents();
        if (this.isTokenError) {
            return;
        }
        this.eventUpdateInterval = setInterval(() => {
            if (this.isTokenError) {
                this.stopUpdateEvents();
            }
            this.loadEvents();
        }, this.eventUpdateIntervalValue);
    }

    stopUpdateCameras() {
        if (!!this.cameraUpdateInterval) {
            clearInterval(this.cameraUpdateInterval);
            this.cameraUpdateInterval = null;
        }
    }

    stopUpdateEvents() {
        if (!!this.eventUpdateInterval) {
            clearInterval(this.eventUpdateInterval);
            this.eventUpdateInterval = null;
        }
    }

    getEventVideoLink(event_id, clusterDataID = null) {
        return this.va_get_event_video_api.replace("{event_id}", event_id);
    }

    getEventImageLink(event_id, clusterDataID = null) {
        return this.va_get_event_image_api.replace("{event_id}", event_id);
    }

    updateAICameras(aicameras) {
        if (this.updateAICameraHandler != null) {
            this.updateAICameraHandler(aicameras, this.vmsManager.getDefaultID());
        }
        /*
        [{
            "id": 321,
            "groupId": 1,
            "url": "https://vms.bkav.com:9443/bkav-vms/cgi-bin/nph-zms?mode=jpeg&maxfps=30&buffer=1000&monitor=14&user=admin&pass=admin",
            "liveUrl": "https://vms.bkav.com:9443/bkav-vms/cgi-bin/nph-zms?mode=jpeg&maxfps=30&buffer=1000&monitor=14&user=admin&pass=admin",
            "updatedAt": "2019-11-28T08:00:29Z",
            "createdAt": "2019-11-14T10:34:21Z",
            "vmsId": 35,
            "name": "Camera-14",
            "vmsCameraId": "14",
            "type": "mjpeg"
        },...]
         */
    }

    updateEvents(aievents) {
        if (this.updateEventsHandler == null) return;
        const allAIcamerasHaveEvent = new Set();
        const newestAIcamerasHaveEvent = new Set();
        let count = 0;
        let isNewestDoned = false;
        const lastestCount = this.max_last_vms_event;
        const lastestEvent = [];
        const lastestTime = new Date().getTime() - this.aievent_newest_minute_value * 60000;
        const clusterDataID = this.vmsManager.getDefaultID();
        const turn = new Date().getTime();

        aievents.forEach(event => {
            let vmsCameraID = event.vmsCameraId;
            if (!isNewestDoned) {
                if ("time" === this.aievent_newest_get_type) {
                    isNewestDoned = new Date(event.createdAt).getTime() < lastestTime;
                } else {
                    isNewestDoned = ++count > lastestCount;
                }
            }
            if (!isNewestDoned) {
                lastestEvent.push(event);
                newestAIcamerasHaveEvent.add(vmsCameraID);
            }
            allAIcamerasHaveEvent.add(vmsCameraID);
        });

        this.updateEventsHandler({
            lastestEvent:lastestEvent,
            newestAIcamerasHaveEvent:newestAIcamerasHaveEvent,
            allAIcamerasHaveEvent: allAIcamerasHaveEvent
        }, clusterDataID);
        /*
       [ {
        "id": 1262657,
        "level": 3,
        "updatedAt": "2019-12-10T03:27:35Z",
        "createdAt": "2019-12-10T03:27:35Z",
        "type": "fire",
        "vmsCameraId": "10286",
        "duration": 3
    },]
         */
    }
}

// exports.CameraVAController = CameraVAController;