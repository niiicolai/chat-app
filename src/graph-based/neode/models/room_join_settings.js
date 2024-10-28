export default {
    uuid: {
        primary: true,
        type: 'uuid',
        required: true
    },
    join_channel: {
        type: 'relationship',
        target: 'Channel',
        relationship: 'JOIN_CHANNEL',
        direction: 'out',
    },
    join_message: {
        type: 'string',
        required: true
    },
    room: {
        type: 'relationship',
        target: 'Room',
        relationship: 'HAS_JOIN_SETTINGS',
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
