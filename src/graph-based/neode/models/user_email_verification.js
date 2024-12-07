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
    created_at: {
        type: 'datetime',
        required: false,
        default: () => new Date().toISOString()
    },
    updated_at: {
        type: 'datetime',
        required: false,
        default: () => new Date().toISOString()
    },
    /**
     * INCOMING RELATION
     */
    user: {
        type: 'relationship',
        target: 'User',
        relationship: 'EMAIL_VERIFY_VIA',
        direction: 'in',
    },
}
