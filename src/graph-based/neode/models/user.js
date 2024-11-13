export default {
    uuid: {
        primary: true,
        type: 'uuid',
        required: true
    },
    username: {
        type: 'string',
        required: true
    },
    email: {
        type: 'string',
        required: true
    },
    avatar_src: {
        type: 'string',
        required: false
    },
    user_status: {
        type: 'relationship',
        target: 'UserStatus',
        relationship: 'HAS_USER_STATUS',
        direction: 'out',
        required: false,
        eager: true
    },
    user_email_verification: {
        type: 'relationship',
        target: 'UserEmailVerification',
        relationship: 'HAS_USER_EMAIL_VERIFICATION',
        direction: 'out',
        required: false,
        eager: true
    },
    user_password_resets: {
        type: 'relationship',
        target: 'UserPasswordReset',
        relationship: 'HAS_PASSWORD_RESET',
        direction: 'in',
        required: false,
        eager: true
    },
    user_logins: {
        type: 'relationship',
        target: 'UserLogin',
        relationship: 'HAS_USER',
        direction: 'in',
        required: false,
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
    }
}
