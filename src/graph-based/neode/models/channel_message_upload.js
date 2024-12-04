export default {
    uuid: {
        primary: true,
        type: 'uuid',
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
        relationship: 'SAVED_AS',
        direction: 'out',
        eager: true
    },
    channel_message_upload_type: {
        type: 'relationship',
        target: 'ChannelMessageUploadType',
        relationship: 'TYPE_IS',
        direction: 'out',
        eager: true
    },
    /**
     * INCOMING RELATION
     */
    channel_message: {
        type: 'relationship',
        target: 'ChannelMessage',
        relationship: 'UPLOAD_IS',
        direction: 'in',
    },
}
