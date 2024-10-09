
export default {
    channelMessage: {
        type: 'object',
        properties: {
            uuid: {
                type: 'string'
            },
            body: {
                type: 'string'
            },
            channel_message_type_name: {
                type: 'string'
            },
            channel_uuid: {
                type: 'string'
            },
            room_uuid: {
                type: 'string'
            },
            created_at: {
                type: 'string'
            },
            updated_at: {
                type: 'string'
            },
            channel_message_upload: {
                '$ref': '#/components/schemas/channelMessageUpload'
            },
            user: {
                '$ref': '#/components/schemas/user'
            }
        }
    },
    channelMessages: {
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
                    '$ref': '#/components/schemas/channelMessage'
                }
            }
        }
    },
    channelMessageInput: {
        type: 'object',
        properties: {
            uuid: {
                type: 'string'
            },
            body: {
                type: 'string'
            },
            file: {
                type: 'string',
                format: 'binary'
            },
        }
    },
    channelMessageUpdateInput: {
        type: 'object',
        properties: {
            body: {
                type: 'string'
            },
        }
    }
};
