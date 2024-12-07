import RelationalChannelMessageService from '../../src/relational-based/services/channel_message_service.js';
import DocumentChannelMessageService from '../../src/document-based/services/channel_message_service.js';
import GraphChannelMessageService from '../../src/graph-based/services/channel_message_service.js';

import data from '../../src/seed_data.js';
import { test, expect } from 'vitest';
import { v4 as uuidv4 } from 'uuid';

const channelMessageTest = (ChannelMessageService, name) => {

    /**
     * Existing users, rooms and channels
     */

    const user = { sub: data.users.find(u => u.username === 'not_in_a_room').uuid };
    const channel_uuid = data.rooms[0].channels[0].uuid;
    const admin = { sub: data.users[0].uuid };
    const mod = { sub: data.users[1].uuid };
    const member = { sub: data.users[2].uuid };



    /**
     * New channel messages uuids
     */
    const channel_message_uuid_admin = uuidv4();
    const channel_message_uuid_mod = uuidv4();
    const channel_message_uuid_member = uuidv4();



    /**
     * Fake entities
     */

    const fakeId = '1635e897-b84b-4b98-b8cf-5471ff349022';



    /**
     * Expected methods
     */

    test(`(${name}) - ChannelMessageService must implement expected methods`, () => {
        expect(ChannelMessageService).toHaveProperty('findOne');
        expect(ChannelMessageService).toHaveProperty('findAll');
        expect(ChannelMessageService).toHaveProperty('create');
        expect(ChannelMessageService).toHaveProperty('update');
        expect(ChannelMessageService).toHaveProperty('destroy');
    });



    /**
     * ChannelMessageService.create
     */

    test.each([
        [{ user: admin, body: { uuid: channel_message_uuid_admin, channel_uuid, body: `test-${uuidv4()}` } }],
        [{ user: mod, body: { uuid: channel_message_uuid_mod, channel_uuid, body: `test-${uuidv4()}` } }],
        [{ user: member, body: { uuid: channel_message_uuid_member, channel_uuid, body: `test-${uuidv4()}` } }],
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
        [{ body: { uuid: fakeId }, user: { sub: fakeId } }, 'No body.body provided'],
        [{ body: { uuid: fakeId, body: "test" }, user: { sub: fakeId } }, 'No channel_uuid provided'],
        [{ body: { uuid: fakeId, body: "test", channel_uuid: fakeId }, user: { sub: fakeId } }, 'channel not found'],
    ])(`(${name}) - ChannelMessageService.create invalid partitions`, async (options, expected) => {
        expect(async () => await ChannelMessageService.create(options)).rejects.toThrowError(expected);
    });



    /**
     * ChannelMessageService.update
     */

    test.each([
        [{ user: admin, uuid: channel_message_uuid_admin, body: { body: `test-${uuidv4()}` } }],
        [{ user: mod, uuid: channel_message_uuid_mod, body: { body: `test-${uuidv4()}` } }],
        [{ user: member, uuid: channel_message_uuid_member, body: { body: `test-${uuidv4()}` } }],
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
        [{ uuid: fakeId, user: { sub: fakeId } }, 'No body provided'],
        [{ uuid: fakeId, user: { sub: fakeId }, body: { } }, 'channel_message not found'],
    ])(`(${name}) - ChannelMessageService.update invalid partitions`, async (options, expected) => {
        expect(async () => await ChannelMessageService.update(options)).rejects.toThrowError(expected);
    });



    /**
     * ChannelMessageService.findOne
     

    test.each([
        [{ uuid: channel_message_uuid_admin, user: admin }],
        [{ uuid: channel_message_uuid_mod, user: mod }],
        [{ uuid: channel_message_uuid_member, user: member }],
    ])(`(${name}) - ChannelMessageService.findOne valid partitions`, async (options) => {
        const result = await ChannelMessageService.findOne(options);

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
        [{ uuid: fakeId, user: { sub: fakeId } }, 'channel_message not found'],
    ])(`(${name}) - ChannelMessageService.findOne invalid partitions`, async (options, expected) => {
        expect(async () => await ChannelMessageService.findOne(options)).rejects.toThrowError(expected);
    });*/



    /**
     * ChannelMessageService.findAll
     

    test.each([
        [{ channel_uuid, user: admin }],
        [{ channel_uuid, user: mod }],
        [{ channel_uuid, user: member }],
    ])(`(${name}) - ChannelMessageService.findAll valid partitions`, async (options) => {
        const result = await ChannelMessageService.findAll(options);

        expect(result).toHaveProperty('total');
        expect(result).toHaveProperty('data');

        expect(result.total).toBeGreaterThan(0);
        expect(result.data[0]).toHaveProperty('uuid');
        expect(result.data[0]).toHaveProperty('body');
        expect(result.data[0]).toHaveProperty('channel_message_type_name');
        expect(result.data[0]).toHaveProperty('user_uuid');
        expect(result.data[0]).toHaveProperty('channel_uuid');
        expect(result.data[0]).toHaveProperty('created_at');
        expect(result.data[0]).toHaveProperty('updated_at');

        //expect(result.data[0]).toHaveProperty('user');
        //expect(result.data[0].user).toHaveProperty('uuid');
        //expect(result.data[0].user).toHaveProperty('username');
        //expect(result.data[0].user).toHaveProperty('avatar_src');
        //expect(result.data[0].user).not.toHaveProperty('email');
        //expect(result.data[0].user).not.toHaveProperty('password');

        if (options?.page) {
            expect(result).toHaveProperty('pages');
            expect(result).toHaveProperty('page');
            expect(result).toHaveProperty('limit');
        }
    });

    test.each([
        [null, 'No options provided'],
        ["", 'No options provided'],
        [1, 'No channel_uuid provided'],
        [0, 'No options provided'],
        [[], 'No channel_uuid provided'],
        [{}, 'No channel_uuid provided'],
        [{ channel_uuid: '' }, 'No channel_uuid provided'],
        [{ channel_uuid: fakeId }, 'No user provided'],
        [{ channel_uuid: fakeId, user: {} }, 'No user.sub provided'],
        [{ channel_uuid: fakeId, user: { sub: fakeId } }, 'channel not found'],
    ])(`(${name}) - ChannelMessageService.findAll invalid partitions`, async (options, expected) => {
        expect(async () => await ChannelMessageService.findAll(options)).rejects.toThrowError(expected);
    });*/



    /**
     * Security Checks
     

    test.each([
        [user],
    ])(`(${name}) - ChannelMessageService.findOne return error for users who are not member`, async (user) => {
        expect(async () => await ChannelMessageService.findOne({ uuid: channel_message_uuid_admin, user }))
            .rejects.toThrow("User is not in the room");
    });

    test.each([
        [user],
    ])(`(${name}) - ChannelMessageService.findAll return error for users who are not member`, async (user) => {
        expect(async () => await ChannelMessageService.findAll({ channel_uuid, user }))
            .rejects.toThrow("User is not in the room");
    });

    test.each([
        [user],
    ])(`(${name}) - ChannelMessageService.create return error for users who are not member`, async (user) => {
        expect(async () => await ChannelMessageService.create({ user, body: { uuid: uuidv4(), channel_uuid, body: `test-${uuidv4()}` } }))
            .rejects.toThrow("User is not in the room");
    });

    test.each([
        [member],
        [user],
    ])(`(${name}) - ChannelMessageService.destroy return error for users who are not moderator, owner or admin`, async (user) => {
        expect(async () => await ChannelMessageService.destroy({ uuid: channel_message_uuid_admin, user }))
            .rejects.toThrow("User is not an owner of the channel_message, or an admin or moderator of the room");
    });

    test.each([
        [member],
        [user],
    ])(`(${name}) - ChannelMessageService.update return error for users who are not moderator, owner or admin`, async (user) => {
        expect(async () => await ChannelMessageService.update({ uuid: channel_message_uuid_admin, user, body: { body: "test" } }))
            .rejects.toThrow("User is not an owner of the channel_message, or an admin or moderator of the room");
    });*/



    /**
     * ChannelMessageService.destroy
     

    test.each([
        [{ user: admin, uuid: channel_message_uuid_mod }], // Admin can delete mod's message
        [{ user: mod, uuid: channel_message_uuid_admin }], // Moderator can delete admin's message
        [{ user: member, uuid: channel_message_uuid_member }], // Member can delete their own message
    ])(`(${name}) - ChannelMessageService.destroy valid partitions`, async (options) => {
        await ChannelMessageService.destroy(options);
        
        expect(async () => await ChannelMessageService.findOne(options))
            .rejects.toThrow("channel_message not found");
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
        [{ uuid: fakeId, user: { sub: fakeId } }, 'channel_message not found'],
    ])(`(${name}) - ChannelMessageService.destroy invalid partitions`, async (options, expected) => {
        expect(async () => await ChannelMessageService.destroy(options)).rejects.toThrowError(expected);
    });*/
};

//channelMessageTest(RelationalChannelMessageService, 'Relational');
channelMessageTest(DocumentChannelMessageService, 'Document');
//channelMessageTest(GraphChannelMessageService, 'Graph');
