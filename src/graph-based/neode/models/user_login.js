export default {
    uuid: {
        primary: true,
        type: 'string',
        required: true
    },
    password: {
        type: 'string',
        required: false
    },
    third_party_id: {
        type: 'string',
        required: false
    },
    user_login_type: {
        type: 'relationship',
        target: 'UserLoginType',
        relationship: 'HAS_LOGIN_TYPE',
        direction: 'out',
        eager: true
    },
    user: {
        type: 'relationship',
        target: 'User',
        relationship: 'HAS_USER',
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
