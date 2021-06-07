const request = require('request');
const VERIFY_URL = "https://www.google.com/recaptcha/api/siteverify";

class ReCaptcha {
   constructor(secret) {
      this.secret = secret;
   }

   verify(remoteAddr, code, callback) {
      // There is an undocumented requirement to use application/x-www-form-urlencoded, so stick with 'form' here
      // instead of using an application/json request.
      return request.post({
         url: VERIFY_URL,
         form: {
            secret: this.secret,
            response: code,
            remoteip: remoteAddr
         }
      }, callback);
   }

   /**
    * Get a message for a given verification service error code.
    *
    * @param errorCodes - The error codes array.
    * @return - The error message. In the case there are multiple (unlikely) they are concatenated.
    * @see https://developers.google.com/recaptcha/docs/verify#error_code_reference for available error codes.
    */
   getErrorMessage(errorCodes) {
      const errorMessages = [];

      if (errorCodes && errorCodes.length) {
         errorCodes.forEach(errorCode => {
            switch (errorCode) {
               case 'missing-input-secret':
               case 'invalid-input-secret':
               case 'missing-input-response':
               case 'invalid-input-response':
               case 'bad-request':
               case 'invalid-keys': // invalid-keys is currently undocumented but a valid code.
                  errorMessages.push('Invalid reCAPTCHA validation request');
                  break;
               case 'timeout-or-duplicate':
                  errorMessages.push('The reCAPTCHA token is no longer valid. Please try again');
                  break;
               default:
                  errorMessages.push('No further information available');
                  break;
            }
         });
      }

      if (!errorMessages.length) {
         errorMessages.push('No further information available');
      }

      const uniqueErrorMessages = [...new Set(errorMessages)];
      return uniqueErrorMessages.join('; ') + '.';
   }
}

module.exports = ReCaptcha;