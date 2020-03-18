const EncryptHelper = require('./Helper').EncryptHelper;
const Cookies = require('js-cookie');

// const cookie = require('./cookie');
persistentHandler = {
    datas: {},
    get : function(key) {
        // console.log(key);
        return this.datas[key];
        // return cookie.value;
    },
    set: function (key, value) {
        this.datas[key] = value;
        console.log(value);
    }
};

const encryptHelper = new EncryptHelper(persistentHandler);//Cookies


let e = encryptHelper.encrypt("this is input");
let d = encryptHelper.decrypt(e);

console.log(e);
console.log(d);



