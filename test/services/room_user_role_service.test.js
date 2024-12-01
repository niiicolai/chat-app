import RelationalRoomUserRoleService from '../../src/relational-based/services/room_user_role_service.js';
import DocumentRoomUserRoleService from '../../src/document-based/services/room_user_role_service.js';
import GraphRoomUserRoleService from '../../src/graph-based/services/room_user_role_service.js';

import data from '../../src/seed_data.js';
import { test, expect } from 'vitest';

const roomUserRoleServiceTest = (RoomUserRoleService, name) => {

    test(`(${name}) - RoomUserRoleService must implement expected methods`, () => {
        expect(RoomUserRoleService).toHaveProperty('findOne');
        expect(RoomUserRoleService).toHaveProperty('findAll');
    });

    test.each([
        data.room_user_roles.map(rc => rc.name),
    ])(`(${name}) - RoomUserRoleService.findOne valid partitions`, async (name) => {
        const result = await RoomUserRoleService.findOne({ name });

        expect(result).toHaveProperty('name');
        expect(result).toHaveProperty('created_at');
        expect(result).toHaveProperty('updated_at');
        expect(result.name).toBe(name);
    });

    test.each([
        [null, 'Invalid options provided'],
        ["", 'Invalid options provided'],
        [1, 'Invalid options provided'],
        [0, 'Invalid options provided'],
        [[], 'Invalid options provided'],
        [{}, 'name is required'],
        [{ name: '' }, 'name is required'],
        [{ name: 0 }, 'name is required'],
        [{ name: 1 }, 'room_user_role not found'],
        [{ name: "test" }, 'room_user_role not found'],
    ])(`(${name}) - RoomUserRoleService.findOne invalid partitions`, async (options, expected) => {
        expect(async () => await RoomUserRoleService.findOne(options)).rejects.toThrowError(expected);
    });

    test.each([
        [undefined],
        [{}],
        [{ limit: 2 }],
        [{ limit: 1 }],
        [{ limit: 2, page: 1 }],
        [{ limit: 1, page: 2 }],
    ])(`(${name}) - RoomUserRoleService.findAll valid partitions`, async (options) => {
        const result = await RoomUserRoleService.findAll(options);

        expect(result).toHaveProperty('total');
        expect(result).toHaveProperty('data');

        expect(result.total).toBe(3);
        expect(result.data[0]).toHaveProperty('name');
        expect(result.data[0]).toHaveProperty('created_at');
        expect(result.data[0]).toHaveProperty('updated_at');

        if (options?.page) {
            expect(result).toHaveProperty('pages');
            expect(result).toHaveProperty('page');
            expect(result).toHaveProperty('limit');
        }
    });

    test.each([
        [null, 'Invalid options provided'],
        ["", 'Invalid options provided'],
        [1, 'Invalid options provided'],
        [0, 'Invalid options provided'],
        [[], 'Invalid options provided'],
        [{ page: 1 }, 'page requires limit'],
        [{ page: -1 }, 'page must be greater than 0'],
        [{ page: "test" }, 'page must be a number'],
        [{ page: 1, limit: -1 }, 'limit must be greater than 0'],
        [{ page: 1, limit: "test" }, 'limit must be a number'],
    ])(`(${name}) - RoomUserRoleService.findAll invalid partitions`, async (options, expected) => {
        expect(async () => await RoomUserRoleService.findAll(options)).rejects.toThrowError(expected);
    });
};

roomUserRoleServiceTest(RelationalRoomUserRoleService, 'RelationalRoomUserRoleService');
roomUserRoleServiceTest(DocumentRoomUserRoleService, 'DocumentRoomUserRoleService');
roomUserRoleServiceTest(GraphRoomUserRoleService, 'GraphRoomUserRoleService');
