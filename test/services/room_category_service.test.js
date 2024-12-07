import RelationalRoomCategoryService from '../../src/relational-based/services/room_category_service.js';
import DocumentRoomCategoryService from '../../src/document-based/services/room_category_service.js';
import GraphRoomCategoryService from '../../src/graph-based/services/room_category_service.js';

import data from '../../src/seed_data.js';
import { test, expect } from 'vitest';

const roomCategoryServiceTest = (RoomCategoryService, name) => {

    /**
     * Expected methods
     */

    test(`(${name}) - RoomCategoryService must implement expected methods`, () => {
        expect(RoomCategoryService).toHaveProperty('findOne');
        expect(RoomCategoryService).toHaveProperty('findAll');
    });



    /**
     * RoomCategoryService.findOne
     */

    test.each([
        data.room_categories.map(rc => rc.name),
    ])(`(${name}) - RoomCategoryService.findOne valid partitions`, async (name) => {
        const result = await RoomCategoryService.findOne({ name });

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
        [{ name: 1 }, 'room_category not found'],
        [{ name: "test" }, 'room_category not found'],
    ])(`(${name}) - RoomCategoryService.findOne invalid partitions`, async (options, expected) => {
        expect(async () => await RoomCategoryService.findOne(options)).rejects.toThrowError(expected);
    });



    /**
     * RoomCategoryService.findAll
     */

    test.each([
        [undefined],
        [{}],
        [{ limit: 2 }],
        [{ limit: 1 }],
        [{ limit: 2, page: 1 }],
        [{ limit: 1, page: 2 }],
    ])(`(${name}) - RoomCategoryService.findAll valid partitions`, async (options) => {
        const result = await RoomCategoryService.findAll(options);

        expect(result).toHaveProperty('total');
        expect(result).toHaveProperty('data');

        expect(result.total).toBe(20);
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
    ])(`(${name}) - RoomCategoryService.findAll invalid partitions`, async (options, expected) => {
        expect(async () => await RoomCategoryService.findAll(options)).rejects.toThrowError(expected);
    });
};

roomCategoryServiceTest(RelationalRoomCategoryService, 'Relational');
roomCategoryServiceTest(DocumentRoomCategoryService, 'Document');
roomCategoryServiceTest(GraphRoomCategoryService, 'Graph');
