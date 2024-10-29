export default {
    uuid: {
        primary: true,
        type: 'uuid',
        required: true
    },
    room_file: {
        type: 'relationship',
        target: 'RoomFile',
        relationship: 'HAS_ROOM_FILE',
        direction: 'out',
        eager: true
    },
    channel_message_upload_type: {
        type: 'relationship',
        target: 'ChannelMessageUploadType',
        relationship: 'HAS_CHANNEL_MESSAGE_UPLOAD_TYPE',
        direction: 'out',
        eager: true
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
