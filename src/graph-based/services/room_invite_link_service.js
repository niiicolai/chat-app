import RoomInviteLinkServiceValidator from '../../shared/validators/room_invite_link_service_validator.js';
import ControllerError from '../../shared/errors/controller_error.js';
import RoomPermissionService from './room_permission_service.js';
import ChannelService from './channel_service.js';
import neodeInstance from '../neode/index.js';
import NeodeBaseFindService from './neode_base_find_service.js';
import dto from '../dto/room_invite_link_dto.js';
import { v4 as uuidv4 } from 'uuid';
import { getJoinMessage } from '../../shared/utils/join_message_utils.js';

class Service extends NeodeBaseFindService {
    constructor() {
        super('uuid', 'RoomInviteLink', dto);
    }

    async findOne(options = { uuid: null, user: null }) {
        RoomInviteLinkServiceValidator.findOne(options);

        const { user, uuid } = options;

        const linkInstance = await neodeInstance.model('RoomInviteLink').find(uuid);
        if (!linkInstance) throw new ControllerError(404, 'room_invite_link not found');

        const roomInstance = await linkInstance.get('room').endNode().properties();
        if (!roomInstance) throw new ControllerError(404, 'Room not found');

        if (!(await RoomPermissionService.isInRoom({ room_uuid: roomInstance.uuid, user, role_name: null }))) {
            throw new ControllerError(403, 'User is not in the room');
        }

        return dto(linkInstance.properties(), [{ room: roomInstance }]);
    }

    async findAll(options = { room_uuid: null, user: null, page: null, limit: null }) {
        RoomInviteLinkServiceValidator.findAll(options);

        const { room_uuid, user, page, limit } = options;

        if (!(await RoomPermissionService.isInRoom({ room_uuid, user, role_name: null }))) {
            throw new ControllerError(403, 'User is not in the room');
        }

        return super.findAll({ page, limit, override: {
            match: ['MATCH (ril:RoomInviteLink)-[:HAS_ROOM]->(r:Room {uuid: $room_uuid})'],
            return: ['ril', 'r'],
            map: { model: 'ril', relationships: [{ alias: 'r', to: 'room' }] },
            params: { room_uuid }
        }}); 
    }

    async create(options = { body: null, user: null }) {
        RoomInviteLinkServiceValidator.create(options);

        const { body, user } = options;
        const { uuid, room_uuid, expires_at } = body;

        if (expires_at && new Date(expires_at) < new Date()) {
            throw new ControllerError(400, 'The expiration date cannot be in the past');
        }

        if (!(await RoomPermissionService.isInRoom({ room_uuid, user, role_name: 'Admin' }))) {
            throw new ControllerError(403, 'User is not an admin of the room');
        }

        const roomInstance = await neodeInstance.model('Room').find(room_uuid);
        if (!roomInstance) throw new ControllerError(404, 'Room not found');

        const linkInstance = await neodeInstance.model('RoomInviteLink').create({
            uuid,
            expires_at: expires_at || null,
            created_at: new Date(),
            updated_at: new Date(),
        });

        await linkInstance.relateTo(roomInstance, 'room');
        
        return this.findOne({ uuid, user });
    }

    async update(options = { uuid: null, body: null, user: null }) {
        RoomInviteLinkServiceValidator.update(options);

        const { uuid, body, user } = options;
        const { expires_at } = body;

        const linkInstance = await neodeInstance.model('RoomInviteLink').find(uuid);
        if (!linkInstance) throw new ControllerError(404, 'Room Invite Link not found');

        const room = await linkInstance.get('room').endNode().properties();
        const room_uuid = room.uuid;
        if (!(await RoomPermissionService.isInRoom({ room_uuid, user, role_name: 'Admin' }))) {
            throw new ControllerError(403, 'User is not an admin of the room');
        }

        linkInstance.update({
            expires_at: expires_at || null,
            updated_at: new Date(),
        });

        return this.findOne({ uuid, user });
    }

    async destroy(options = { uuid: null, user: null }) {
        RoomInviteLinkServiceValidator.destroy(options);

        const { uuid, user } = options;

        const linkInstance = await neodeInstance.model('RoomInviteLink').find(uuid);
        if (!linkInstance) throw new ControllerError(404, 'room_invite_link not found');

        const room = await linkInstance.get('room').endNode().properties();
        const room_uuid = room.uuid;

        if (!(await RoomPermissionService.isInRoom({ room_uuid, user, role_name: 'Admin' }))) {
            throw new ControllerError(403, 'User is not an admin of the room');
        }

        await linkInstance.delete();
    }

    async join(options = { uuid: null, user: null }) {
        RoomInviteLinkServiceValidator.join(options);

        const { uuid, user } = options;
        const { sub: user_uuid } = user;

        const linkInstance = await neodeInstance.model('RoomInviteLink').find(uuid);
        if (!linkInstance) throw new ControllerError(404, 'Room Invite Link not found');
        const link = linkInstance.properties();

        const room = linkInstance.get('room').endNode().properties();
        const roomInstance = await neodeInstance.model('Room').find(room.uuid);

        if (!(await RoomPermissionService.isVerified({ user }))) {
            throw new ControllerError(403, 'You must verify your email before you can join a room');
        }

        if (link.expires_at && new Date(link.expires_at) < new Date()) {
            throw new ControllerError(400, 'Room Invite Link has expired');
        }

        if (await RoomPermissionService.isInRoom({ room_uuid: room.uuid, user, role_name: null })) {
            throw new ControllerError(400, 'User is already in room');
        }

        if (await RoomPermissionService.roomUserCountExceedsLimit({ room_uuid: room.uuid, add_count: 1 })) {
            throw new ControllerError(400, 'Room user count exceeds limit. The room cannot have more users');
        }

        const roomUserRole = await neodeInstance.model('RoomUserRole').find('Member');
        if (!roomUserRole) throw new ControllerError(500, 'RoomUserRole not found');

        const userInstance = await neodeInstance.model('User').find(user_uuid);
        if (!userInstance) throw new ControllerError(404, 'User not found');

        return neodeInstance.model('RoomUser').create({ uuid: uuidv4() })
            .then(async (roomUser) => {
                await Promise.all([
                    roomUser.relateTo(userInstance, 'user'),
                    roomUser.relateTo(roomInstance, 'room'),
                    roomUser.relateTo(roomUserRole, 'room_user_role'),
                ]);
            });

        /*
        const roomJoinSettings = roomInstance.get('room_join_settings').endNode().properties();
        const roomJoinSettingsInstance = await neodeInstance.model('RoomJoinSettings').find(roomJoinSettings.uuid);

        let channelId = roomJoinSettingsInstance.get('join_channel')?.endNode()?.properties()?.uuid;
        if (!channelId) {
            const channelResult = await ChannelService.findAll({ room_uuid: room.uuid, user });
            if (channelResult.data.length > 0) {
                channelId = channelResult.data[0].uuid;
            }
        }

        if (channelId) {
            const username = userInstance.properties().username;
            const joinMessage = roomJoinSettings.join_message;
            const body = getJoinMessage(joinMessage, [{ 
                key: 'name', value: username 
            }]);

            const session = neodeInstance.session();
            session.writeTransaction(async (transaction) => {
                await transaction.run(
                    `MATCH (u:User {uuid: $user_uuid})
                     MATCH (c:Channel {uuid: $channel_uuid})
                     MATCH (cmt:ChannelMessageType {name: 'System'})
                     CREATE (cm:ChannelMessage {uuid: $channel_message_uuid, body: $body})
                     CREATE (cm)-[:HAS_CHANNEL_MESSAGE_TYPE]->(cmt)
                     CREATE (cm)-[:HAS_CHANNEL]->(c)
                     CREATE (cm)-[:HAS_USER]->(u)
                    `,
                    { user_uuid, channel_uuid: channelId, channel_message_uuid: uuidv4(), body }
                );
            });
        }*/
    }
}

const service = new Service();

export default service;
