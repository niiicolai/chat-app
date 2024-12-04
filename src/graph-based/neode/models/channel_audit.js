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
    channel_audit_type: {
        type: 'relationship',
        target: 'ChannelAuditType',
        relationship: 'TYPE_IS',
        direction: 'out',
        eager: true
    },
    channel: {
        type: 'relationship',
        target: 'Channel',
        relationship: 'AUDIT_BY',
        direction: 'out',
        eager: true
    },
}
