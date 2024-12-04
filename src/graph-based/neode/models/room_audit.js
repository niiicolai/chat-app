export default {
    uuid: {
        primary: true,
        type: 'uuid',
        required: true
    },
    body: {
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
     * OUTGOING RELATION
     */
    room_audit_type: {
        type: 'relationship',
        target: 'RoomAuditType',
        relationship: 'TYPE_IS',
        direction: 'out',
        eager: true
    },
    room: {
        type: 'relationship',
        target: 'Room',
        relationship: 'AUDIT_BY',
        direction: 'out',
        eager: true
    },
}
