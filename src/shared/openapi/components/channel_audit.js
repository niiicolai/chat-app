
export default {
    channelAudit: {
        type: 'object',
        properties: {
            uuid: {
                type: 'string'
            },
            body: {
                type: 'string'
            },
            channel_audit_type_name: {
                type: 'string'
            },
            channel_uuid: {
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
    channelAudits: {
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
                    '$ref': '#/components/schemas/channelAudit'
                }
            }
        }
    }
};
