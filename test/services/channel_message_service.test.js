import RelationalChannelMessageService from '../../src/relational-based/services/channel_message_service.js';
import RelationalChannelService from '../../src/relational-based/services/channel_service.js';
import RelationalRoomService from '../../src/relational-based/services/room_service.js';
import RelationalUserService from '../../src/relational-based/services/user_service.js';
import RelationalRoomInviteLinkService from '../../src/relational-based/services/room_invite_link_service.js';
import RelationalRoomUserService from '../../src/relational-based/services/room_user_service.js';

import DocumentChannelMessageService from '../../src/document-based/services/channel_message_service.js';
import DocumentChannelService from '../../src/document-based/services/channel_service.js';
import DocumentRoomService from '../../src/document-based/services/room_service.js';
import DocumentUserService from '../../src/document-based/services/user_service.js';
import DocumentRoomInviteLinkService from '../../src/document-based/services/room_invite_link_service.js';
import DocumentRoomUserService from '../../src/document-based/services/room_user_service.js';

import GraphChannelMessageService from '../../src/graph-based/services/channel_message_service.js';
import GraphChannelService from '../../src/graph-based/services/channel_service.js';
import GraphRoomService from '../../src/graph-based/services/room_service.js';
import GraphUserService from '../../src/graph-based/services/user_service.js';
import GraphRoomInviteLinkService from '../../src/graph-based/services/room_invite_link_service.js';
import GraphRoomUserService from '../../src/graph-based/services/room_user_service.js';

import { context } from '../context.js';
import { test, expect, beforeAll, afterAll, vi } from 'vitest';
import { v4 as uuidv4 } from 'uuid';

// Import for mocking the broadcastChannel function
// to check if it was called with the correct arguments
import { broadcastChannel } from '../../websocket_server.js';

vi.mock('../../websocket_server.js', () => ({
    broadcastChannel: vi.fn(),
}));

const channelMessageTest = (ChannelMessageService, ChannelService, RoomService, UserService, RoomInviteLinkService, RoomUserService, name) => {
    const room_uuid = uuidv4();
    const channel_uuid = uuidv4();
    const channel_message_uuid_admin = uuidv4();
    const channel_message_uuid_mod = uuidv4();
    const channel_message_uuid_member = uuidv4();
    const room_invite_link_uuid = uuidv4();
    const user = {
        uuid: uuidv4(),
        username: `test-${uuidv4()}`,
        email: `test-${uuidv4()}@example.com`,
        password: '12345678',
    };

    beforeAll(async () => {
        await RoomService.create({
            user: context.admin,
            body: {
                uuid: room_uuid,
                name: `test-${uuidv4()}`,
                description: "Test Room Description",
                room_category_name: "General"
            }
        });
        await ChannelService.create({
            user: context.admin,
            body: {
                uuid: channel_uuid,
                name: `test-${uuidv4()}`,
                description: "Test Channel Description",
                channel_type_name: "Text",
                room_uuid
            }
        });
        await UserService.create({
            body: user
        });
        await RoomInviteLinkService.create({
            user: context.admin,
            body: {
                uuid: room_invite_link_uuid,
                expires_at: null,
                room_uuid,
            }
        });
        await RoomInviteLinkService.join({
            user: context.mod,
            uuid: room_invite_link_uuid
        });
        await RoomInviteLinkService.join({
            user: context.member,
            uuid: room_invite_link_uuid
        });

        const modRoomUser = await RoomUserService.findAuthenticatedUser({ user: context.mod, room_uuid });
        await RoomUserService.update({
            user: context.admin,
            uuid: modRoomUser.uuid,
            body: { room_user_role_name: "Moderator" }
        }); 
    });

    afterAll(async () => {
        await RoomService.destroy({ uuid: room_uuid, user: context.admin });
    });

    test(`(${name}) - ChannelMessageService must implement expected methods`, () => {
        expect(ChannelMessageService).toHaveProperty('findOne');
        expect(ChannelMessageService).toHaveProperty('findAll');
        expect(ChannelMessageService).toHaveProperty('create');
        expect(ChannelMessageService).toHaveProperty('update');
        expect(ChannelMessageService).toHaveProperty('destroy');
    });

    test.each([
        [{ user: context.admin, body: { uuid: channel_message_uuid_admin, channel_uuid, body: `test-${uuidv4()}` } }],
        [{ user: context.mod, body: { uuid: channel_message_uuid_mod, channel_uuid, body: `test-${uuidv4()}` } }],
        [{ user: context.member, body: { uuid: channel_message_uuid_member, channel_uuid, body: `test-${uuidv4()}` } }],
    ])(`(${name}) - ChannelMessageService.create valid partitions`, async (options) => {
        const result = await ChannelMessageService.create(options);

        expect(result).toHaveProperty('uuid');
        expect(result).toHaveProperty('body');
        expect(result).toHaveProperty('channel_message_type_name');
        expect(result).toHaveProperty('user_uuid');
        expect(result).toHaveProperty('channel_uuid');
        expect(result).toHaveProperty('created_at');
        expect(result).toHaveProperty('updated_at');
        expect(result).toHaveProperty('user');
        expect(result.user).toHaveProperty('uuid');
        expect(result.user).toHaveProperty('username');
        expect(result.user).toHaveProperty('avatar_src');
        expect(result.user).not.toHaveProperty('email');
        expect(result.user).not.toHaveProperty('password');

        // Check if the method called broadcastChannel(string, string, object)
        expect(typeof broadcastChannel.mock.calls[0][0]).toBe('string');
        expect(typeof broadcastChannel.mock.calls[0][1]).toBe('string');
        expect(typeof broadcastChannel.mock.calls[0][2]).toBe('object');

        // Check if the object contains the following properties
        expect(broadcastChannel.mock.calls[0][2]).toHaveProperty('uuid');
        expect(broadcastChannel.mock.calls[0][2]).toHaveProperty('body');
        expect(broadcastChannel.mock.calls[0][2]).toHaveProperty('channel_uuid');
        expect(broadcastChannel.mock.calls[0][2]).toHaveProperty('channel_message_type_name');
        expect(broadcastChannel.mock.calls[0][2].channel_message_type_name).toBe('User');
        expect(broadcastChannel.mock.calls[0][2]).toHaveProperty('user_uuid');
        expect(broadcastChannel.mock.calls[0][2]).toHaveProperty('user');
        expect(broadcastChannel.mock.calls[0][2].user).toHaveProperty('uuid');
        expect(broadcastChannel.mock.calls[0][2].user).toHaveProperty('username');
        expect(broadcastChannel.mock.calls[0][2].user).toHaveProperty('avatar_src');
        expect(broadcastChannel.mock.calls[0][2].user).not.toHaveProperty('email');
        expect(broadcastChannel.mock.calls[0][2].user).not.toHaveProperty('password');
        expect(broadcastChannel.mock.calls[0][2]).toHaveProperty('created_at');
        expect(broadcastChannel.mock.calls[0][2]).toHaveProperty('updated_at');
    });


    test.each([
        [null, 'No options provided'],
        ["", 'No options provided'],
        [1, 'No body provided'],
        [0, 'No options provided'],
        [[], 'No body provided'],
        [{}, 'No body provided'],
        [{ body: { } }, 'No user provided'],
        [{ body: { }, user: { } }, 'No user.sub provided'],
        [{ body: { }, user: { sub: "test" } }, 'No uuid provided'],
        [{ body: { uuid: "test" }, user: { sub: "test" } }, 'No body.body provided'],
        [{ body: { uuid: "test", body: "test" }, user: { sub: "test" } }, 'No channel_uuid provided'],
        [{ body: { uuid: "test", body: "test", channel_uuid: "test" }, user: { sub: "test" } }, 'Channel not found'],
    ])(`(${name}) - ChannelMessageService.create invalid partitions`, async (options, expected) => {
        expect(async () => await ChannelMessageService.create(options)).rejects.toThrowError(expected);
    });

    test.each([
        [{ user: context.admin, uuid: channel_message_uuid_admin, body: { body: `test-${uuidv4()}` } }],
        [{ user: context.mod, uuid: channel_message_uuid_mod, body: { body: `test-${uuidv4()}` } }],
        [{ user: context.member, uuid: channel_message_uuid_member, body: { body: `test-${uuidv4()}` } }],
    ])(`(${name}) - ChannelMessageService.update valid partitions`, async (options) => {
        const result = await ChannelMessageService.update(options);

        expect(result).toHaveProperty('uuid');
        expect(result).toHaveProperty('body');
        expect(result).toHaveProperty('channel_message_type_name');
        expect(result).toHaveProperty('user_uuid');
        expect(result).toHaveProperty('channel_uuid');
        expect(result).toHaveProperty('created_at');
        expect(result).toHaveProperty('updated_at');
        expect(result).toHaveProperty('user');
        expect(result.user).toHaveProperty('uuid');
        expect(result.user).toHaveProperty('username');
        expect(result.user).toHaveProperty('avatar_src');
        expect(result.user).not.toHaveProperty('email');
        expect(result.user).not.toHaveProperty('password');

        // Check if the method called broadcastChannel(string, string, object)
        expect(typeof broadcastChannel.mock.calls[0][0]).toBe('string');
        expect(typeof broadcastChannel.mock.calls[0][1]).toBe('string');
        expect(typeof broadcastChannel.mock.calls[0][2]).toBe('object');

        // Check if the object contains the following properties
        expect(broadcastChannel.mock.calls[0][2]).toHaveProperty('uuid');
        expect(broadcastChannel.mock.calls[0][2]).toHaveProperty('body');
        expect(broadcastChannel.mock.calls[0][2]).toHaveProperty('channel_uuid');
        expect(broadcastChannel.mock.calls[0][2]).toHaveProperty('channel_message_type_name');
        expect(broadcastChannel.mock.calls[0][2].channel_message_type_name).toBe('User');
        expect(broadcastChannel.mock.calls[0][2]).toHaveProperty('user_uuid');
        expect(broadcastChannel.mock.calls[0][2]).toHaveProperty('user');
        expect(broadcastChannel.mock.calls[0][2].user).toHaveProperty('uuid');
        expect(broadcastChannel.mock.calls[0][2].user).toHaveProperty('username');
        expect(broadcastChannel.mock.calls[0][2].user).toHaveProperty('avatar_src');
        expect(broadcastChannel.mock.calls[0][2].user).not.toHaveProperty('email');
        expect(broadcastChannel.mock.calls[0][2].user).not.toHaveProperty('password');
        expect(broadcastChannel.mock.calls[0][2]).toHaveProperty('created_at');
        expect(broadcastChannel.mock.calls[0][2]).toHaveProperty('updated_at');
    });

    test.each([
        [null, 'No options provided'],
        ["", 'No options provided'],
        [1, 'No uuid provided'],
        [0, 'No options provided'],
        [[], 'No uuid provided'],
        [{}, 'No uuid provided'],
        [{ uuid: "test" }, 'No user provided'],
        [{ uuid: "test", user: { } }, 'No user.sub provided'],
        [{ uuid: "test", user: { sub: "test" } }, 'No body provided'],
        [{ uuid: "test", user: { sub: "test" }, body: { } }, 'channel_message not found'],
    ])(`(${name}) - ChannelMessageService.update invalid partitions`, async (options, expected) => {
        expect(async () => await ChannelMessageService.update(options)).rejects.toThrowError(expected);
    });

    /**
     * Security Checks
     */

    test.each([
        [user.uuid],
    ])(`(${name}) - ChannelMessageService.findOne return error for users who are not member`, async (sub) => {
        expect(async () => await ChannelMessageService.findOne({ uuid: channel_message_uuid_admin, user: { sub } }))
            .rejects.toThrow("User is not in the room");
    });

    test.each([
        [user.uuid],
    ])(`(${name}) - ChannelMessageService.findAll return error for users who are not member`, async (sub) => {
        expect(async () => await ChannelMessageService.findAll({ channel_uuid, user: { sub } }))
            .rejects.toThrow("User is not in the room");
    });

    test.each([
        [user.uuid],
    ])(`(${name}) - ChannelMessageService.create return error for users who are not member`, async (sub) => {
        expect(async () => await ChannelMessageService.create({ user: { sub }, body: { uuid: uuidv4(), channel_uuid, body: `test-${uuidv4()}` } }))
            .rejects.toThrow("User is not in the room");
    });

    test.each([
        [context.member.sub],
        [user.uuid],
    ])(`(${name}) - ChannelMessageService.destroy return error for users who are not moderator, owner or admin`, async (sub) => {
        expect(async () => await ChannelMessageService.destroy({ uuid: channel_message_uuid_admin, user: { sub } }))
            .rejects.toThrow("User is not an owner of the message, or an admin or moderator of the room");
    });

    test.each([
        [context.member.sub],
        [user.uuid],
    ])(`(${name}) - ChannelMessageService.update return error for users who are not moderator, owner or admin`, async (sub) => {
        expect(async () => await ChannelMessageService.update({ uuid: channel_message_uuid_admin, user: { sub }, body: { body: "test" } }))
            .rejects.toThrow("User is not an owner of the message, or an admin or moderator of the room");
    });

    test.each([
        [{ user: context.admin, uuid: channel_message_uuid_mod }], // Admin can delete mod's message
        [{ user: context.mod, uuid: channel_message_uuid_admin }], // Moderator can delete admin's message
        [{ user: context.member, uuid: channel_message_uuid_member }], // Member can delete their own message
    ])(`(${name}) - ChannelMessageService.destroy valid partitions`, async (options) => {
        await ChannelMessageService.destroy(options);
        
        expect(async () => await ChannelMessageService.findOne(options))
            .rejects.toThrow("channel_message not found");

        // Check if the method called broadcastChannel(string, string, object)
        expect(typeof broadcastChannel.mock.calls[0][0]).toBe('string');
        expect(typeof broadcastChannel.mock.calls[0][1]).toBe('string');
        expect(typeof broadcastChannel.mock.calls[0][2]).toBe('object');

        // Check if the object contains the following properties
        expect(broadcastChannel.mock.calls[0][2]).toHaveProperty('uuid');
    });

    test.each([
        [null, 'No options provided'],
        ["", 'No options provided'],
        [1, 'No uuid provided'],
        [0, 'No options provided'],
        [[], 'No uuid provided'],
        [{}, 'No uuid provided'],
        [{ uuid: "test" }, 'No user provided'],
        [{ uuid: "test", user: { } }, 'No user.sub provided'],
        [{ uuid: "test", user: { sub: "test" } }, 'channel_message not found'],
    ])(`(${name}) - ChannelMessageService.destroy invalid partitions`, async (options, expected) => {
        expect(async () => await ChannelMessageService.destroy(options)).rejects.toThrowError(expected);
    });
};

channelMessageTest(
    RelationalChannelMessageService,
    RelationalChannelService,
    RelationalRoomService,
    RelationalUserService,
    RelationalRoomInviteLinkService,
    RelationalRoomUserService,
    'Relational'
);

channelMessageTest(
    DocumentChannelMessageService,
    DocumentChannelService,
    DocumentRoomService,
    DocumentUserService,
    DocumentRoomInviteLinkService,
    DocumentRoomUserService,
    'Document'
);

channelMessageTest(
    GraphChannelMessageService,
    GraphChannelService,
    GraphRoomService,
    GraphUserService,
    GraphRoomInviteLinkService,
    GraphRoomUserService,
    'Graph'
);
