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
    user_login: {
        type: 'relationship',
        target: 'UserLogin',
        relationship: 'TYPE_IS',
        direction: 'in',
    },
}
