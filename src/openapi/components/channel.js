
export default {
    channel: {
        type: 'object',
        properties: {
            uuid: {
                type: 'string'
            },
            name: {
                type: 'string'
            },
            description: {
                type: 'string'
            },
            channel_type_name: {
                type: 'string'
            },
            created_at: {
                type: 'string'
            },
            updated_at: {
                type: 'string'
            },
            room_uuid: {
                type: 'string'
            },
            room_file: {
                '$ref': '#/components/schemas/roomFile'
            }
        }
    },
    channels: {
        type: 'object',
        properties: {
            total: {
                type: 'integer'
            },
            page: {
                type: 'integer'
            },
            limit: {
                type: 'integer'
            },
            data: {
                type: 'array',
                items: {
                    '$ref': '#/components/schemas/channel'
                }
            }
        }
    },
    channelInput: {
        type: 'object',
        properties: {
            uuid: {
                type: 'string',
                format: 'uuid'
            },
            name: {
                type: 'string'
            },
            description: {
                type: 'string'
            },
            channel_type_name: {
                type: 'string'
            },
            room_uuid: {
                type: 'string'
            },
            file: {
                type: 'string',
                format: 'binary'
            }
        }
    },
    channelUpdateInput: {
        type: 'object',
        properties: {
            name: {
                type: 'string'
            },
            description: {
                type: 'string'
            },
            file: {
                type: 'string',
                format: 'binary'
            }
        }
    }
};
