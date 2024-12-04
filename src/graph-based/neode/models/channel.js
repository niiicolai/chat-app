export default {
    uuid: {
        primary: true,
        type: 'uuid',
        required: true
    },
    name: {
        type: 'string',
        required: true
    },
    description: {
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
    room_file: {
        type: 'relationship',
        target: 'RoomFile',
        relationship: 'CHANNEL_AVATAR_IS',
        direction: 'out',
        eager: true
    },
    channel_type: {
        type: 'relationship',
        target: 'ChannelType',
        relationship: 'TYPE_IS',
        direction: 'out',
        eager: true
    },
    /**
     * INCOMING RELATION
     */
    room_join_settings: {
        type: 'relationship',
        target: 'RoomJoinSettings',
        relationship: 'ANNOUNCE_IN',
        direction: 'in',
    },
    room: {
        type: 'relationship',
        target: 'Room',
        relationship: 'COMMUNICATES_IN',
        direction: 'in',
    },
    channel_webhook: {
        type: 'relationship',
        target: 'ChannelWebhook',
        relationship: 'WRITE_TO',
        direction: 'in',
    },
    channel_message: {
        type: 'relationship',
        target: 'ChannelMessage',
        relationship: 'WRITTEN_IN',
        direction: 'in',
    },
    channel_audit: {
        type: 'relationship',
        target: 'ChannelAudit',
        relationship: 'AUDIT_IN',
        direction: 'in',
    },
}
