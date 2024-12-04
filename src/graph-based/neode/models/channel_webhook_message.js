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
    channel_webhook_message_type: {
        type: 'relationship',
        target: 'ChannelWebhookMessageType',
        relationship: 'TYPE_IS',
        direction: 'out',
        eager: true
    },
    channel_webhook: {
        type: 'relationship',
        target: 'ChannelWebhook',
        relationship: 'WRITTEN_BY',
        direction: 'out',
        eager: true
    },
    /**
     * INCOMING RELATION
     */
    channel_message: {
        type: 'relationship',
        target: 'ChannelMessage',
        relationship: 'GENERATED_BY',
        direction: 'in',
    },
}
