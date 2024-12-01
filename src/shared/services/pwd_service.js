import bcrypt from 'bcrypt';

const SALT_ROUNDS = 10;

/**
 * @class PwdService
 * @description Service for handling passwords.
 * @exports PwdService
 */
export default class PwdService {

    /**
     * @function hash
     * @description Hash a password.
     * @param {string} password
     * @returns {Promise<string>}
     */
    static async hash(password) {
        if (!password) throw new Error('Password is required.');
        if (typeof password !== 'string') throw new Error('Password must be a string.');

        return bcrypt.hash(password, SALT_ROUNDS);
    }

    /**
     * @function compare
     * @description Compare a password to a hash.
     * @param {string} password
     * @param {string} hash
     * @returns {Promise<boolean>}
     */
    static async compare(password, hash) {
        if (!password) throw new Error('Password is required.');
        if (typeof password !== 'string') throw new Error('Password must be a string.');
        if (!hash) throw new Error('Hash is required.');
        if (typeof hash !== 'string') throw new Error('Hash must be a string.');

        return await bcrypt.compare(password, hash);
    }
}

