// const Cookies = require('./Cookies').Cookies;
import Cookies from 'js-cookie';

export const defaultPersistentHandler = {
    datas : {},
    get : function(key) {
        return this.datas[key];
    },
    set : function(key, value, time = null) {
        this.datas[key] = value;
    },
    clear: function(key = null) {
        if (key == null) {
            this.datas = {}
        } else {
            this.datas[key] = null;
        }
    }
};

export const localStoragePersistentHandler = {
    get : function(key) {
        return localStorage.getItem(key);
    },
    set : function(key, value, time = null) {
        return localStorage.setItem(key, value);
    },
    clear : function(key = null) {
        if (key == null) {
            localStorage.clear();
        } else {
            localStorage.removeItem(key);
        }
    }
};

export const cookiePersistentHandler = {
    get : function(key) {
        return Cookies.get(key);
    },
    set : function(key, value, time = null) {
        let option = { secure: true }
        if (time != null) {
            option.expires = time;
        }
        return Cookies.set(key, value, option);
    },
    clear: function(key = null) {
        if (key != null) {
            Cookies.remove(key);
        } else {
            Object.keys(Cookies.get()).forEach(function(cookieName) {
                Cookies.remove(cookieName);//, neededAttributes);
            });
        }
    }
};

export function getPersistentHandler(persistentProfile = null) {
    let persistentHandler = localStoragePersistentHandler;
    if (persistentProfile === "cookie") {
        persistentHandler = cookiePersistentHandler;
    } else if (persistentProfile === "localstorage") {
        persistentHandler = localStoragePersistentHandler;
    } else if (persistentProfile === "default") {
        persistentHandler = defaultPersistentHandler;
    }
    return persistentHandler;
}

// exports.defaultPersistentHandler = defaultPersistentHandler;
// exports.localStoragePersistentHandler = localStoragePersistentHandler;
// exports.cookiePersistentHandler = cookiePersistentHandler;