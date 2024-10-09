
export default {
    roomFile: {
        type: 'object',
        properties: {
            uuid: {
                type: 'string'
            },
            src: {
                type: 'string'
            },
            room_file_type_name: {
                type: 'string'
            },
            size: {
                type: 'number'
            },
            sizeMb: {
                type: 'number'
            }
        }
    },
    roomFiles: {
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
                    '$ref': '#/components/schemas/roomFile'
                }
            }
        }
    }
};
