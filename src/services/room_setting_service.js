import ControllerError from '../errors/controller_error.js';
import model from '../models/room_setting.js';
import dto from '../dtos/room_setting.js';
import UserRoomService from './user_room_service.js';

class RoomSettingService {
    constructor() {
        // For the controller
        this.model = model;
        this.dto = dto;
    }

    template() {
        return this.model.template();
    }

    async canUpload(findArgs = { room_uuid: null, byteSize: null, user: null }) {
        const roomSetting = await model
            .throwIfNotPresent(findArgs.room_uuid, 'room_uuid is required')
            .throwIfNotPresent(findArgs.byteSize, 'byteSize is required')
            .throwIfNotPresent(findArgs.user, 'user is required')
            .find()
            .where('room_uuid', findArgs.room_uuid)
            .throwIfNotFound()
            .dto(dto)
            .executeOne();        
        
        const size = findArgs.byteSize;
        const uploadSizeMb = roomSetting.upload_bytes / 1000000;        
        const sizeMb = size / 1000000;

        if (size > roomSetting.upload_bytes)
            throw new ControllerError(400, `File size is too large. Maximum size is ${uploadSizeMb} MB. The file size is ${sizeMb} MB`);
        
        //const totalUploadSizeMb = roomSetting.total_upload_bytes / 1000000;
        //const sum = await MessageUploadService.sum({ channel_uuid: channel.uuid, field: 'size' });    
        //if ((sum + size) > roomSetting.total_upload_bytes)
            //throw new ControllerError(400, `The room has used ${sum / 1000000} MB of the total upload limit of ${roomSetting.total_upload_bytes / 1000000} MB. The file size is ${size / 1000000} MB and the new total would be ${(sum + size) / 1000000} MB`);
        console.log('todo: implement sum function');

        return true;
    }

    async findOne({ room_uuid }) {
        return await model
            .throwIfNotPresent(room_uuid, 'room_uuid is required')
            .find()
            .where('room_uuid', room_uuid)
            .throwIfNotFound()
            .dto(dto)
            .executeOne();
    }

    async create(createArgs = { body: null, user: null }, transaction) {
        await model.throwIfNotPresent(createArgs.body, 'Resource body is required')
            .throwIfNotPresent(createArgs.body.total_upload_bytes, 'total_upload_bytes is required')
            .throwIfNotPresent(createArgs.body.join_message, 'join_message is required')
            .throwIfNotPresent(createArgs.body.max_channels, 'max_channels is required')
            .throwIfNotPresent(createArgs.body.max_members, 'max_members is required')
            .throwIfNotPresent(createArgs.body.room_uuid, 'room_uuid is required')
            .throwIfNotPresent(createArgs.body.uuid, 'uuid is required')
            .throwIfNotPresent(createArgs.user, 'User is required');

        const pk = createArgs.body[model.pk];
        await model.find().where(model.pk, pk).throwIfFound().executeOne();
        await model.find().where('room_uuid', createArgs.body.room_uuid).throwIfFound('Room already has settings').executeOne();

        await this.model
            .create({ body: createArgs.body})
            .transaction(transaction)
            .execute();

        return await this.findOne({ room_uuid: createArgs.body.room_uuid });
    }

    // Not public, so it require a user object
    async update(updateArgs = { pk: null, body: null, user: null }, transaction) {
        if (!updateArgs.pk)
            throw new ControllerError(400, 'Primary key value is required (pk)');
        if (!updateArgs.body)
            throw new ControllerError(400, 'Resource body is required');
        if (!updateArgs.user)
            throw new ControllerError(400, 'User is required');
        if (updateArgs.body.total_upload_bytes)
            throw new ControllerError(400, 'total_upload_bytes cannot be updated');
        if (updateArgs.body.upload_bytes)
            throw new ControllerError(400, 'upload_bytes cannot be updated');
        if (updateArgs.body.max_channels)
            throw new ControllerError(400, 'max_channels cannot be updated');
        if (updateArgs.body.max_members)
            throw new ControllerError(400, 'max_members cannot be updated');
        if (updateArgs.body.room_uuid)
            throw new ControllerError(400, 'room_uuid cannot be updated');

        const { body, pk } = updateArgs;
        const roomSetting = await model.findOne({ pk, user: updateArgs.user });
        if (!roomSetting)
            throw new ControllerError(404, 'roomSetting not found');

        const room_uuid = roomSetting.room_setting_room_uuid;
        const user = updateArgs.user;
        if (!await UserRoomService.isInRoom({ room_uuid, user, room_role_name: 'Admin' }))
            throw new ControllerError(403, 'Forbidden');
        
        updateArgs.body.total_upload_bytes = roomSetting.room_setting_total_upload_bytes;
        updateArgs.body.upload_bytes = roomSetting.room_setting_upload_bytes;
        updateArgs.body.max_channels = roomSetting.room_setting_max_channels;
        updateArgs.body.max_members = roomSetting.room_setting_max_members;
        updateArgs.body.room_uuid = roomSetting.room_setting_room_uuid;


        await model.update({ pk, body, transaction });

        const updatedRoomSetting = await model.findOne({ pk, user: updateArgs.user });

        return dto(updatedRoomSetting);
    }

    // Not public, so it require a user object
    async destroy(destroyArgs = { pk: null, user: null }, transaction) {
        if (!destroyArgs.pk)
            throw new ControllerError(400, 'Primary key value is required (pk)');
        if (!destroyArgs.user)
            throw new ControllerError(400, 'User is required');

        const { pk } = destroyArgs;
        const roomSetting = await model.findOne({ pk, user: updateArgs.user });
        if (!roomSetting)
            throw new ControllerError(404, 'roomSetting not found');

        const room_uuid = roomSetting.room_setting_room_uuid;
        const user = updateArgs.user;
        if (!await UserRoomService.isInRoom({ room_uuid, user, room_role_name: 'Admin' }))
            throw new ControllerError(403, 'Forbidden');

        await model.destroy({ pk, transaction });
    }
}

// Create a new service
const service = new RoomSettingService();

// Export the service
export default service;
