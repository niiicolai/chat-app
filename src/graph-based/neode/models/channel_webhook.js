export default {
    uuid: {
        primary: true,
        type: 'uuid',
        index: true
    },
    name: {
        type: 'string',
        required: true
    },
    description: {
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
    room_file: {
        type: 'relationship',
        target: 'RoomFile',
        relationship: 'WEBHOOK_AVATAR_IS',
        direction: 'out',
        eager: true
    },
    channel: {
        type: 'relationship',
        target: 'Channel',
        relationship: 'WRITE_TO',
        direction: 'out',
        eager: true
    },
    /**
     * INCOMING RELATION
     */
    channel_webhook_message: {
        type: 'relationship',
        target: 'ChannelWebhookMessage',
        relationship: 'WRITTEN_BY',
        direction: 'in',
    },
}
