import RelationalChannelWebhookService from '../../src/relational-based/services/channel_webhook_service.js';
import DocumentChannelWebhookService from '../../src/document-based/services/channel_webhook_service.js';
import GraphChannelWebhookService from '../../src/graph-based/services/channel_webhook_service.js';

import data from '../../src/seed_data.js';
import { test, expect } from 'vitest';
import { v4 as uuidv4 } from 'uuid';

const channelWebhookTest = (ChannelWebhookService, name) => {

    /**
     * Existing users and channels
     */

    const user = { sub: data.users.find(u => u.username === 'not_in_a_room').uuid };
    const room_uuid = data.rooms[0].uuid;
    const channel_uuid = data.rooms[0].channels[1].uuid; // Does not have a webhook
    const admin = { sub: data.users[0].uuid };
    const mod = { sub: data.users[1].uuid };
    const member = { sub: data.users[2].uuid };



    /**
     * New channel webhook uuid
     */

    const channel_webhook_uuid = uuidv4();



    /**
     * Fake entities
     */

    const fakeId = '1635e897-b84b-4b98-b8cf-5471ff349022';



    /**
     * Expected methods
     */

    test(`(${name}) - ChannelWebhookService must implement expected methods`, () => {
        expect(ChannelWebhookService).toHaveProperty('findOne');
        expect(ChannelWebhookService).toHaveProperty('findAll');
        expect(ChannelWebhookService).toHaveProperty('create');
        expect(ChannelWebhookService).toHaveProperty('update');
        expect(ChannelWebhookService).toHaveProperty('destroy');
        expect(ChannelWebhookService).toHaveProperty('message');
    });



    /**
     * ChannelWebhookService.create
     */

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
        [{ body: {} }, 'No user provided'],
        [{ body: { }, user: { }}, 'No user.sub provided'],
        [{ body: { }, user: { sub: fakeId }}, 'No uuid provided'],
        [{ body: { uuid: fakeId }, user: { sub: fakeId }}, 'No channel_uuid provided'],
        [{ body: { uuid: fakeId, channel_uuid: fakeId }, user: { sub: fakeId }}, 'No name provided'],
        [{ body: { uuid: fakeId, channel_uuid: fakeId, name: "test" }, user: { sub: fakeId }}, 'No description provided'],
        [{ body: { uuid: uuidv4(), channel_uuid, name: "test", description: "test" }, user: admin }, 'channel already has a webhook'],
    ])(`(${name}) - ChannelWebhookService.create invalid partitions`, async (options, expected) => {
        expect(async () => await ChannelWebhookService.create(options)).rejects.toThrowError(expected);
    });



    /**
     * ChannelWebhookService.update
     */

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
        [{ uuid: fakeId }, 'No user provided'],
        [{ uuid: fakeId, user: {} }, 'No user.sub provided'],
        [{ uuid: fakeId, user: { sub: fakeId } }, 'No body provided'],
    ])(`(${name}) - ChannelWebhookService.update invalid partitions`, async (options, expected) => {
        expect(async () => await ChannelWebhookService.update(options)).rejects.toThrowError(expected);
    });



    /**
     * ChannelWebhookService.message
     */

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
        [{ uuid: fakeId }, 'No body provided'],
    ])(`(${name}) - ChannelWebhookService.message invalid partitions`, async (options, expected) => {
        expect(async () => await ChannelWebhookService.message(options))
            .rejects.toThrowError(expected);
    });



    /**
     * ChannelWebhookService.findOne
     */

    test.each([
        [{ user: admin, uuid: channel_webhook_uuid }],
    ])(`(${name}) - ChannelWebhookService.findOne valid partitions`, async (options) => {
        const result = await ChannelWebhookService.findOne(options);

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
        [{ uuid: fakeId }, 'No user provided'],
        [{ uuid: fakeId, user: {} }, 'No user.sub provided'],
        [{ uuid: fakeId, user: admin }, 'channel_webhook not found'],
    ])(`(${name}) - ChannelWebhookService.findOne invalid partitions`, async (options, expected) => {
        expect(async () => await ChannelWebhookService.findOne(options))
            .rejects.toThrowError(expected);
    });



    /**
     * ChannelWebhookService.findAll
     */

    test.each([
        [{ room_uuid, user: admin }],
        [{ room_uuid, user: mod }],
        [{ room_uuid, user: member }],
    ])(`(${name}) - ChannelWebhookService.findAll valid partitions`, async (options) => {
        const result = await ChannelWebhookService.findAll(options);

        expect(result).toHaveProperty('total');
        expect(result).toHaveProperty('data');

        expect(result.total).toBeGreaterThan(0);
        expect(result.data[0]).toHaveProperty('uuid');
        expect(result.data[0]).toHaveProperty('name');
        expect(result.data[0]).toHaveProperty('description');
        expect(result.data[0]).toHaveProperty('channel_uuid');
        expect(result.data[0]).toHaveProperty('created_at');
        expect(result.data[0]).toHaveProperty('updated_at');

        if (options?.page) {
            expect(result).toHaveProperty('pages');
            expect(result).toHaveProperty('page');
            expect(result).toHaveProperty('limit');
        }
    });

    test.each([
        [null, 'No options provided'],
        ["", 'No options provided'],
        [1, 'No room_uuid provided'],
        [0, 'No options provided'],
        [[], 'No room_uuid provided'],
        [{}, 'No room_uuid provided'],
        [{ room_uuid: '' }, 'No room_uuid provided'],
        [{ room_uuid: fakeId }, 'No user provided'],
        [{ room_uuid: fakeId, user: {} }, 'No user.sub provided'],
        [{ room_uuid: fakeId, user: { sub: fakeId } }, 'User is not in the room'],
    ])(`(${name}) - ChannelWebhookService.findAll invalid partitions`, async (options, expected) => {
        expect(async () => await ChannelWebhookService.findAll(options)).rejects.toThrowError(expected);
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


    /**
     * ChannelWebhookService.destroy
     */

    test.each([
        [{ user: admin, uuid: channel_webhook_uuid }],
    ])(`(${name}) - ChannelWebhookService.destroy valid partitions`, async (options) => {
        await ChannelWebhookService.destroy(options);
        expect(async () => await ChannelWebhookService.findOne(options))
            .rejects.toThrowError('channel_webhook not found');
    });

    test.each([
        [null, 'No options provided'],
        ["", 'No options provided'],
        [1, 'No uuid provided'],
        [0, 'No options provided'],
        [[], 'No uuid provided'],
        [{}, 'No uuid provided'],
        [{ uuid: { } }, 'No user provided'],
        [{ uuid: fakeId, user: { } }, 'No user.sub provided'],
        [{ uuid: fakeId, user: { sub: fakeId } }, 'channel_webhook not found'],
    ])(`(${name}) - ChannelWebhookService.destroy invalid partitions`, async (options, expected) => {
        expect(async () => await ChannelWebhookService.destroy(options)).rejects.toThrowError(expected);
    });
};

channelWebhookTest(RelationalChannelWebhookService, 'Relational');
channelWebhookTest(DocumentChannelWebhookService, 'Document');
//channelWebhookTest(GraphChannelWebhookService, 'Graph');
