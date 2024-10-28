export default {
    uuid: {
        primary: true,
        type: 'uuid',
        required: true
    },
    expires_at: {
        type: 'datetime',
        required: false
    },
    room: {
        type: 'relationship',
        target: 'Room',
        relationship: 'HAS_INVITE_LINK',
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
