import Uploader from './uploader.js';
import ControllerError from '../errors/controller_error.js';

const USER_AVATAR_SIZE = process.env.USER_AVATAR_SIZE ? parseInt(process.env.USER_AVATAR_SIZE) : null;
if (!USER_AVATAR_SIZE) console.error('USER_AVATAR_SIZE is not defined in the .env file.\n  - User avatar uploads are currently not configured correct.\n  - Add USER_AVATAR_SIZE=5242880 to the .env file.');

export default class UserAvatarUploader extends Uploader {

    constructor() {
        super('user_avatar');
    }

    async create(file, uniqueIdentifier, ACL = 'public-read') {
        if (!file) throw new Error('file is required');
        if (!uniqueIdentifier) throw new Error('uniqueIdentifier is required');
        
        if (file.size > USER_AVATAR_SIZE) {
            throw new ControllerError(413, 'File exceeds single file size limit');
        }

        return await super.create(file, uniqueIdentifier, ACL);
    }

    async update(url, file, uniqueIdentifier, ACL = 'public-read') {
        if (!url) throw new Error('url is required');
        if (!file) throw new Error('file is required');
        if (!uniqueIdentifier) throw new Error('uniqueIdentifier is required');

        if (file.size > USER_AVATAR_SIZE) {
            throw new ControllerError(413, 'File exceeds single file size limit');
        }

        return await super.update(url, file, uniqueIdentifier, ACL);
    }

    async destroy(url) {
        if (!url) throw new Error('url is required');

        return await super.destroy(url);
    }
}
