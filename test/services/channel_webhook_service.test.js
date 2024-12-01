import RelationalChannelWebhookService from '../../src/relational-based/services/channel_webhook_service.js';
import DocumentChannelWebhookService from '../../src/document-based/services/channel_webhook_service.js';
import GraphChannelWebhookService from '../../src/graph-based/services/channel_webhook_service.js';

import data from '../../src/seed_data.js';
import { test, expect } from 'vitest';
import { v4 as uuidv4 } from 'uuid';

const channelWebhookTest = (ChannelWebhookService, name) => {
    const user = { sub: data.users.find(u => u.username === 'not_in_a_room').uuid };
    const channel_uuid = data.rooms[0].channels[1].uuid; // Does not have a webhook
    const admin = { sub: data.users[0].uuid };
    const mod = { sub: data.users[1].uuid };
    const member = { sub: data.users[2].uuid };

    const channel_webhook_uuid = uuidv4();

    test(`(${name}) - ChannelWebhookService must implement expected methods`, () => {
        expect(ChannelWebhookService).toHaveProperty('findOne');
        expect(ChannelWebhookService).toHaveProperty('findAll');
        expect(ChannelWebhookService).toHaveProperty('create');
        expect(ChannelWebhookService).toHaveProperty('update');
        expect(ChannelWebhookService).toHaveProperty('destroy');
        expect(ChannelWebhookService).toHaveProperty('message');
    });

    test.each([
        [{ user: admin, body: { uuid: channel_webhook_uuid, channel_uuid, name: `new-webhook`, description: "new-webhook" } }],
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
        [{ user: admin, uuid: channel_webhook_uuid, body: { name: `updated-webhook`, description: `updated-webhook` } }],
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
        [{ user: admin, uuid: channel_webhook_uuid, body: { message: `new-message` } }],
    ])(`(${name}) - ChannelWebhookService.message valid partitions`, async (options) => {
        await ChannelWebhookService.message(options);
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
        [mod],
        [member],
        [user],
    ])(`(${name}) - ChannelWebhookService.create return error for users who are not admin`, async (user) => {
        expect(async () => await ChannelWebhookService.create({ user, body: { uuid: uuidv4(), channel_uuid, name: "not_allowed", description: "test" } }))
            .rejects.toThrowError("User is not an admin of the room");
    });

    test.each([
        [mod],
        [member],
        [user],
    ])(`(${name}) - ChannelWebhookService.destroy return error for users who are not admin`, async (user) => {
        expect(async () => await ChannelWebhookService.destroy({ user, uuid: channel_webhook_uuid }))
            .rejects.toThrowError("User is not an admin of the room");
    });

    test.each([
        [mod],
        [member],
        [user],
    ])(`(${name}) - ChannelWebhookService.update return error for users who are not admin`, async (user) => {
        expect(async () => await ChannelWebhookService.update({ user, uuid: channel_webhook_uuid, body: { description: "test" } }))
            .rejects.toThrow("User is not an admin of the room");
    });
    
    test.each([
        [user],
    ])(`(${name}) - ChannelWebhookService.findOne return error for users who are not member`, async (user) => {
        expect(async () => await ChannelWebhookService.findOne({ user, uuid: channel_webhook_uuid }))
            .rejects.toThrow("User is not in the room");
    });

    test.each([
        [user],
    ])(`(${name}) - ChannelWebhookService.findAll return error for users who are not member`, async (user) => {
        expect(async () => await ChannelWebhookService.findAll({ user, room_uuid }))
            .rejects.toThrow("User is not in the room");
    });

    // destroy after security checks
    test.each([
        [{ user: admin, uuid: channel_webhook_uuid }],
    ])(`(${name}) - ChannelWebhookService.destroy valid partitions`, async (options) => {
        await ChannelWebhookService.destroy(options);
        expect(async () => await ChannelWebhookService.findOne(options))
            .rejects.toThrowError('channel_webhook not found');
    });
};

channelWebhookTest(RelationalChannelWebhookService, 'Relational');
// channelWebhookTest(DocumentChannelWebhookService, 'Document');
// channelWebhookTest(GraphChannelWebhookService, 'Graph');
