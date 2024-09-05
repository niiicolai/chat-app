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

    async findOne(findArgs = { room_uuid: null }) {
        if (!findArgs.room_uuid)
            throw new ControllerError(400, 'room_uuid is required');

        const { room_uuid } = findArgs;
        const roomSettings = await model.findAll(model
            .optionsBuilder()
            .where('room_uuid', room_uuid)
            .build());
            
        if (!roomSettings.length === 0)
            throw new ControllerError(404, 'room Setting not found');

        const roomSetting = roomSettings[0];

        return dto(roomSetting);
    }

    async create(createArgs = { body: null, user: null }) {
        if (!createArgs.body)
            throw new ControllerError(400, 'Resource body is required');
        if (!createArgs.body.total_upload_bytes)
            throw new ControllerError(400, 'total_upload_bytes is required');
        if (!createArgs.body.join_message)
            throw new ControllerError(400, 'join_message is required');
        if (!createArgs.body.max_channels)
            throw new ControllerError(400, 'max_channels is required');
        if (!createArgs.body.max_members)
            throw new ControllerError(400, 'max_channels is required');
        if (!createArgs.body.room_uuid)
            throw new ControllerError(400, 'max_channels is required');
        if (!createArgs.body.uuid)
            throw new ControllerError(400, 'uuid is required');
        if (!createArgs.user)
            throw new ControllerError(400, 'User is required');

        const pk = createArgs.body[model.pk];
        if (pk && await model.findOne({ pk })) {
            throw new ControllerError(400, 'Resource already exists');
        }

        const roomUuidCheck = await model.findOneByField({
            fieldName: 'room_uuid',
            fieldValue: createArgs.body.room_uuid
        });
        if (roomUuidCheck) throw new ControllerError(400, 'Room already has settings');

        await this.model.create(createArgs.body);
        const resource = await model.findOne({ pk });

        return dto(resource);
    }

    // Not public, so it require a user object
    async update(updateArgs = { pk: null, body: null, user: null }) {
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


        await model.update({ pk, body });

        const updatedRoomSetting = await model.findOne({ pk, user: updateArgs.user });

        return dto(updatedRoomSetting);
    }

    // Not public, so it require a user object
    async destroy(destroyArgs = { pk: null, user: null }) {
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

        await model.destroy({ pk });
    }
}

// Create a new service
const service = new RoomSettingService();

// Export the service
export default service;
