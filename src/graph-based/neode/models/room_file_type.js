export default {
    name: {
        primary: true,
        type: 'string',
        required: true
    },
    room_files: {
        type: 'relationship',
        target: 'RoomFile',
        relationship: 'HAS_FILE_TYPE',
        direction: 'in',
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
