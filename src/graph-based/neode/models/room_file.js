export default {
    uuid: {
        primary: true,
        type: 'uuid',
        required: true
    },
    src: {
        type: 'string',
        required: true
    },
    size: {
        type: 'integer',
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
    room: {
        type: 'relationship',
        target: 'Room',
        relationship: 'STORED_IN',
        direction: 'out',
        eager: true
    },
    room_file_type: {
        type: 'relationship',
        target: 'RoomFileType',
        relationship: 'TYPE_IS',
        direction: 'out',
        eager: true
    },
    /**
     * INCOMING RELATION
     */
    channel_message_upload: {
        type: 'relationship',
        target: 'ChannelMessageUpload',
        relationship: 'SAVED_AS',
        direction: 'in',
    },
    channel_webhook: {
        type: 'relationship',
        target: 'ChannelWebhook',
        relationship: 'WEBHOOK_AVATAR_IS',
        direction: 'in',
    },
    channel: {
        type: 'relationship',
        target: 'Channel',
        relationship: 'CHANNEL_AVATAR_IS',
        direction: 'in',
    },
    room_avatar: {
        type: 'relationship',
        target: 'RoomAvatar',
        relationship: 'ROOM_AVATAR_IS',
        direction: 'in',
    },
}
