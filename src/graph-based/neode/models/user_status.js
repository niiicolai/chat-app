
export default {
    uuid: {
        primary: true,
        type: 'uuid',
        required: true
    },
    last_seen_at: {
        type: 'datetime',
        required: true
    },
    message: {
        type: 'string',
        required: true
    },
    total_online_hours: {
        type: 'number',
        required: true
    },
    user_status_state: {
        type: 'relationship',
        target: 'UserStatusState',
        relationship: 'STATE_IS',
        direction: 'out',
        required: false,
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
    }
}

