import jwt from 'jsonwebtoken';
import validator from 'validator';


/**
 * @const SECRET
 * @description The secret used to sign the token.
 */
const SECRET = process.env.JWT_SECRET;
if (!SECRET) console.error('JWT_SECRET is not defined in the .env file.\n  - Authenticating users is currently not configured correct.\n  - You can generate a secret by running: node -e "console.log(require(\'crypto\').randomBytes(64).toString(\'hex\'))"'); 


/**
 * @const EXPIRE
 * @description The time in seconds before the token expires.
 */
const EXPIRE = process.env.JWT_EXPIRE ? parseInt(process.env.JWT_EXPIRE) : null;
if (!EXPIRE) console.error('ERROR: JWT_EXPIRE is not defined in the .env file.\n  - Authenticating users is currently not configured correct.\n  - Please add JWT_EXPIRE=3600 to the .env file to expire tokens after 1 hour.');
if (EXPIRE && EXPIRE < 1) console.error('ERROR: JWT_EXPIRE must be greater than 0.\n  - Authenticating users is currently not configured correct.\n  - Please add a valid number to the .env file to expire tokens after a certain amount of time.');


/**
 * @class JwtService
 * @description Service for handling JWT tokens.
 */
export default class JwtService {

    /**
     * @function sign
     * @description Sign a token with the provided subject.
     * @param {String} sub
     * @returns {String}
     * @throws {Error} If the sub is not provided.
     * @throws {Error} If the sub is not a string.
     * @throws {Error} If the sub is not a valid UUID.
     */
    static sign(sub) {
        if (!sub) throw new Error('Sub is required.');
        if (typeof sub !== 'string') throw new Error('Sub must be a string.');
        if (!validator.isUUID(sub)) throw new Error('Sub must be a valid UUID.');

        const iat = Math.floor(Date.now() / 1000); // iat - issued at (in seconds)
        const exp = iat + EXPIRE;                  // exp - expires at (in seconds)
        const payload = { sub, iat, exp };         // sub - subject (uuid)
        
        return jwt.sign(payload, SECRET);
    }

    
    /**
     * @function verifyAndDecodeToken
     * @description Verify a token and return the payload.
     * @param {String} token
     * @returns {Object}
     * @throws {Error} If the token is not provided.
     * @throws {Error} If the token is not a valid JWT.
     */
    static verifyAndDecodeString(token) {
        if (!token) throw new Error('Token is required.');
        if (typeof token !== 'string') throw new Error('Token must be a string.');
        if (!validator.isJWT(token)) throw new Error('Token must be a valid JWT.');

        return jwt.verify(token, SECRET);
    }

    /**
     * @function verifyAndDecodeHTTPHeader
     * @description Verify a token from the HTTP header and return the payload.
     * @param {Object} options
     * @param {String} options.authorization
     * @returns {Object | null}
     */
    static verifyAndDecodeHTTPHeader(options = { authorization: null }) {
        if (!options
         || !options.authorization
         || !options.authorization.startsWith('Bearer ')
         || !options.authorization.length > 7) return null;

        return JwtService.verifyAndDecodeString(options.authorization.substring(7));
    }
}

