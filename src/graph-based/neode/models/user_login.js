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
    user_login_type: {
        type: 'relationship',
        target: 'UserLoginType',
        relationship: 'TYPE_IS',
        direction: 'out',
        eager: false
    },
    /**
     * INCOMING RELATION
     */
    user: {
        type: 'relationship',
        target: 'User',
        relationship: 'AUTHORIZE_VIA',
        direction: 'in',
        eager: false
    },
}
