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
    channel_audit_type: {
        type: 'relationship',
        target: 'ChannelAuditType',
        relationship: 'HAS_AUDIT_TYPE',
        direction: 'out',
        eager: true
    },
    channel: {
        type: 'relationship',
        target: 'Channel',
        relationship: 'HAS_CHANNEL',
        direction: 'out',
        eager: true
    },
    user: {
        type: 'relationship',
        target: 'User',
        relationship: 'HAS_USER',
        direction: 'out',
        eager: true
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
