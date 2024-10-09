
export default {
    channelWebhook: {
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
            channel_uuid: {
                type: 'string'
            },
            room_uuid: {
                type: 'string'
            },
            room_file: {
                '$ref': '#/components/schemas/roomFile'
            },
            created_at: {
                type: 'string'
            },
            updated_at: {
                type: 'string'
            },
        }
    },
    channelWebhooks: {
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
                    '$ref': '#/components/schemas/channelWebhook'
                }
            }
        }
    },
    channelWebhookInput: {
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
            channel_uuid: {
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
    channelWebhookUpdateInput: {
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
