import RelationalRoomFileTypeService from '../../src/relational-based/services/room_file_type_service.js';
import DocumentRoomFileTypeService from '../../src/document-based/services/room_file_type_service.js';
import GraphRoomFileTypeService from '../../src/graph-based/services/room_file_type_service.js';

import data from '../../src/seed_data.js';
import { test, expect } from 'vitest';

const roomFileTypeServiceTest = (RoomFileTypeService, name) => {

    /**
     * Expected methods
     */

    test(`(${name}) - RoomFileTypeService must implement expected methods`, () => {
        expect(RoomFileTypeService).toHaveProperty('findOne');
        expect(RoomFileTypeService).toHaveProperty('findAll');
    });



    /**
     * RoomFileTypeService.findOne
     */

    test.each([
        data.room_file_types.map(rft => rft.name),
    ])(`(${name}) - RoomFileTypeService.findOne valid partitions`, async (name) => {
        const result = await RoomFileTypeService.findOne({ name });

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
        [{ name: 1 }, 'room_file_type not found'],
        [{ name: "test" }, 'room_file_type not found'],
    ])(`(${name}) - RoomFileTypeService.findOne invalid partitions`, async (options, expected) => {
        expect(async () => await RoomFileTypeService.findOne(options)).rejects.toThrowError(expected);
    });



    /**
     * RoomFileTypeService.findAll
     */

    test.each([
        [undefined],
        [{}],
        [{ limit: 2 }],
        [{ limit: 1 }],
        [{ limit: 2, page: 1 }],
        [{ limit: 1, page: 2 }],
    ])(`(${name}) - RoomFileTypeService.findAll valid partitions`, async (options) => {
        const result = await RoomFileTypeService.findAll(options);

        expect(result).toHaveProperty('total');
        expect(result).toHaveProperty('data');

        expect(result.total).toBe(4);
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
    ])(`(${name}) - RoomFileTypeService.findAll invalid partitions`, async (options, expected) => {
        expect(async () => await RoomFileTypeService.findAll(options)).rejects.toThrowError(expected);
    });
};

roomFileTypeServiceTest(RelationalRoomFileTypeService, 'Relational');
roomFileTypeServiceTest(DocumentRoomFileTypeService, 'Document');
//roomFileTypeServiceTest(GraphRoomFileTypeService, 'Graph');
