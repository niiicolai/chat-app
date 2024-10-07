
export default {
    userStatus: {
        type: 'object',
        properties: {
            uuid: {
                type: 'string'
            },
            status_state_name: {
                type: 'string'
            },
            message: {
                type: 'string'
            },
            last_seen_at: {
                type: 'string'
            },
            total_online_hours: {
                type: 'integer'
            },
            user_uuid: {
                type: 'string'
            },
            created_at: {
                type: 'string'
            },
            updated_at: {
                type: 'string'
            }
        }
    },
    userStatusUpdateInput: {
        type: 'object',
        properties: {
            status_state_name: {
                type: 'string'
            },
            message: {
                type: 'string'
            },
        }
    },
};
