
import ControllerError from '../errors/controller_error.js';
import StorageService from './storage_service.js';
import model from '../models/message_upload.js';
import dto from '../dtos/message_upload.js';

const storageService = new StorageService('message_uploads');
const upload = async (file) => {
    const { buffer, mimetype } = file;
    const filename = `${uuid}.${mimetype.split('/')[1]}`;
    return await storageService.uploadFile(buffer, filename);
};

/**
 * @class MessageUploadService
 * @extends BaseCrudService
 */
class MessageUploadService  {
    constructor() {
        this.model = model;
        this.dto = dto;
    }

    /**
     * @function create
     * @description Create a message upload
     * @param {Object} data The message upload data
     * @param {Object} file The file data
     * @returns {Object} The user and token
     */
    async create(data, file) {
        if (!file) throw new ControllerError('File is required', 400);
        data.src = await upload(file);
        const messageUpload = await super.create(data);
        return this.dto(messageUpload);
    }

    /**
     * @function update
     * @description update a message upload
     * @param {Object} data The message upload data
     * @param {Object} file The file data
     * @returns {Object} The user and token
     */
    async update(data, file) {
        if (file) data.src = await upload(file);
        const messageUpload = await super.update(data);
        return this.dto(messageUpload);
    }
}

// Create a new service
const service = new MessageUploadService({ model, dto });

// Export the service
export default {model,dto};
