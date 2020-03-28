//persistentHandler {get(key){}, set(key, value){}}
export class EncryptHelper {
    constructor(persistentHandler = null, pKey = 'eIfo', alg = 'aes-256-cbc') {
        // TODO check valid input
        this.persistentHandler = persistentHandler;
        if (this.persistentHandler == null) {
            this.persistentHandler = {
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
        }
        this.encryptInfo = null;
        this.alg = alg;
        this.pKey = pKey;
        this.getEncryptInfo = this.getEncryptInfo.bind(this);
        this.encrypt = this.encrypt.bind(this);
        this.decrypt = this.decrypt.bind(this);
        this.loadFromPersistence = this.loadFromPersistence.bind(this);
        this.saveToPersistence = this.saveToPersistence.bind(this);
        this.reset = this.reset.bind(this);
        this.clearPersistent = this.clearPersistent.bind();
    }

    static encodeKey(rawString) {//btoa
        let encoded = Buffer.from(rawString, "utf8").toString('base64');
        if (encoded.endsWith('==')) {
            encoded = encoded.replace('==', 't2');
        } else if (encoded.endsWith('=')) {
            encoded = encoded.replace('=', 'o1');
        } else {
            encoded = encoded + 'z0';
        }
        encoded = EncryptHelper.simpleBiEncrypt(encoded);
        return encoded;
    }
    static decodeKey(rawString) {//atob
        let encoded = EncryptHelper.simpleBiEncrypt(rawString);
        if (encoded.endsWith('t2')) {
            encoded = encoded.substring(0, encoded.length - 2) + '==';
        } else if (encoded.endsWith('o1')) {
            encoded = encoded.substring(0, encoded.length - 2) + '=';
        } else if (encoded.endsWith('z0')) {
            encoded = encoded.substring(0, encoded.length - 2);
        }
        return Buffer.from(encoded, 'base64').toString("utf8");
    }
    getEncryptInfo(isReload = false) {
        if (isReload === false && this.encryptInfo != null) {
            return this.encryptInfo;
        }
        if (isReload === true && this.persistentHandler == null) {
            return null;
        }
        if (this.persistentHandler == null) {
            return null;
        }
        let key = EncryptHelper.encodeKey(this.pKey);
        let eInfoString = this.persistentHandler.get(key);
        let eInfo;
        if (eInfoString == null) {
            const crypto = require('crypto');
            eInfo = {
                alg : this.alg,
                key : crypto.randomBytes(32),
                iv : crypto.randomBytes(16),
            };
            eInfoString = Buffer.concat([eInfo.key, eInfo.iv, Buffer.from(eInfo.alg)]).toString("hex");
            this.persistentHandler.set(key, eInfoString);
        } else {
            let buffer = Buffer.from(eInfoString, "hex");
            eInfo = {
                alg: buffer.slice(48).toString(),
                key: buffer.slice(0, 32),
                iv : buffer.slice(32, 48)
            };
        }
        return eInfo;
    }

    reset() {
        this.persistentHandler.clear(this.pKey);
    }

    clearPersistent() {
        this.persistentHandler.clear();
    }

    encrypt(text, encryptInfo = null) {
        if (encryptInfo == null) {
            encryptInfo = this.getEncryptInfo();
        }
        const crypto = require('crypto');
        const  {alg, key, iv} = encryptInfo;
        let cipher = crypto.createCipheriv(alg, key, iv);
        let encrypted = cipher.update(text);
        encrypted = Buffer.concat([encrypted, cipher.final()]);
        return encrypted.toString("hex");
    }

    decrypt(text, encryptInfo = null) {
        if (encryptInfo == null) {
            encryptInfo = this.getEncryptInfo();
        }
        const crypto = require('crypto');
        let  {alg, key, iv} = encryptInfo;
        let encryptedText = Buffer.from(text, 'hex');
        let decipher = crypto.createDecipheriv(alg, key, iv);
        let decrypted = decipher.update(encryptedText);
        decrypted = Buffer.concat([decrypted, decipher.final()]);
        return decrypted.toString();
    }

    loadFromPersistence(key) {
        let string = this.persistentHandler.get(EncryptHelper.encodeKey(key));
        if (!!string) {
            try {
                string = JSON.parse(this.decrypt(string));
                if (!!string.__value__) {
                    string = string.__value__;
                }
            } catch (error) {
            }
        }
        return string;
    }

    saveToPersistence(key, value, time = null) {
        let string = value == null ? null : JSON.stringify("object" === typeof(value) ? value : {__value__: value});
        if (!!string) {
            string = this.encrypt(string);
        }
        this.persistentHandler.set(EncryptHelper.encodeKey(key), string, time);
    }

    static simpleBiEncrypt(string) {
        if ("string" !== typeof(string)) {
            return string;
        }
        let output = "";
        for (let index = 0; index < string.length; index++) {
            let s = string[index];
            let upper = s.toUpperCase();
            if (s === upper) {
                output += s.toLowerCase();
            } else {
                output += upper;
            }
        }
        return output;
    }
}

// exports.EncryptHelper = EncryptHelper;
