import RelationalChannelWebhookService from '../../src/relational-based/services/channel_webhook_service.js';
import RelationalChannelService from '../../src/relational-based/services/channel_service.js';
import RelationalRoomService from '../../src/relational-based/services/room_service.js';
import RelationalUserService from '../../src/relational-based/services/user_service.js';
import RelationalRoomInviteLinkService from '../../src/relational-based/services/room_invite_link_service.js';

import DocumentChannelWebhookService from '../../src/document-based/services/channel_webhook_service.js';
import DocumentChannelService from '../../src/document-based/services/channel_service.js';
import DocumentRoomService from '../../src/document-based/services/room_service.js';
import DocumentUserService from '../../src/document-based/services/user_service.js';
import DocumentRoomInviteLinkService from '../../src/document-based/services/room_invite_link_service.js';

import GraphChannelWebhookService from '../../src/graph-based/services/channel_webhook_service.js';
import GraphChannelService from '../../src/graph-based/services/channel_service.js';
import GraphRoomService from '../../src/graph-based/services/room_service.js';
import GraphUserService from '../../src/graph-based/services/user_service.js';
import GraphRoomInviteLinkService from '../../src/graph-based/services/room_invite_link_service.js';

import { context } from '../context.js';
import { test, expect, beforeAll, afterAll, vi } from 'vitest';
import { v4 as uuidv4 } from 'uuid';

// Import for mocking the broadcastChannel function
// to check if it was called with the correct arguments
import { broadcastChannel } from '../../websocket_server.js';

vi.mock('../../websocket_server.js', () => ({
    broadcastChannel: vi.fn(),
}));

const channelWebhookTest = (ChannelWebhookService, ChannelService, RoomService, UserService, RoomInviteLinkService, name) => {
    const room_uuid = uuidv4();
    const channel_uuid = uuidv4();
    const channel_webhook_uuid = uuidv4();
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
    });

    afterAll(async () => {
        await RoomService.destroy({ uuid: room_uuid, user: context.admin });
    });

    test(`(${name}) - ChannelWebhookService must implement expected methods`, () => {
        expect(ChannelWebhookService).toHaveProperty('findOne');
        expect(ChannelWebhookService).toHaveProperty('findAll');
        expect(ChannelWebhookService).toHaveProperty('create');
        expect(ChannelWebhookService).toHaveProperty('update');
        expect(ChannelWebhookService).toHaveProperty('destroy');
        expect(ChannelWebhookService).toHaveProperty('message');
    });

    test.each([
        [{ user: context.admin, body: { uuid: channel_webhook_uuid, channel_uuid, name: `test-${uuidv4()}`, description: "test" } }],
    ])(`(${name}) - ChannelWebhookService.create valid partitions`, async (options) => {
        const result = await ChannelWebhookService.create(options);

        expect(result).toHaveProperty('uuid');
        expect(result).toHaveProperty('name');
        expect(result).toHaveProperty('description');
        expect(result).toHaveProperty('channel_uuid');
        expect(result).toHaveProperty('created_at');
        expect(result).toHaveProperty('updated_at');
    });

    test.each([
        [null, 'No options provided'],
        ["", 'No options provided'],
        [1, 'No body provided'],
        [0, 'No options provided'],
        [[], 'No body provided'],
        [{}, 'No body provided'],
    ])(`(${name}) - ChannelWebhookService.create invalid partitions`, async (options, expected) => {
        expect(async () => await ChannelWebhookService.create(options)).rejects.toThrowError(expected);
    });

    test.each([
        [{ user: context.admin, uuid: channel_webhook_uuid, body: { name: `test-${uuidv4()}`, description: `test-${uuidv4()}` } }],
    ])(`(${name}) - ChannelWebhookService.update valid partitions`, async (options) => {
        const result = await ChannelWebhookService.update(options);

        expect(result).toHaveProperty('uuid');
        expect(result).toHaveProperty('name');
        expect(result).toHaveProperty('description');
        expect(result).toHaveProperty('channel_uuid');
        expect(result).toHaveProperty('created_at');
        expect(result).toHaveProperty('updated_at');
    });

    test.each([
        [null, 'No options provided'],
        ["", 'No options provided'],
        [1, 'No uuid provided'],
        [0, 'No options provided'],
        [[], 'No uuid provided'],
        [{}, 'No uuid provided'],
        [{ uuid: "test" }, 'No user provided'],
        [{ uuid: "test", user: {} }, 'No user.sub provided'],
        [{ uuid: "test", user: { sub: "test" } }, 'No body provided'],
    ])(`(${name}) - ChannelWebhookService.update invalid partitions`, async (options, expected) => {
        expect(async () => await ChannelWebhookService.update(options)).rejects.toThrowError(expected);
    });

    test.each([
        [{ user: context.admin, uuid: channel_webhook_uuid, body: { message: `test-${uuidv4()}` } }],
    ])(`(${name}) - ChannelWebhookService.message valid partitions`, async (options) => {
        await ChannelWebhookService.message(options);
        expect(broadcastChannel).toHaveBeenCalled();

        // Check if the method called broadcastChannel(string, string, object)
        expect(typeof broadcastChannel.mock.calls[0][0]).toBe('string');
        expect(typeof broadcastChannel.mock.calls[0][1]).toBe('string');
        expect(typeof broadcastChannel.mock.calls[0][2]).toBe('object');

        // Check if the object contains the following properties
        expect(broadcastChannel.mock.calls[0][2]).toHaveProperty('uuid');
        expect(broadcastChannel.mock.calls[0][2]).toHaveProperty('body');
        expect(broadcastChannel.mock.calls[0][2]).toHaveProperty('channel_uuid');
        expect(broadcastChannel.mock.calls[0][2]).toHaveProperty('channel_message_type_name');
        expect(broadcastChannel.mock.calls[0][2].channel_message_type_name).toBe('Webhook');
        expect(broadcastChannel.mock.calls[0][2]).toHaveProperty('created_at');
        expect(broadcastChannel.mock.calls[0][2]).toHaveProperty('updated_at');
        expect(broadcastChannel.mock.calls[0][2]).toHaveProperty('channel_webhook_message');
        expect(broadcastChannel.mock.calls[0][2].channel_webhook_message).toHaveProperty('uuid');
        expect(broadcastChannel.mock.calls[0][2].channel_webhook_message).toHaveProperty('channel_webhook');
        expect(broadcastChannel.mock.calls[0][2].channel_webhook_message.channel_webhook).toHaveProperty('uuid');
        expect(broadcastChannel.mock.calls[0][2].channel_webhook_message.channel_webhook).toHaveProperty('name');
    });

    test.each([
        [null, 'No options provided'],
        ["", 'No options provided'],
        [1, 'No uuid provided'],
        [0, 'No options provided'],
        [[], 'No uuid provided'],
        [{}, 'No uuid provided'],
        [{ uuid: "test" }, 'No body provided'],
    ])(`(${name}) - ChannelWebhookService.message invalid partitions`, async (options, expected) => {
        expect(async () => await ChannelWebhookService.message(options))
            .rejects.toThrowError(expected);
    });

    /**
     * Security Checks
     */

    test.each([
        [context.mod.sub],
        [context.member.sub],
        [user.uuid],
    ])(`(${name}) - ChannelWebhookService.create return error for users who are not admin`, async (sub) => {
        expect(async () => await ChannelWebhookService.create({ user: { sub }, body: { uuid: uuidv4(), channel_uuid, name: "test", description: "test" } }))
            .rejects.toThrowError("User is not an admin of the room");
    });

    test.each([
        [context.mod.sub],
        [context.member.sub],
        [user.uuid],
    ])(`(${name}) - ChannelWebhookService.destroy return error for users who are not admin`, async (sub) => {
        expect(async () => await ChannelWebhookService.destroy({ user: { sub }, uuid: channel_webhook_uuid }))
            .rejects.toThrowError(/User is not an admin of the room|User is not in the room/);
    });

    test.each([
        [context.mod.sub],
        [context.member.sub],
        [user.uuid],
    ])(`(${name}) - ChannelWebhookService.update return error for users who are not admin`, async (sub) => {
        expect(async () => await ChannelWebhookService.update({ user: { sub }, uuid: channel_webhook_uuid, body: { description: "test" } }))
            .rejects.toThrow(/User is not an admin of the room|User is not in the room/);
    });
    
    test.each([
        [user.uuid],
    ])(`(${name}) - ChannelWebhookService.findOne return error for users who are not member`, async (sub) => {
        expect(async () => await ChannelWebhookService.findOne({ user: { sub }, uuid: channel_webhook_uuid }))
            .rejects.toThrow("User is not in the room");
    });

    test.each([
        [user.uuid],
    ])(`(${name}) - ChannelWebhookService.findAll return error for users who are not member`, async (sub) => {
        expect(async () => await ChannelWebhookService.findAll({ user: { sub }, room_uuid }))
            .rejects.toThrow("User is not in the room");
    });
};

channelWebhookTest(
    RelationalChannelWebhookService,
    RelationalChannelService,
    RelationalRoomService,
    RelationalUserService,
    RelationalRoomInviteLinkService,
    'Relational'
);

channelWebhookTest(
    DocumentChannelWebhookService,
    DocumentChannelService,
    DocumentRoomService,
    DocumentUserService,
    DocumentRoomInviteLinkService,
    'Document'
);

channelWebhookTest(
    GraphChannelWebhookService,
    GraphChannelService,
    GraphRoomService,
    GraphUserService,
    GraphRoomInviteLinkService,
    'Graph'
);
