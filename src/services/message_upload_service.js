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
        return await model
            .throwIfNotPresent(findArgs.channel_uuid, 'channel_uuid is required')
            .throwIfNotPresent(findArgs.field, 'field is required')
            .sum({field: findArgs.field})
            .include(ChannelMessageService.model, 'uuid', 'channel_message_uuid')
            .where('channel_uuid', findArgs.channel_uuid)
            .execute();
    }

    /**
     * @function create
     * @description Create a message upload
     * @param {Object} data The message upload data
     * @param {Object} file The file data
     * @returns {Object} The user and token
     */
    async create(data, file, transaction) {
        await model.throwIfNotPresent(data, 'Data is required')
            .throwIfNotPresent(data.uuid, 'UUID is required')
            .throwIfNotPresent(data.channel_message_uuid, 'Message Channel UUID is required')
            .throwIfNotPresent(file, 'File is required');

        data.src = await upload(data.uuid, file);
        data.size = file.size;
        data.upload_type_name = getUploadType(file.mimetype);

        await model.create({body: data}).transaction(transaction).execute();

        return await model
            .find()
            .where('uuid', data.uuid)
            .dto(dto)
            .executeOne();
    }

    async destroy(destroyArgs = { pk: null, user: null }, transaction) {
        await model
            .throwIfNotPresent(destroyArgs.pk, 'Primary key value is required (pk)')
            .throwIfNotPresent(destroyArgs.user, 'User is required')
            .find()
            .where('uuid', destroyArgs.pk)
            .throwIfNotFound()
            .executeOne();

        await model
            .destroy()
            .where('uuid', destroyArgs.pk)
            .transaction(transaction)
            .execute();
    }
}

const service = new MessageUploadService({ model, dto });

export default service;
