
export default {
    roomAudit: {
        type: 'object',
        properties: {
            uuid: {
                type: 'string'
            },
            body: {
                type: 'string'
            },
            room_audit_type_name: {
                type: 'string'
            },
            room_uuid: {
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
    roomAudits: {
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
                    '$ref': '#/components/schemas/roomAudit'
                }
            }
        }
    }
};
