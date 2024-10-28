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
    room: {
        type: 'relationship',
        target: 'Room',
        relationship: 'HAS_RULES_SETTINGS',
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
