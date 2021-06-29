const SecretsManager = require("./secretsmanager");

class Secrets {
    constructor(options) {
        this.options = options;
        if(!options.isDev) {
           if(!options.region || !options.secretName) {
              throw new Error("Need both region and secretName in options");
           }
           this.manager = new SecretsManager(this.options.region);
        }
    }

    async googleKey() {
        if(this.options.isDev) {
            return this.options.googleKey;
        }
        return this.getSecretsKey("GOOGLE_KEY_VALUE");
    }

    async recaptchaPrivateKey() {
        if(this.options.isDev) {
            return this.options.recaptchaPrivateKey;
        }
        return this.getSecretsKey("RECAPTCHA_PRIVATE_KEY");
    }

    async getSecretsKey(name) {
        let secrets = await this.manager.getSecretValue(this.options.secretName);
        return JSON.parse(secrets)[name];
    }
}

module.exports = Secrets;
