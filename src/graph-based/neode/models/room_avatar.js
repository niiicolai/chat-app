export default {
    uuid: {
        primary: true,
        type: 'uuid',
        required: true
    },
    room: {
        type: 'relationship',
        target: 'Room',
        relationship: 'HAS_ROOM',
        direction: 'out',
    },
    room_file: {
        type: 'relationship',
        target: 'RoomFile',
        relationship: 'HAS_ROOM_FILE',
        direction: 'out',
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
