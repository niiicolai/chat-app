export default {
    uuid: {
        primary: true,
        type: 'string',
        required: true
    },
    is_verified: {
        type: 'boolean',
        required: true,
        default: false
    },
    user: {
        type: 'relationship',
        target: 'User',
        relationship: 'HAS_EMAIL_VERIFICATION',
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
