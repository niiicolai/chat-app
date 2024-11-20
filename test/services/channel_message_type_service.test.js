import RelationalChannelMessageTypeService from '../../src/relational-based/services/channel_message_type_service.js';
import DocumentChannelMessageTypeService from '../../src/document-based/services/channel_message_type_service.js';
import GraphChannelMessageTypeService from '../../src/graph-based/services/channel_message_type_service.js';
import { test, expect } from 'vitest';

const channelMessageTypeServiceTest = (ChannelMessageTypeService, name) => {

    test(`(${name}) - ChannelMessageTypeService must implement expected methods`, () => {
        expect(ChannelMessageTypeService).toHaveProperty('findOne');
        expect(ChannelMessageTypeService).toHaveProperty('findAll');
    });

    test.each([
        ['User'],
        ['System'],
        ['Webhook'],
    ])(`(${name}) - ChannelMessageTypeService.findOne valid partitions`, async (name) => {
        const result = await ChannelMessageTypeService.findOne({ name });

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
        [{ name: 1 }, 'channel_message_type not found'],
        [{ name: "test" }, 'channel_message_type not found'],
    ])(`(${name}) - ChannelMessageTypeService.findOne invalid partitions`, async (options, expected) => {
        expect(() => ChannelMessageTypeService.findOne(options)).rejects.toThrowError(expected);
    });

    test.each([
        [undefined],
        [{}],
        [{ limit: 3 }],
        [{ limit: 2 }],
        [{ limit: 1 }],
        [{ limit: 3, page: 1 }],
        [{ limit: 2, page: 2 }],
        [{ limit: 1, page: 3 }],
    ])(`(${name}) - ChannelMessageTypeService.findAll valid partitions`, async (options) => {
        const result = await ChannelMessageTypeService.findAll(options);

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
    ])(`(${name}) - ChannelMessageTypeService.findAll invalid partitions`, async (options, expected) => {
        expect(() => ChannelMessageTypeService.findAll(options)).rejects.toThrowError(expected);
    });
}

channelMessageTypeServiceTest(RelationalChannelMessageTypeService, 'Relational');
channelMessageTypeServiceTest(DocumentChannelMessageTypeService, 'Document');
channelMessageTypeServiceTest(GraphChannelMessageTypeService, 'Graph');
