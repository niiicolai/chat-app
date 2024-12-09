import RelationalChannelService from '../../src/relational-based/services/channel_service.js';
import DocumentChannelService from '../../src/document-based/services/channel_service.js';
import GraphChannelService from '../../src/graph-based/services/channel_service.js';

import data from '../../src/seed_data.js';
import { test, expect } from 'vitest';
import { v4 as uuidv4 } from 'uuid';

const channelTest = (ChannelService, name) => {

    /**
     * Existing users, rooms and channels
     */

    const user = { sub: data.users.find(u => u.username === 'not_in_a_room').uuid };
    const room_uuid = data.rooms[2].uuid;
    const channel_uuid = data.rooms[2].channels[0].uuid;
    const channel_name = data.rooms[2].channels[0].name;
    const channel_type = data.rooms[2].channels[0].channel_type_name;
    const admin = { sub: data.users[0].uuid };
    const mod = { sub: data.users[1].uuid };
    const member = { sub: data.users[2].uuid };



    /**
     * Fake entities
     */

    const fakeId = '1635e897-b84b-4b98-b8cf-5471ff349022';



    /**
     * New channel uuid
     */

    const new_channel_uuid = uuidv4();



    /**
     * Expected methods
     */

    test(`(${name}) - ChannelService must implement expected methods`, () => {
        expect(ChannelService).toHaveProperty('findOne');
        expect(ChannelService).toHaveProperty('findAll');
        expect(ChannelService).toHaveProperty('create');
        expect(ChannelService).toHaveProperty('update');
        expect(ChannelService).toHaveProperty('destroy');
    });



    /**
     * ChannelService.findOne
     */

    test.each([
        [{ uuid: channel_uuid, user: admin }],
    ])(`(${name}) - ChannelService.findOne valid partitions`, async (options) => {
        const result = await ChannelService.findOne(options);

        expect(result).toHaveProperty('uuid');
        expect(result).toHaveProperty('name');
        expect(result).toHaveProperty('description');
        expect(result).toHaveProperty('channel_type_name');
        expect(result).toHaveProperty('room_uuid');
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
        [{ uuid: '' }, 'No uuid provided'],
        [{ uuid: fakeId }, 'No user provided'],
        [{ uuid: fakeId, user: { } }, 'No user.sub provided'],
        [{ uuid: fakeId, user: { sub: fakeId } }, 'channel not found'],
    ])(`(${name}) - ChannelService.findOne invalid partitions`, async (options, expected) => {
        expect(async () => await ChannelService.findOne(options)).rejects.toThrowError(expected);
    });



    /**
     * ChannelService.findAll
     */

    test.each([
        [{ room_uuid, user: admin }],
        [{ room_uuid, user: mod }],
        [{ room_uuid, user: member }],
    ])(`(${name}) - ChannelService.findAll valid partitions`, async (options) => {
        const result = await ChannelService.findAll(options);

        expect(result).toHaveProperty('total');
        expect(result).toHaveProperty('data');

        expect(result.total).toBeGreaterThan(0);
        expect(result.data[0]).toHaveProperty('uuid');
        expect(result.data[0]).toHaveProperty('name');
        expect(result.data[0]).toHaveProperty('description');
        expect(result.data[0]).toHaveProperty('channel_type_name');
        expect(result.data[0]).toHaveProperty('room_uuid');
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
    ])(`(${name}) - ChannelService.findAll invalid partitions`, async (options, expected) => {
        expect(async () => await ChannelService.findAll(options)).rejects.toThrowError(expected);
    });



    /**
     * ChannelService.create
     */

    test.each([
        [{ 
            user: admin, 
            body: { 
                uuid: new_channel_uuid, 
                room_uuid, 
                name: `new_channel`,
                description: "test", 
                channel_type_name: "Text"
            } 
        }],
    ])(`(${name}) - ChannelService.create valid partitions`, async (options) => {
        const result = await ChannelService.create(options);

        expect(result).toHaveProperty('uuid');
        expect(result).toHaveProperty('name');
        expect(result).toHaveProperty('description');
        expect(result).toHaveProperty('channel_type_name');
        expect(result).toHaveProperty('room_uuid');
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
        [{ body: { } }, 'No user provided'],
        [{ body: { }, user: { } }, 'No user.sub provided'],
        [{ body: { }, user: { sub: fakeId } }, 'No uuid provided'],
        [{ body: { uuid: fakeId }, user: { sub: fakeId } }, 'No name provided'],
        [{ body: { uuid: fakeId, name: "test" }, user: { sub: fakeId } }, 'No description provided'],
        [{ body: { uuid: fakeId, name: "test", description: "test" }, user: { sub: fakeId } }, 'No channel_type_name provided'],
        [{ body: { uuid: fakeId, name: "test", description: "test", channel_type_name: "test" }, user: { sub: fakeId } }, 'No room_uuid provided'],
        [{ body: { uuid: fakeId, name: "test", description: "test", channel_type_name: "not_a_valid_type", room_uuid }, user: admin }, 'channel_type_name not found'],
        [{ body: { uuid: channel_uuid, name: "test", description: "test", channel_type_name: "Text", room_uuid }, user: admin }, `channel with PRIMARY ${channel_uuid} already exists`],
        [{ body: { uuid: fakeId, name: channel_name, description: "test", channel_type_name: channel_type, room_uuid }, user: admin }, `channel with name_type_room_uuid ${channel_name}-${channel_type}-${room_uuid} already exists`],
    ])(`(${name}) - ChannelService.create invalid partitions`, async (options, expected) => {
        expect(async () => await ChannelService.create(options)).rejects.toThrowError(expected);
    });



    /**
     * ChannelService.update
     */

    test.each([
        [{ 
            user: admin,
            uuid: new_channel_uuid,
            body: { 
                name: `updated_channel`,
                description: "test", 
                channel_type_name: "Text"
            } 
        }],
    ])(`(${name}) - ChannelService.update valid partitions`, async (options) => {
        const result = await ChannelService.update(options);

        expect(result).toHaveProperty('uuid');
        expect(result).toHaveProperty('name');
        expect(result).toHaveProperty('description');
        expect(result).toHaveProperty('channel_type_name');
        expect(result).toHaveProperty('room_uuid');
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
        [{ uuid: { } }, 'No user provided'],
        [{ uuid: fakeId, user: { } }, 'No user.sub provided'],
        [{ uuid: fakeId, user: { sub: fakeId } }, 'No body provided'],
    ])(`(${name}) - ChannelService.update invalid partitions`, async (options, expected) => {
        expect(async () => await ChannelService.update(options)).rejects.toThrowError(expected);
    });



    /**
     * ChannelService.destroy
     */

    test.each([
        [{ 
            user: admin,
            uuid: new_channel_uuid,
        }],
    ])(`(${name}) - ChannelService.destroy valid partitions`, async (options) => {
        await ChannelService.destroy(options);
        expect(async () => await ChannelService.findOne(options))
            .rejects.toThrowError('channel not found');
    });

    test.each([
        [null, 'No options provided'],
        ["", 'No options provided'],
        [1, 'No uuid provided'],
        [0, 'No options provided'],
        [[], 'No uuid provided'],
        [{}, 'No uuid provided'],
        [{ uuid: fakeId }, 'No user provided'],
        [{ uuid: fakeId, user: { } }, 'No user.sub provided'],
        [{ uuid: fakeId, user: { sub: fakeId } }, 'channel not found'],
    ])(`(${name}) - ChannelService.destroy invalid partitions`, async (options, expected) => {
        expect(async () => await ChannelService.destroy(options)).rejects.toThrowError(expected);
    });

    

    /**
     * Security Checks
     */

    test.each([
        [mod],
        [member],
        [user],
    ])(`(${name}) - ChannelService.create return error for users who are not admin`, async (user) => {
        expect(async () => await ChannelService.create({ user, body: { uuid: uuidv4(), room_uuid, name: "not_allowed", description: "test", channel_type_name: "Text" } }))
            .rejects.toThrowError("User is not an admin of the room");
    });

    test.each([
        [mod],
        [member],
        [user],
    ])(`(${name}) - ChannelService.destroy return error for users who are not admin`, async (user) => {
        expect(async () => await ChannelService.destroy({ user, uuid: channel_uuid }))
            .rejects.toThrowError("User is not an admin of the room");
    });

    test.each([
        [mod],
        [member],
        [user],
    ])(`(${name}) - ChannelService.update return error for users who are not admin`, async (user) => {
        expect(async () => await ChannelService.update({ user, uuid: channel_uuid, body: { description: "test" } }))
            .rejects.toThrow("User is not an admin of the room");
    });
    
    test.each([
        [user],
    ])(`(${name}) - ChannelService.findOne return error for users who are not member`, async (user) => {
        expect(async () => await ChannelService.findOne({ user, uuid: channel_uuid }))
            .rejects.toThrow("User is not in the room");
    });

    test.each([
        [user],
    ])(`(${name}) - ChannelService.findAll return error for users who are not member`, async (user) => {
        expect(async () => await ChannelService.findAll({ user, room_uuid: room_uuid }))
            .rejects.toThrow("User is not in the room");
    });
};

channelTest(RelationalChannelService, 'Relational');
channelTest(DocumentChannelService, 'Document');
//channelTest(GraphChannelService, 'Graph');
