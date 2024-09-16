

export default {
    channelMessageUpload: {
        type: 'object',
        properties: {
            uuid: {
                type: 'string'
            },
            channel_message_upload_type_name: {
                type: 'string'
            },
            created_at: {
                type: 'string'
            },
            updated_at: {
                type: 'string'
            },
            room_file: {
                '$ref': '#/components/schemas/roomFile'
            }
        }
    },
    channelMessageUploads: {
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
                    '$ref': '#/components/schemas/channelMessageUpload'
                }
            }
        }
    }
};
