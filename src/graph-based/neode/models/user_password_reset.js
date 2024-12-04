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
    /**
     * INCOMING RELATION
     */
    user: {
        type: 'relationship',
        target: 'User',
        relationship: 'RESETTED_BY',
        direction: 'in',
        eager: false
    },
}
