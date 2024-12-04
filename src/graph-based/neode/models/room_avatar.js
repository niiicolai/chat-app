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
        relationship: 'HAS_ROOM_FILE',
        direction: 'out',
        eager: true
    },
    /**
     * INCOMING RELATION
     */
    room: {
        type: 'relationship',
        target: 'Room',
        relationship: 'ROOM_AVATAR_IS',
        direction: 'in',
        eager: true
    },
}
