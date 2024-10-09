
export default {
    channelWebhookMessage: {
        type: 'object',
        properties: {
            uuid: {
                type: 'string'
            },
            body: {
                type: 'string'
            },
            channel_webhook_message_type_name: {
                type: 'string'
            },
            channel_webhook_uuid: {
                type: 'string'
            },
            channel_message_uuid: {
                type: 'string'
            },
            channel_uuid: {
                type: 'string'
            },
            created_at: {
                type: 'string'
            },
            updated_at: {
                type: 'string'
            },
        }
    },
    channelWebhookMessages: {
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
                    '$ref': '#/components/schemas/channelWebhookMessage'
                }
            }
        }
    },
    channelWebhookMessageInput: {
        type: 'object',
        properties: {
            body: {
                type: 'string'
            },
        }
    }
};
