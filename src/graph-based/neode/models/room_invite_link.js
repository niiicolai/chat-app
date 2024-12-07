export default {
    uuid: {
        primary: true,
        type: 'uuid',
        required: true
    },
    expires_at: {
        type: 'datetime',
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
     * INCOMING RELATION
     */
    room: {
        type: 'relationship',
        target: 'Room',
        relationship: 'INVITES_VIA',
        direction: 'in',
        eager: true
    },
}
