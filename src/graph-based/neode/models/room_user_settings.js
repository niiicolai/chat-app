export default {
    uuid: {
        primary: true,
        type: 'string',
        required: true
    },
    max_users: {
        type: 'integer',
        required: true
    },
    room: {
        type: 'relationship',
        target: 'Room',
        relationship: 'HAS_USER_SETTINGS',
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
