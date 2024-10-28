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
    channel: {
        type: 'relationship',
        target: 'Channel',
        relationship: 'HAS_CHANNEL_MESSAGE',
        direction: 'out',
    },
    channel_message_type: {
        type: 'relationship',
        target: 'ChannelMessageType',
        relationship: 'HAS_CHANNEL_MESSAGE_TYPE',
        direction: 'out',
        eager: true
    },
    channel_message_upload: {
        type: 'relationship',
        target: 'ChannelMessageUpload',
        relationship: 'HAS_CHANNEL_MESSAGE_UPLOAD',
        direction: 'out',
    },
    channel_webhook_message: {
        type: 'relationship',
        target: 'ChannelWebhookMessage',
        relationship: 'HAS_CHANNEL_WEBHOOK_MESSAGE',
        direction: 'out',
    },
    user: {
        type: 'relationship',
        target: 'User',
        relationship: 'HAS_USER',
        direction: 'out',
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
