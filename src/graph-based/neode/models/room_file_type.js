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
    room_file: {
        type: 'relationship',
        target: 'RoomFile',
        relationship: 'TYPE_IS',
        direction: 'in',
    },
}
