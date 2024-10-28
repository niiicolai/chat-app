export default {
    name: {
        primary: true,
        type: 'string',
        required: true
    },
    room: {
        type: 'relationship',
        target: 'Room',
        relationship: 'HAS_CATEGORY',
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
