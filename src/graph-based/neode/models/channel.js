export default {
    uuid: {
        primary: true,
        type: 'uuid',
        required: true
    },
    name: {
        type: 'string',
        required: true
    },
    description: {
        type: 'string',
        required: true
    },
    channel_type: {
        type: 'relationship',
        target: 'ChannelType',
        relationship: 'HAS_CHANNEL_TYPE',
        direction: 'out',
        eager: true
    },
    room: {
        type: 'relationship',
        target: 'Room',
        relationship: 'HAS_ROOM',
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
    room_join_settings: {
        type: 'relationship',
        target: 'RoomJoinSettings',
        relationship: 'HAS_CHANNEL_JOIN_SETTINGS',
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
