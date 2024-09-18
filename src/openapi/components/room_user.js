
export default {
    roomUser: {
        type: 'object',
        properties: {
            uuid: {
                type: 'string'
            },
            room_uuid: {
                type: 'string'
            },
            user_uuid: {
                type: 'string'
            },
            room_user_role_name: {
                type: 'string'
            },
            created_at: {
                type: 'string'
            },
            updated_at: {
                type: 'string'
            },
            user: {
                type: 'object',
                properties: {
                    uuid: {
                        type: 'string'
                    },
                    username: {
                        type: 'string'
                    },
                    avatar_src: {
                        type: 'string'
                    }
                }
            }
        }
    },
    roomUsers: {
        type: 'object',
        properties: {
            total: {
                type: 'integer'
            },
            page: {
                type: 'integer'
            },
            limit: {
                type: 'integer'
            },
            data: {
                type: 'array',
                items: {
                    '$ref': '#/components/schemas/roomUser'
                }
            }
        }
    }
};

