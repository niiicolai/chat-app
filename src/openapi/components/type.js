
export default {
    type: {
        type: 'object',
        properties: {
            name: {
                type: 'string'
            },
            created_at: {
                type: 'string'
            },
            updated_at: {
                type: 'string'
            },
        }
    },
    types: {
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
                    '$ref': '#/components/schemas/type'
                }
            }
        }
    }
};
