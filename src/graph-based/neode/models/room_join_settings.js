export default {
    uuid: {
        primary: true,
        type: 'uuid',
        required: true
    },
    join_message: {
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
    join_channel: {
        type: 'relationship',
        target: 'Channel',
        relationship: 'ANNOUNCE_IN',
        direction: 'out',
        eager: true
    },
    /**
     * INCOMING RELATION
     */
    room: {
        type: 'relationship',
        target: 'Room',
        relationship: 'JOIN_SETTINGS_IS',
        direction: 'in',
    },
}
