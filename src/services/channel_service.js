import UserRoomService from './user_room_service.js';
import ControllerError from '../errors/controller_error.js';
import RoomSettingService from './room_setting_service.js';
import model from '../models/channel.js';
import dto from '../dtos/channel.js';

class ChannelService {
    constructor() {
        // For the controller
        this.model = model;
        this.dto = dto;
    }

    template() {
        return this.model.template();
    }

    async findOne(findArgs = { pk: null, user: null }) {
        if (!findArgs.pk)
            throw new ControllerError(400, 'Primary key is required');
        if (!findArgs.user)
            throw new ControllerError(400, 'User is required');

        const { pk, user } = findArgs;
        const channel = await model.findOne(model
            .optionsBuilder()
            .findOne(pk)
            .build());

        if (!channel)
            throw new ControllerError(404, 'channel not found');

        const room_uuid = channel.channel_room_uuid;
        if (!await UserRoomService.isInRoom({ room_uuid, user, room_role_name: null }))
            throw new ControllerError(403, 'Forbidden');

        return dto(channel);
    }

    async isInRoom(findArgs = { channel_uuid: null, user: null, room_role_name: null }) {
        if (!findArgs.channel_uuid)
            throw new ControllerError(400, 'channel_uuid is required');
        if (!findArgs.user)
            throw new ControllerError(400, 'User is required');

        const channel = await model.findOne(model
            .optionsBuilder()
            .findOne(findArgs.channel_uuid)
            .build());

        if (!channel)
            throw new ControllerError(404, 'channel not found');

        const room_uuid = channel.channel_room_uuid;
        const user = findArgs.user;
        const room_role_name = findArgs.room_role_name;
        const isUserInRoom = await UserRoomService.isInRoom({ 
            room_uuid, 
            user, 
            room_role_name 
        });
            
        return isUserInRoom;
    }

    async findAll(findAllArgs = { page: 1, limit: 10, room_uuid: null, user: null }) {
        if (!findAllArgs.user)
            throw new ControllerError(400, 'User is required');
        if (!findAllArgs.room_uuid)
            throw new ControllerError(400, 'room_uuid is required');

        const { page, limit, user, room_uuid } = findAllArgs;
        if (!await UserRoomService.isInRoom({ room_uuid, user, room_role_name: null }))
            throw new ControllerError(403, 'Forbidden');

        const options = model
            .optionsBuilder()
            .findAll(page, limit)
            .where('room_uuid', room_uuid)
            .orderBy('channel.created_at DESC')
            .build()
            const channels = await model.findAll(options);
        const total = await model.count(options);
       
        const pages = Math.ceil(total / limit);
        const data = channels.map(channel => dto(channel));        

        return {
            data,
            meta: {
                total,
                page,
                pages
            }
        };
    }

    async create(createArgs = { body: null, user: null }) {
        if (!createArgs.body)
            throw new ControllerError(400, 'Resource body is required');
        if (!createArgs.body.name)
            throw new ControllerError(400, 'name is required');
        if (!createArgs.body.description)
            throw new ControllerError(400, 'description is required');
        if (!createArgs.body.room_uuid)
            throw new ControllerError(400, 'room_uuid is required');
        if (!createArgs.body.channel_type_name)
            throw new ControllerError(400, 'channel_type_name is required');
        if (!createArgs.body.uuid)
            throw new ControllerError(400, 'uuid is required');
        if (!createArgs.user)
            throw new ControllerError(400, 'User is required');

        const pk = createArgs.body[model.pk];
        if (pk && await model.findOne({ pk })) {
            throw new ControllerError(400, 'A channel with the same primary key already exists');
        }

        const nameAndTypeCheck = await model.findOneByField({
            fieldName: 'name',
            fieldValue: createArgs.body.name,
            where: { room_uuid: createArgs.body.room_uuid }
        });
        if (nameAndTypeCheck && nameAndTypeCheck.channel_type_name == createArgs.body.channel_type_name)
            throw new ControllerError(400, 'A channel with the same name and type already exists in the room');

        const room_uuid = createArgs.body.room_uuid;
        const user = createArgs.user;
        if (!await UserRoomService.isInRoom({ room_uuid, user, room_role_name: 'Admin' }))
            throw new ControllerError(403, 'Forbidden');

        const roomSetting = await RoomSettingService.findOne({ room_uuid });
        if (!roomSetting)
            throw new ControllerError(404, 'Room setting not found');

        const channelsCount = await model.count({ where: { room_uuid } });
        if (channelsCount >= roomSetting.max_channels)
            throw new ControllerError(400, 'Room channel limit reached');

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

        const { body, pk } = updateArgs;
        const channel = await this.findOne({ pk, user: updateArgs.user });
        if (!channel)
            throw new ControllerError(404, 'channel not found');

        const room_uuid = channel.room_uuid;
        const user = updateArgs.user;
        if (!await UserRoomService.isInRoom({ room_uuid, user, room_role_name: 'Admin' }))
            throw new ControllerError(403, 'Forbidden');

        await model.update({ pk, body });

        return await this.findOne({ pk, user: updateArgs.user });
    }

    // Not public, so it require a user object
    async destroy(destroyArgs = { pk: null, user: null }) {
        if (!destroyArgs.pk)
            throw new ControllerError(400, 'Primary key value is required (pk)');
        if (!destroyArgs.user)
            throw new ControllerError(400, 'User is required');

        const { pk } = destroyArgs;
        const channel = await this.findOne({ pk, user: destroyArgs.user });
        if (!channel)
            throw new ControllerError(404, 'channel not found');
        
        const room_uuid = channel.room_uuid;
        const user = destroyArgs.user;
        if (!await UserRoomService.isInRoom({ room_uuid, user, room_role_name: 'Admin' }))
            throw new ControllerError(403, 'Forbidden');

        await model.destroy({ pk });
    }
}

// Create a new service
const service = new ChannelService();

// Export the service
export default service;
