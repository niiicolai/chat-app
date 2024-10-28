export default {
    name: {
        primary: true,
        type: 'string',
        required: true
    },
    room_audits: {
        type: 'relationship',
        target: 'RoomAudit',
        relationship: 'HAS_AUDIT_TYPE',
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
