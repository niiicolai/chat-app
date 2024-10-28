export default {
    uuid: {
        primary: true,
        type: 'uuid',
        required: true
    },
    body: {
        type: 'string',
        required: true
    },
    channel_webhook_message_type: {
        type: 'relationship',
        target: 'ChannelWebhookMessageType',
        relationship: 'HAS_CHANNEL_WEBHOOK_MESSAGE_TYPE',
        direction: 'out',
        eager: true
    },
    channel_webhook: {
        type: 'relationship',
        target: 'ChannelWebhook',
        relationship: 'HAS_CHANNEL_WEBHOOK',
        direction: 'out',
    },
    channel_message: {
        type: 'relationship',
        target: 'ChannelMessage',
        relationship: 'HAS_CHANNEL_MESSAGE',
        direction: 'in',
    },
    created_at: {
        type: 'datetime',
        required: true,
        default: () => new Date().toISOString()
    },
    updated_at: {
        type: 'datetime',
        required: true,
        default: () => new Date().toISOString()
    },
}
