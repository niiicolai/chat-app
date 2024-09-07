import UserRoomService from './user_room_service.js';
import ControllerError from '../errors/controller_error.js';
import RoomSettingService from './room_setting_service.js';
import model from '../models/channel.js';
import dto from '../dtos/channel.js';

class ChannelService {
    constructor() {
        this.model = model;
        this.dto = dto;
    }

    template() {
        return this.model.template();
    }

    async findOne(findArgs = { pk: null, user: null }) {
        const channel = await model
            .throwIfNotPresent(findArgs.pk, 'uuid is required')
            .throwIfNotPresent(findArgs.user, 'user is required')
            .find()
            .where(model.pk, findArgs.pk)
            .throwIfNotFound()
            .dto(dto)
            .executeOne();

        const { user } = findArgs;
        const { room_uuid } = channel;
        if (!await UserRoomService.isInRoom({ room_uuid, user, room_role_name: null }))
            throw new ControllerError(403, 'Forbidden');

        return channel;
    }

    async isInRoom(findArgs = { channel_uuid: null, user: null, room_role_name: null }) {
        const channel = await model
            .throwIfNotPresent(findArgs.channel_uuid, 'channel_uuid is required')
            .throwIfNotPresent(findArgs.user, 'User is required')
            .find()
            .where(model.pk, findArgs.channel_uuid)
            .throwIfNotFound()
            .executeOne(dto);

        const room_uuid = channel.channel_room_uuid;
        const user = findArgs.user;
        const room_role_name = findArgs.room_role_name;
        const isUserInRoom = await UserRoomService.isInRoom({
            room_uuid: channel.channel_room_uuid,
            user,
            room_role_name
        });

        return isUserInRoom;
    }

    async findAll(findAllArgs = { page: 1, limit: 10, room_uuid: null, user: null }) {
        model.throwIfNotPresent(findAllArgs.room_uuid, 'room_uuid is required')
             .throwIfNotPresent(findAllArgs.user, 'user is required')

        const { page, limit, user, room_uuid } = findAllArgs;
        if (!await UserRoomService.isInRoom({ room_uuid, user, room_role_name: null }))
            throw new ControllerError(403, 'Forbidden');

        return await model
            .find({ page, limit })
            .where('room_uuid', room_uuid)
            .orderBy('channel.created_at DESC')
            .dto(dto)
            .meta()
            .execute();
    }

    async create(createArgs = { body: null, user: null }, transaction) {
        if (!createArgs.body) throw new ControllerError(400, 'Resource body is required');
        if (!createArgs.body.name) throw new ControllerError(400, 'name is required');
        if (!createArgs.body.description) throw new ControllerError(400, 'description is required');
        if (!createArgs.body.room_uuid) throw new ControllerError(400, 'room_uuid is required');
        if (!createArgs.body.channel_type_name) throw new ControllerError(400, 'channel_type_name is required');
        if (!createArgs.body.uuid) throw new ControllerError(400, 'uuid is required');
        if (!createArgs.user) throw new ControllerError(400, 'User is required');

        await this.model
            .find()
            .where('uuid', createArgs.body.uuid)
            .throwIfNotFound('A channel with the same uuid already exists')
            .executeOne();

        await this.model
            .find()
            .where('name', createArgs.body.name)
            .where('channel_type_name', createArgs.body.channel_type_name)
            .throwIfNotFound('A channel with the same name and type already exists')
            .executeOne();

        const room_uuid = createArgs.body.room_uuid;
        const user = createArgs.user;
        if (!await UserRoomService.isInRoom({ room_uuid, user, room_role_name: 'Admin' }))
            throw new ControllerError(403, 'Forbidden');

        const roomSetting = await RoomSettingService.findOne({ room_uuid });
        if (!roomSetting)
            throw new ControllerError(404, 'Room setting not found');

        const channelsCount = await model
            .count()
            .where('room_uuid', room_uuid)
            .execute();
        if (channelsCount >= roomSetting.max_channels)
            throw new ControllerError(400, 'Room channel limit reached');

        await model
            .create(createArgs.body)
            .transaction(transaction)
            .execute();

        return await this.findOne({ pk });
    }

    // Not public, so it require a user object
    async update(updateArgs = { pk: null, body: null, user: null }, transaction) {
        if (!updateArgs.pk)
            throw new ControllerError(400, 'Primary key value is required (pk)');
        if (!updateArgs.body)
            throw new ControllerError(400, 'Resource body is required');
        if (!updateArgs.user)
            throw new ControllerError(400, 'User is required');

        const { body, pk } = updateArgs;
        const channel = await this.findOne({ pk, user: updateArgs.user });
        if (!channel) throw new ControllerError(404, 'channel not found');

        const room_uuid = channel.room_uuid;
        const user = updateArgs.user;
        if (!await UserRoomService.isInRoom({ room_uuid, user, room_role_name: 'Admin' }))
            throw new ControllerError(403, 'Forbidden');

        await model
            .update(body)
            .where(model.pk, pk)
            .transaction(transaction)
            .execute();

        return await this.findOne({ pk, user: updateArgs.user });
    }

    async destroy(destroyArgs = { pk: null, user: null }, transaction) {
        if (!destroyArgs.pk)
            throw new ControllerError(400, 'Primary key value is required (pk)');
        if (!destroyArgs.user)
            throw new ControllerError(400, 'User is required');

        const { pk } = destroyArgs;
        const channel = await this.findOne({ pk, user: destroyArgs.user });
        if (!channel) throw new ControllerError(404, 'channel not found');

        const room_uuid = channel.room_uuid;
        const user = destroyArgs.user;
        if (!await UserRoomService.isInRoom({ room_uuid, user, room_role_name: 'Admin' }))
            throw new ControllerError(403, 'Forbidden');

        await model
            .destroy()
            .where(model.pk, pk)
            .transaction(transaction)
            .execute();
    }
}

// Create a new service
const service = new ChannelService();

// Export the service
export default service;
