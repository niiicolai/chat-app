import model from '../models/room_invite_link.js';
import dto from '../dtos/room_invite_link.js';
import ControllerError from '../errors/controller_error.js';
import RoomService from './room_service.js';
import UserRoomService from './user_room_service.js';
import RoomSettingService from './room_setting_service.js';
import ChannelService from './channel_service.js';
import ChannelMessageService from './channel_message_service.js';
import { v4 as uuidV4 } from 'uuid';
import UserService from './user_service.js';

const createWelcomeMessage = async (room, setting, user) => {
    const me = await UserService.me(user);
    const room_uuid = room.uuid;

    let channel = null;
    if (setting.join_channel_uuid) {
        channel = await ChannelService.findOne({ pk: setting.join_channel_uuid, user });
    } else {
        const channels = await ChannelService.findAll({ room_uuid, user });
        if (channels.data.length > 0) {
            channel = channels.data[0];
        }
    }

    if (channel) {
        ChannelMessageService.create({
            body: {
                uuid: uuidV4(),
                channel_uuid: channel.uuid,
                user_uuid: user.sub,
                body: `${me.username} ${setting.join_message || 'joined the room! 👻'}`,
                created_by_system: 1
            },
            user
        });
    }
}


class RoomInviteLinkService {
    constructor() {
        // For the controller
        this.model = model;
        this.dto = dto;
    }

    template() {
        return this.model.template();
    }

    async findOne(findArgs = { pk: null }) {
        if (!findArgs.pk)
            throw new ControllerError(400, 'Primary key is required');

        const { pk } = findArgs;
        const resource = await model.findOne(model
            .optionsBuilder()
            .findOne(pk)
            .build());

        if (!resource)
            throw new ControllerError(404, 'Room invite link not found');

        return dto(resource);
    }

    async findAll(findAllArgs = { page, limit, room_uuid: null, user: null }) {
        if (!findAllArgs.room_uuid)
            throw new ControllerError(400, 'Room uuid is required');
        if (!findAllArgs.user)
            throw new ControllerError(400, 'User is required');

        const { page, limit, user, room_uuid } = findAllArgs;

        if (!await UserRoomService.isInRoom({ room_uuid, user, room_role_name: null }))
            throw new ControllerError(403, 'Forbidden');

        const options = model
            .optionsBuilder()
            .findAll(page, limit)
            .where('room_uuid', room_uuid)
            .include(RoomService.model, 'uuid', 'room_uuid')
            .orderBy('roominvitelink.created_at DESC')
            .build()

        const total = await model.count(options);
        const links = await model.findAll(options);
        const pages = Math.ceil(total / limit);
        const data = links.map(link => dto(link));

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
        if (!createArgs.body.room_uuid)
            throw new ControllerError(400, 'room_uuid is required');
        if (!createArgs.body.expires_at)
            throw new ControllerError(400, 'expires_at is required');
        if (!createArgs.body.uuid)
            throw new ControllerError(400, 'uuid is required');
        if (!createArgs.user)
            throw new ControllerError(400, 'User is required');

        const pk = createArgs.body[model.pk];
        if (pk && await model.findOne({ pk })) {
            throw new ControllerError(400, 'Resource already exists');
        }

        const user = createArgs.user;
        if (! await UserRoomService.isInRoom({ room_uuid: createArgs.body.room_uuid, user, room_role_name: 'Admin' }))
            throw new ControllerError(403, 'Forbidden');

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
        const roomInviteLink = await this.findOne({ pk });
        if (!roomInviteLink)
            throw new ControllerError(404, 'room invite link not found');

        const room_uuid = roomInviteLink.room_uuid;
        const user = updateArgs.user;
        if (! await UserRoomService.isInRoom({ room_uuid, user, room_role_name: 'Admin' }))
            throw new ControllerError(403, 'Forbidden');

        if (!body.room_uuid)
            body.room_uuid = room_uuid;

        await model.update({ pk, body });

        return await this.findOne({ pk });
    }

    // Not public, so it require a user object
    async destroy(destroyArgs = { pk: null, user: null }) {
        if (!destroyArgs.pk)
            throw new ControllerError(400, 'Primary key value is required (pk)');
        if (!destroyArgs.user)
            throw new ControllerError(400, 'User is required');

        const { pk } = destroyArgs;
        const roomInviteLink = await this.findOne({ pk });
        if (!roomInviteLink)
            throw new ControllerError(404, 'room invite link not found');

        const room_uuid = roomInviteLink.room_uuid;
        const user = destroyArgs.user;
        if (! await UserRoomService.isInRoom({ room_uuid, user, room_role_name: 'Admin' }))
            throw new ControllerError(403, 'Forbidden');

        await model.destroy({ pk });
    }

    async joinLink(joinLinkArgs = { uuid: null, user: null }) {
        if (!joinLinkArgs.uuid)
            throw new ControllerError(400, 'uuid is required');
        if (!joinLinkArgs.user)
            throw new ControllerError(400, 'User is required');

        const links = await model.findAll(model
            .optionsBuilder()
            .where('uuid', joinLinkArgs.uuid)
            .build());

        if (links.length === 0)
            throw new ControllerError(404, 'Link not found');

        const link = links[0];
        const room_uuid = link.room_invite_link_room_uuid;
        const user = joinLinkArgs.user;
        if (await UserRoomService.isInRoom({ room_uuid, user, room_role_name: null }))
            throw new ControllerError(400, 'Already a member');

        const roomSetting = await RoomSettingService.findOne({ room_uuid });
        if (!roomSetting)
            throw new ControllerError(404, 'Room setting not found');

        const userRoomsCount = await UserRoomService.count({ where: { room_uuid } });
        if (userRoomsCount >= roomSetting.max_members)
            throw new ControllerError(400, 'Room is full');

        const userRoom = await UserRoomService.create({
            body: {
                uuid: uuidV4(),
                room_uuid,
                room_role_name: 'Member'
            },
            user: joinLinkArgs.user
        });
        const room = await RoomService.findOne({ pk: room_uuid, user: joinLinkArgs.user });

        await createWelcomeMessage(room, roomSetting, joinLinkArgs.user);
        

        return {
            room,
            userRoom
        };
    }
}

// Create a new service
const service = new RoomInviteLinkService();

// Export the service
export default service;
