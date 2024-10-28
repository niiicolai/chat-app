export default {
    uuid: {
        primary: true,
        type: 'string',
        required: true
    },
    room_user_role: {
        type: 'relationship',
        target: 'RoomUserRole',
        relationship: 'HAS_ROLE',
        direction: 'out',
        eager: true
    },
    room: {
        type: 'relationship',
        target: 'Room',
        relationship: 'HAS_ROOM',
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
