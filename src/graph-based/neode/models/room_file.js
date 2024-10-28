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
    room_file_type: {
        type: 'relationship',
        target: 'RoomFileType',
        relationship: 'HAS_ROOM_FILE_TYPE',
        direction: 'out',
        eager: true
    },
    room: {
        type: 'relationship',
        target: 'Room',
        relationship: 'HAS_ROOM',
        direction: 'out',
    },
    room_avatar: {
        type: 'relationship',
        target: 'RoomAvatar',
        relationship: 'HAS_ROOM_AVATAR',
        direction: 'in',
    },
    channel: {
        type: 'relationship',
        target: 'Channel',
        relationship: 'HAS_CHANNEL',
        direction: 'in',
    },
    channel_webhook: {
        type: 'relationship',
        target: 'ChannelWebhook',
        relationship: 'HAS_CHANNEL_WEBHOOK',
        direction: 'in',
    },
    channel_message_upload: {
        type: 'relationship',
        target: 'ChannelMessageUpload',
        relationship: 'HAS_CHANNEL_MESSAGE_UPLOAD',
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
