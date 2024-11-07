export default {
    name: {
        primary: true,
        type: 'string',
        required: true
    },
    user_logins: {
        type: 'relationship',
        target: 'UserLogin',
        relationship: 'HAS_LOGIN_TYPE',
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
