
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
    user_status_state: {
        type: 'relationship',
        target: 'UserStatusState',
        relationship: 'STATE_IS',
        direction: 'out',
        eager: true
    },
    /**
     * INCOMING RELATION
     */
    user: {
        type: 'relationship',
        target: 'User',
        relationship: 'STATUS_IS',
        direction: 'in',
        eager: false
    }
}

