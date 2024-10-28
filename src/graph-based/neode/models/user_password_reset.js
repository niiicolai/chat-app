export default {
    uuid: {
        primary: true,
        type: 'string',
        required: true
    },
    expires_at: {
        type: 'datetime',
        required: true
    },
    user: {
        type: 'relationship',
        target: 'User',
        relationship: 'HAS_PASSWORD_RESET',
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
