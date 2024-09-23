
export default {
    room: {
        type: 'object',
        properties: {
            uuid: {
                type: 'string'
            },
            name: {
                type: 'string'
            },
            description: {
                type: 'string'
            },
            room_category_name: {
                type: 'string'
            },
            created_at: {
                type: 'string'
            },
            updated_at: {
                type: 'string'
            },
            joinSettings: {
                '$ref': '#/components/schemas/joinSettings'
            },
            rulesSettings: {
                '$ref': '#/components/schemas/rulesSettings'
            },
            userSettings: {
                '$ref': '#/components/schemas/userSettings'
            },
            channelSettings: {
                '$ref': '#/components/schemas/channelSettings'
            },
            fileSettings: {
                '$ref': '#/components/schemas/fileSettings'
            },
            avatar: {
                '$ref': '#/components/schemas/roomAvatar'
            }
        }
    },
    joinSettings: {
        type: 'object',
        properties: {
            channelUuid: {
                type: 'string'
            },
            message: {
                type: 'string'
            }
        }
    },
    rulesSettings: {
        type: 'object',
        properties: {
            text: {
                type: 'string'
            }
        }
    },
    userSettings: {
        type: 'object',
        properties: {
            maxUsers: {
                type: 'integer'
            }
        }
    },
    channelSettings: {
        type: 'object',
        properties: {
            maxChannels: {
                type: 'integer'
            },
            messagesDaysToLive: {
                type: 'integer'
            }
        }
    },
    fileSettings: {
        type: 'object',
        properties: {
            totalFilesBytesAllowed: {
                type: 'integer'
            },
            singleFileBytesAllowed: {
                type: 'integer'
            },
            fileDaysToLive: {
                type: 'integer'
            },
            totalFilesMb: {
                type: 'number'
            },
            singleFileMb: {
                type: 'number'
            }
        }
    },
    roomAvatar: {
        type: 'object',
        properties: {
            uuid: {
                type: 'string'
            },
            room_file: {
                '$ref': '#/components/schemas/roomFile'
            }
        }
    },
    rooms: {
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
                    '$ref': '#/components/schemas/room'
                }
            }
        }
    },
    roomInput: {
        type: 'object',
        properties: {
            uuid: {
                type: 'string'
            },
            name: {
                type: 'string'
            },
            description: {
                type: 'string'
            },
            room_category_name: {
                type: 'string'
            },
            file: {
                type: 'string',
                format: 'binary'
            }
        }
    },
    roomUpdateInput: {
        type: 'object',
        properties: {
            name: {
                type: 'string'
            },
            description: {
                type: 'string'
            },
            room_category_name: {
                type: 'string'
            },
            file: {
                type: 'string',
                format: 'binary'
            }
        }
    },
    roomSettingsInput: {
        type: 'object',
        properties: {
            join_channel_uuid: {
                type: 'string'
            },
            join_message: {
                type: 'string'
            },
            rules_text: {
                type: 'string'
            },
        }
    },
};
