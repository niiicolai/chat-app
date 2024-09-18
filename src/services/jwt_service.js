import jwt from 'jsonwebtoken';

/**
 * @const SECRET
 * @description The secret used to sign the token.
 */
const SECRET = process.env.JWT_SECRET;

/**
 * @const EXPIRE
 * @description The time in seconds before the token expires.
 */
const EXPIRE = parseInt(process.env.JWT_EXPIRE);

/**
 * @class MessageUploadService
 * @description crud service for message uploads.
 * @exports RoomInviteLinkService
 */
export default class JwtService {

    static getUserFromToken(options = { authorization: null }) {
        let { authorization: token } = options;
    
        if (!token) return null;
        if (!token.startsWith('Bearer ')) return null;
    
        token = token.slice(7, token.length);
        const user = JwtService.verify(token);
        if (!user) return null;
        
        return user;
    }

    /**
     * @function sign
     * @description Sign a token with the provided sub.
     * @param {String} sub
     * @returns {String}
     */
    static sign(sub) {
        /**
         * iat - issued at (in seconds)
         * exp - expires at (in seconds)
         * sub - subject
         */
        const iat = Math.floor(Date.now() / 1000);
        const exp = iat + EXPIRE;
        const payload = { sub, iat, exp };
        
        /**
         * Sign the token with the payload and secret.
         */
        return jwt.sign(payload, SECRET);
    }

    /**
     * @function verify
     * @description Verify a token.
     * @param {String} token
     * @returns {Object}
     */
    static verify(token) {
        return jwt.verify(token, SECRET);
    }
}
