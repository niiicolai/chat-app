export default {
    name: {
        primary: true,
        type: 'string',
        required: true
    },
    user_status: {
        type: 'relationship',
        target: 'UserStatus',
        relationship: 'HAS_USER_STATUS',
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
    }
}
