export default {
    uuid: {
        primary: true,
        type: 'uuid',
        required: true
    },
    rules_text: {
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
    room: {
        type: 'relationship',
        target: 'Room',
        relationship: 'RULES_SETTINGS_IS',
        direction: 'in',
    },
}
