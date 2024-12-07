export default {
    uuid: {
        primary: true,
        type: 'string',
        required: true
    },
    max_users: {
        type: 'integer',
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
    room: {
        type: 'relationship',
        target: 'Room',
        relationship: 'USER_SETTINGS_IS',
        direction: 'in',
    },
}
