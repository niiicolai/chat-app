export default {
    uuid: {
        primary: true,
        type: 'uuid',
        required: true
    },
    max_channels: {
        type: 'integer',
        required: true
    },
    message_days_to_live: {
        type: 'integer',
        required: true
    },
    room: {
        type: 'relationship',
        target: 'Room',
        relationship: 'HAS_CHANNEL_SETTINGS',
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
