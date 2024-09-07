import UploadError from "../errors/upload_error.js";
import ControllerError from '../errors/controller_error.js';
import StorageService from './storage_service.js';
import model from '../models/message_upload.js';
import dto from '../dtos/message_upload.js';
import ChannelMessageService from './channel_message_service.js';

const storageService = new StorageService('message_uploads');
const upload = async (uuid, file) => {
    try {
        const { buffer, mimetype } = file;
        const originalname = file.originalname.split('.').slice(0, -1).join('.');
        const timestamp = new Date().getTime();
        const filename = `${originalname}-${uuid}-${timestamp}.${mimetype.split('/')[1]}`;
        return await storageService.uploadFile(buffer, filename);
    } catch (error) {
        if (error instanceof UploadError) 
            throw new ControllerError(400, error.message);

        throw new ControllerError(500, error.message);
    }
};

const types = ['Image', 'Video', 'Document'];
const getUploadType = (mimetype) => {
    if (['image/jpeg', 'image/png', 'image/gif'].includes(mimetype)) return 'Image';
    if (['video/mp4', 'video/quicktime'].includes(mimetype)) return 'Video';
    return 'Document';
}

/**
 * @class MessageUploadService
 * @extends BaseCrudService
 */
class MessageUploadService  {
    constructor() {
        this.model = model;
        this.dto = dto;
    }

    async sum(findArgs = { channel_uuid: null, field: null }) {
        if (!findArgs.channel_uuid)
            throw new ControllerError(400, 'channel_uuid is required');
        if (!findArgs.field)
            throw new ControllerError(400, 'field is required');

        const { channel_uuid, field } = findArgs;
        const sum = await model.sum(model
            .optionsBuilder()
            .sum(field)
            .include(ChannelMessageService.model, 'uuid', 'channel_message_uuid')
            .where('channel_uuid', channel_uuid)
            .build());

        return sum;
    }

    /**
     * @function create
     * @description Create a message upload
     * @param {Object} data The message upload data
     * @param {Object} file The file data
     * @returns {Object} The user and token
     */
    async create(data, file, transaction) {
        if (!data.uuid) throw new ControllerError('UUID is required', 400);
        if (!data.channel_message_uuid) throw new ControllerError('Message Channel UUID is required', 400);
        if (!file) throw new ControllerError('File is required', 400);
        data.src = await upload(data.uuid, file);
        data.size = file.size;
        data.upload_type_name = getUploadType(file.mimetype);
        await model.create({body: data, transaction});
        const messageUpload = await model.findOne({pk: data.uuid});

        return this.dto(messageUpload);
    }

    async destroy(destroyArgs = { pk: null, user: null }, transaction) {
        if (!destroyArgs.pk)
            throw new ControllerError(400, 'Primary key value is required (pk)');
        if (!destroyArgs.user)
            throw new ControllerError(400, 'User is required');

        const { pk } = destroyArgs;
        const messageUpload = await model.findOne({ pk });
        if (!messageUpload)
            throw new ControllerError(404, 'messageUpload not found');

        await model.destroy({ pk, transaction });
    }
}

// Create a new service
const service = new MessageUploadService({ model, dto });

// Export the service
export default service;
