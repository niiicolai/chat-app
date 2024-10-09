
export default {
    user: {
        type: 'object',
        properties: {
            uuid: {
                type: 'string'
            },
            email: {
                type: 'string'
            },
            username: {
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
    userInput: {
        type: 'object',
        properties: {
            uuid: {
                type: 'string'
            },
            email: {
                type: 'string'
            },
            username: {
                type: 'string'
            },
            password: {
                type: 'string'
            },
            file: {
                type: 'string',
                format: 'binary'
            }
        }
    },
    userUpdateInput: {
        type: 'object',
        properties: {
            email: {
                type: 'string'
            },
            username: {
                type: 'string'
            },
            password: {
                type: 'string'
            },
            file: {
                type: 'string',
                format: 'binary'
            }
        }
    },
    userLoginInput: {
        type: 'object',
        properties: {
            email: {
                type: 'string'
            },
            password: {
                type: 'string'
            }
        }
    }
};
