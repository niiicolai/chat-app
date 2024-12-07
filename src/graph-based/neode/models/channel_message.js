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
    /**
     * OUTGOING RELATION
     */
    channel: {
        type: 'relationship',
        target: 'Channel',
        relationship: 'WRITTEN_IN',
        direction: 'out',
        eager: true
    },
    channel_message_type: {
        type: 'relationship',
        target: 'ChannelMessageType',
        relationship: 'TYPE_IS',
        direction: 'out',
        eager: true
    },
    user: {
        type: 'relationship',
        target: 'User',
        relationship: 'WRITTEN_BY',
        direction: 'out',
        eager: true
    },
    channel_webhook_message: {
        type: 'relationship',
        target: 'ChannelWebhookMessage',
        relationship: 'GENERATED_BY',
        direction: 'out',
        eager: true
    },
    channel_message_upload: {
        type: 'relationship',
        target: 'ChannelMessageUpload',
        relationship: 'UPLOAD_IS',
        direction: 'out',
        eager: true
    },
}
