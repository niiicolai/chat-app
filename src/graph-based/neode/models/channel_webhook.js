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
    channel: {
        type: 'relationship',
        target: 'Channel',
        relationship: 'HAS_CHANNEL',
        direction: 'out',
        eager: true
    },
    room_file: {
        type: 'relationship',
        target: 'RoomFile',
        relationship: 'HAS_CHANNEL_FILE',
        direction: 'out',
        eager: true
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
