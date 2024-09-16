
export default {
    roomInviteLink: {
        type: 'object',
        properties: {
            uuid: {
                type: 'string'
            },
            expires_at: {
                type: 'string'
            },
            room_uuid: {
                type: 'string'
            }
        }
    },
    roomInviteLinks: {
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
                    '$ref': '#/components/schemas/roomInviteLink'
                }
            }
        }
    },
    roomInviteLinkInput: {
        type: 'object',
        properties: {
            uuid: {
                type: 'string'
            },
            room_uuid: {
                type: 'string'
            },
            expires_at: {
                type: 'string'
            }
        }
    },
    roomInviteLinkUpdateInput: {
        type: 'object',
        properties: {
            expires_at: {
                type: 'string'
            }
        }
    }
};
