export default {
    name: {
        primary: true,
        type: 'string',
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
    user_status: {
        type: 'relationship',
        target: 'UserStatus',
        relationship: 'STATE_IS',
        direction: 'in',
        eager: false
    },
}
