export default {
    name: {
        primary: true,
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
    channel_message: {
        type: 'relationship',
        target: 'ChannelMessage',
        relationship: 'TYPE_IS',
        direction: 'in',
    },
}
