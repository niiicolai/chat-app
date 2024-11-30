import Tokens from 'csrf';

/**
 * @const SECRET
 * @description The secret used to sign the token.
 */
const SECRET = process.env.CSRF_SECRET;
if (!SECRET) console.error('CSRF_SECRET is not defined in the .env file.'); 

const token = Tokens();

/**
 * @class CsrfService
 * @description Service for handling CSRF tokens.
 */
export default class CsrfService {

    /**
     * @function create
     * @description Create a CSRF token.
     * @returns {String}
     */
    static create() {
        return token.create(SECRET);
    }
    
    /**
     * @function isValid
     * @description Verify a CSRF token.
     * @param {String} token
     * @returns {Boolean}
     */
    static isValid(token) {
        if (!token) throw new Error('Token is required.');
        if (typeof token !== 'string') throw new Error('Token must be a string.');

        return !!csrf.token(token, SECRET);
    }
}
