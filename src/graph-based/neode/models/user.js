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
     * OUTGOING RELATION
     */
    user_status: {
        type: 'relationship',
        target: 'UserStatus',
        relationship: 'STATUS_IS',
        direction: 'out',
        required: false,
        eager: true
    },
    user_email_verification: {
        type: 'relationship',
        target: 'UserEmailVerification',
        relationship: 'EMAIL_VERIFY_VIA',
        direction: 'out',
        required: false,
        eager: true
    },
    user_login: {
        type: 'relationship',
        target: 'UserLogin',
        relationship: 'AUTHORIZE_VIA',
        direction: 'out',
        required: false,
        eager: true
    },
    room_user: {
        type: 'relationship',
        target: 'Room',
        relationship: 'MEMBER_IN',
        direction: 'out',
        required: false,
        eager: true,
        properties: {
            role: {
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
            }
        }
    },
    user_password_reset: {
        type: 'relationship',
        target: 'UserPasswordReset',
        relationship: 'RESETTED_BY',
        direction: 'out',
        required: false,
        eager: true
    },
    /**
     * INCOMING RELATION
     */
    channel_message: {
        type: 'relationship',
        target: 'ChannelMessage',
        relationship: 'WRITTEN_BY',
        direction: 'in',
        required: false,
        eager: false
    },
}
