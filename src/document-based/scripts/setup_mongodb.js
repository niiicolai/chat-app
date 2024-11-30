
/**
 * Collection JSON Schema Validations
 */

db.createCollection("roomcategories", {
    validator: {
        $jsonSchema: {
            bsonType: "object",
            required: ["_id"],
            properties: {
                _id: {
                    bsonType: "string",
                    description: "must be a string and is required"
                }
            }
        }
    }
})

db.createCollection("roomaudittypes", {
    validator: {
        $jsonSchema: {
            bsonType: "object",
            required: ["_id"],
            properties: {
                _id: {
                    bsonType: "string",
                    description: "must be a string and is required"
                }
            }
        }
    }
})

db.createCollection("roomfiletypes", {
    validator: {
        $jsonSchema: {
            bsonType: "object",
            required: ["_id"],
            properties: {
                _id: {
                    bsonType: "string",
                    description: "must be a string and is required"
                }
            }
        }
    }
})

db.createCollection("roomuserroles", {
    validator: {
        $jsonSchema: {
            bsonType: "object",
            required: ["_id"],
            properties: {
                _id: {
                    bsonType: "string",
                    description: "must be a string and is required"
                }
            }
        }
    }
})

db.createCollection("userlogintypes", {
    validator: {
        $jsonSchema: {
            bsonType: "object",
            required: ["_id"],
            properties: {
                _id: {
                    bsonType: "string",
                    description: "must be a string and is required"
                }
            }
        }
    }
})

db.createCollection("userstatusstates", {
    validator: {
        $jsonSchema: {
            bsonType: "object",
            required: ["_id"],
            properties: {
                _id: {
                    bsonType: "string",
                    description: "must be a string and is required"
                }
            }
        }
    }
})

db.createCollection("channeltypes", {
    validator: {
        $jsonSchema: {
            bsonType: "object",
            required: ["_id"],
            properties: {
                _id: {
                    bsonType: "string",
                    description: "must be a string and is required"
                }
            }
        }
    }
})

db.createCollection("channelaudittypes", {
    validator: {
        $jsonSchema: {
            bsonType: "object",
            required: ["_id"],
            properties: {
                _id: {
                    bsonType: "string",
                    description: "must be a string and is required"
                }
            }
        }
    }
})

db.createCollection("channelmessagetypes", {
    validator: {
        $jsonSchema: {
            bsonType: "object",
            required: ["_id"],
            properties: {
                _id: {
                    bsonType: "string",
                    description: "must be a string and is required"
                }
            }
        }
    }
})

db.createCollection("channelmessageuploadtypes", {
    validator: {
        $jsonSchema: {
            bsonType: "object",
            required: ["_id"],
            properties: {
                _id: {
                    bsonType: "string",
                    description: "must be a string and is required"
                }
            }
        }
    }
})

db.createCollection("channelwebhookmessagetypes", {
    validator: {
        $jsonSchema: {
            bsonType: "object",
            required: ["_id"],
            properties: {
                _id: {
                    bsonType: "string",
                    description: "must be a string and is required"
                }
            }
        }
    }
})

db.createCollection("users", {
    validator: {
        $jsonSchema: {
            bsonType: "object",
            required: ["_id", "username", "email", "user_email_verification", "user_status"],
            properties: {
                _id: {
                    bsonType: "string",
                    pattern: "^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$",
                    description: "must be a valid UUID"
                },
                username: {
                    bsonType: "string",
                    description: "must be a string and is required"
                },
                email: {
                    bsonType: "string",
                    description: "must be a string and is required"
                },
                avatar_src: {
                    bsonType: "string",
                    description: "must be a string"
                },
                user_email_verification: {
                    bsonType: "object",
                    required: ["_id"],
                    properties: {
                        _id: {
                            bsonType: "string",
                            pattern: "^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$",
                            description: "must be a valid UUID"
                        },
                        is_verified: {
                            bsonType: "bool",
                            description: "must be a boolean",
                            default: false
                        },
                    }
                },
                user_status: {
                    bsonType: "object",
                    required: ["_id", "last_seen_at", "message", "total_online_hours", "user_status_state_name"],
                    properties: {
                        _id: {
                            bsonType: "string",
                            pattern: "^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$",
                            description: "must be a valid UUID"
                        },
                        last_seen_at: {
                            bsonType: "date",
                            description: "must be a date"
                        },
                        message: {
                            bsonType: "string",
                            description: "must be a string"
                        },
                        total_online_hours: {
                            bsonType: "int",
                            description: "must be an integer",
                            default: 0
                        },
                        user_status_state_name: {
                            bsonType: "string",
                            description: "must be a string"
                        }
                    }
                },
                user_logins: {
                    bsonType: "array",
                    minItems: 1,
                    maxItems: 2,
                    description: "must be an array and must have at least one item",
                    items: {
                        bsonType: "object",
                        required: ["_id", "user_login_type_name"],
                        properties: {
                            _id: {
                                bsonType: "string",
                                pattern: "^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$",
                                description: "must be a valid UUID"
                            },
                            password: {
                                bsonType: "string",
                                description: "must be a string"
                            },
                            third_party_id: {
                                bsonType: "string",
                                description: "must be a string"
                            },
                            user_login_type_name: {
                                bsonType: "string",
                                description: "must be a string"
                            }
                        }
                    }
                },
                user_password_resets: {
                    bsonType: "array",
                    description: "must be an array",
                    maxItems: 5,
                    items: {
                        bsonType: "object",
                        required: ["_id", "never_expires"],
                        properties: {
                            _id: {
                                bsonType: "string",
                                pattern: "^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$",
                                description: "must be a valid UUID"
                            },
                            expires_at: {
                                bsonType: "date",
                                description: "must be a date"
                            },
                            never_expires: {
                                bsonType: "bool",
                                description: "must be a boolean",
                                default: false
                            }
                        }
                    }
                },
            }
        }
    }
})

db.createCollection("rooms", {
    validator: {
        $jsonSchema: {
            bsonType: "object",
            required: [
                "_id",
                "name",
                "description",
                "room_category_name",
                "room_join_settings",
                "room_file_settings",
                "room_user_settings",
                "room_channel_settings",
                "room_rules_settings",
                "room_avatar",
            ],
            properties: {
                _id: {
                    bsonType: "string",
                    pattern: "^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$",
                    description: "must be a valid UUID"
                },
                name: {
                    bsonType: "string",
                    description: "must be a string and is required"
                },
                description: {
                    bsonType: "string",
                    description: "must be a string and is required"
                },
                room_category_name: {
                    bsonType: "string",
                    description: "must be a string"
                },
                room_join_settings: {
                    bsonType: "object",
                    required: ["_id", "join_message"],
                    properties: {
                        _id: {
                            bsonType: "string",
                            pattern: "^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$",
                            description: "must be a valid UUID"
                        },
                        join_message: {
                            bsonType: "string",
                            description: "must be a string and is required"
                        },
                        join_channel: {
                            bsonType: "object",
                            required: ["_id"],
                            properties: {
                                _id: {
                                    bsonType: "string",
                                    pattern: "^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$",
                                    description: "must be a valid UUID referencing a channel document"
                                }
                            }
                        }
                    }
                },
                room_file_settings: {
                    bsonType: "object",
                    required: ["_id", "file_days_to_live", "total_files_bytes_allowed", "single_file_bytes_allowed"],
                    properties: {
                        _id: {
                            bsonType: "string",
                            pattern: "^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$",
                            description: "must be a valid UUID"
                        },
                        file_days_to_live: {
                            bsonType: "int",
                            description: "must be an integer and is required"
                        },
                        total_files_bytes_allowed: {
                            bsonType: "int",
                            description: "must be an integer and is required"
                        },
                        single_file_bytes_allowed: {
                            bsonType: "int",
                            description: "must be an integer and is required"
                        }
                    }
                },
                room_user_settings: {
                    bsonType: "object",
                    required: ["_id", "max_users"],
                    properties: {
                        _id: {
                            bsonType: "string",
                            pattern: "^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$",
                            description: "must be a valid UUID"
                        },
                        max_users: {
                            bsonType: "int",
                            description: "must be an integer and is required"
                        }
                    }
                },
                room_channel_settings: {
                    bsonType: "object",
                    required: ["_id", "max_channels", "message_days_to_live"],
                    properties: {
                        _id: {
                            bsonType: "string",
                            pattern: "^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$",
                            description: "must be a valid UUID"
                        },
                        max_channels: {
                            bsonType: "int",
                            description: "must be an integer and is required"
                        },
                        message_days_to_live: {
                            bsonType: "int",
                            description: "must be an integer and is required"
                        }
                    }
                },
                room_rules_settings: {
                    bsonType: "object",
                    required: ["_id", "rules_text"],
                    properties: {
                        _id: {
                            bsonType: "string",
                            pattern: "^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$",
                            description: "must be a valid UUID"
                        },
                        rules_text: {
                            bsonType: "string",
                            description: "must be a string and is required"
                        }
                    }
                },
                room_avatar: {
                    bsonType: "object",
                    required: ["_id"],
                    properties: {
                        _id: {
                            bsonType: "string",
                            pattern: "^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$",
                            description: "must be a valid UUID"
                        },
                        room_file: {
                            bsonType: "object",
                            required: ["_id"],
                            properties: {
                                _id: {
                                    bsonType: "string",
                                    pattern: "^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$",
                                    description: "must be a valid UUID referencing a room file document"
                                }
                            }
                        }
                    }
                },
                room_users: {
                    bsonType: "array",
                    minItems: 1,
                    description: "must be an array and must have at least one item",
                    items: {
                        bsonType: "object",
                        required: ["_id", "room_user_role_name", "user"],
                        properties: {
                            _id: {
                                bsonType: "string",
                                pattern: "^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$",
                                description: "must be a valid UUID"
                            },
                            room_user_role_name: {
                                bsonType: "string",
                                description: "must be a string"
                            },
                            user: {
                                bsonType: "object",
                                required: ["_id"],
                                properties: {
                                    _id: {
                                        bsonType: "string",
                                        pattern: "^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$",
                                        description: "must be a valid UUID referencing a user document"
                                    }
                                }
                            }
                        }
                    }
                },
                room_invite_links: {
                    bsonType: "array",
                    description: "must be an array",
                    items: {
                        bsonType: "object",
                        required: ["_id"],
                        properties: {
                            _id: {
                                bsonType: "string",
                                pattern: "^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$",
                                description: "must be a valid UUID"
                            },
                            expires_at: {
                                bsonType: "date",
                                description: "must be a date"
                            },
                        }
                    }
                }
            }
        }
    }
})

db.createCollection("roomfiles", {
    validator: {
        $jsonSchema: {
            bsonType: "object",
            required: [
                "_id",
                "src",
                "size",
                "room",
                "room_file_type_name",
            ],
            properties: {
                _id: {
                    bsonType: "string",
                    pattern: "^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$",
                    description: "must be a valid UUID"
                },
                src: {
                    bsonType: "string",
                    description: "must be a string and is required"
                },
                size: {
                    bsonType: "int",
                    description: "must be an integer and is required"
                },
                room: {
                    bsonType: "object",
                    required: ["_id"],
                    properties: {
                        _id: {
                            bsonType: "string",
                            pattern: "^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$",
                            description: "must be a valid UUID referencing a room document"
                        }
                    }
                },
                room_file_type_name: {
                    bsonType: "string",
                    description: "must be a string"
                }
            }
        }
    }
})

db.createCollection("roomaudits", {
    validator: {
        $jsonSchema: {
            bsonType: "object",
            required: [
                "_id",
                "body",
                "room_audit_type_name",
            ],
            properties: {
                _id: {
                    bsonType: "string",
                    pattern: "^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$",
                    description: "must be a valid UUID"
                },
                body: {
                    bsonType: "string",
                    description: "must be a string and is required"
                },
                room_audit_type_name: {
                    bsonType: "string",
                    description: "must be a string"
                },
                room: {
                    bsonType: "object",
                    required: ["_id"],
                    properties: {
                        _id: {
                            bsonType: "string",
                            pattern: "^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$",
                            description: "must be a valid UUID referencing a room document"
                        }
                    }
                }
            }
        }
    }
})

db.createCollection("channels", {
    validator: {
        $jsonSchema: {
            bsonType: "object",
            required: [
                "_id",
                "name",
                "description",
                "room",
                "channel_type_name",
            ],
            properties: {
                _id: {
                    bsonType: "string",
                    pattern: "^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$",
                    description: "must be a valid UUID"
                },
                name: {
                    bsonType: "string",
                    description: "must be a string and is required"
                },
                description: {
                    bsonType: "string",
                    description: "must be a string and is required"
                },
                room: {
                    bsonType: "object",
                    required: ["_id"],
                    properties: {
                        _id: {
                            bsonType: "string",
                            pattern: "^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$",
                            description: "must be a valid UUID referencing a room document"
                        }
                    }
                },
                channel_type_name: {
                    bsonType: "string",
                    description: "must be a string"
                },
                channel_webhook: {
                    bsonType: "object",
                    required: ["_id", "name", "description"],
                    properties: {
                        _id: {
                            bsonType: "string",
                            pattern: "^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$",
                            description: "must be a valid UUID"
                        },
                        name: {
                            bsonType: "string",
                            description: "must be a string and is required"
                        },
                        description: {
                            bsonType: "string",
                            description: "must be a string and is required"
                        },
                        room_file: {
                            bsonType: "object",
                            required: ["_id"],
                            properties: {
                                _id: {
                                    bsonType: "string",
                                    pattern: "^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$",
                                    description: "must be a valid UUID referencing a room file document"
                                }
                            }
                        }
                    }
                },
                room_file: {
                    bsonType: "object",
                    required: ["_id"],
                    properties: {
                        _id: {
                            bsonType: "string",
                            pattern: "^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$",
                            description: "must be a valid UUID referencing a room file document"
                        }
                    }
                }
            }
        }
    }
})

db.createCollection("channelaudits", {
    validator: {
        $jsonSchema: {
            bsonType: "object",
            required: [
                "_id",
                "body",
                "channel_audit_type_name",
            ],
            properties: {
                _id: {
                    bsonType: "string",
                    pattern: "^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$",
                    description: "must be a valid UUID"
                },
                body: {
                    bsonType: "string",
                    description: "must be a string and is required"
                },
                channel_audit_type_name: {
                    bsonType: "string",
                    description: "must be a string"
                },
                channel: {
                    bsonType: "object",
                    required: ["_id"],
                    properties: {
                        _id: {
                            bsonType: "string",
                            pattern: "^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$",
                            description: "must be a valid UUID referencing a channel document"
                        }
                    }
                }
            }
        }
    }
})

db.createCollection("channelmessages", {
    validator: {
        $jsonSchema: {
            bsonType: "object",
            required: [
                "_id",
                "body",
                "channel",
                "channel_message_type_name",
            ],
            properties: {
                _id: {
                    bsonType: "string",
                    pattern: "^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$",
                    description: "must be a valid UUID"
                },
                body: {
                    bsonType: "string",
                    description: "must be a string and is required"
                },
                channel: {
                    bsonType: "object",
                    required: ["_id"],
                    properties: {
                        _id: {
                            bsonType: "string",
                            pattern: "^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$",
                            description: "must be a valid UUID referencing a channel document"
                        }
                    }
                },
                channel_message_type_name: {
                    bsonType: "string",
                    description: "must be a string"
                },
                channel_message_upload: {
                    bsonType: "object",
                    required: ["_id", "channel_message_upload_type_name", "room_file"],
                    properties: {
                        _id: {
                            bsonType: "string",
                            pattern: "^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$",
                            description: "must be a valid UUID"
                        },
                        channel_message_upload_type_name: {
                            bsonType: "string",
                            description: "must be a string"
                        },
                        room_file: {
                            bsonType: "object",
                            required: ["_id"],
                            properties: {
                                _id: {
                                    bsonType: "string",
                                    pattern: "^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$",
                                    description: "must be a valid UUID referencing a room file document"
                                }
                            }
                        }
                    }
                },
                channel_webhook_message: {
                    bsonType: "object",
                    required: ["_id", "body", "channel_webhook", "channel_webhook_message_type_name"],
                    properties: {
                        _id: {
                            bsonType: "string",
                            pattern: "^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$",
                            description: "must be a valid UUID"
                        },
                        body: {
                            bsonType: "string",
                            description: "must be a string"
                        },
                        channel_webhook: {
                            bsonType: "object",
                            required: ["_id"],
                            properties: {
                                _id: {
                                    bsonType: "string",
                                    pattern: "^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$",
                                    description: "must be a valid UUID referencing a channel webhook document"
                                }
                            }
                        },
                        channel_webhook_message_type_name: {
                            bsonType: "string",
                            description: "must be a string"
                        }
                    }
                }
            }
        }
    }
})

/**
 * Create Indexes
 */
db.rooms.createIndex({ name: 1 }, { unique: true })
db.roomfiles.createIndex({ src: 1 }, { unique: true })
db.channels.createIndex({ name: 1, channel_type_name: 1 }, { unique: true })
db.users.createIndex({ email: 1 }, { unique: true })
db.users.createIndex({ username: 1 }, { unique: true })
db.rooms.createIndex({ room_category_name: 1 })

/**
 * Create Custom Roles
 */
db.createRole({
    role: "chat_restricted",
    privileges: [
        {
            resource: { db: "chat", collection: "roomaudits" },
            actions: ["find"]
        },
        {
            resource: { db: "chat", collection: "channelaudits" },
            actions: ["find"]
        },
    ],
    roles: []
});

/**
 * Create Users
 */
db.createUser({
    user: "chat_user",
    pwd: "password",
    roles: [
        { role: "readWrite", db: "chat" }, 
        { role: "readWrite", db: "chat_test" }, 
        { role: "readWrite", db: "chat_prod" }
    ]
});

db.createUser({
    user: "chat_admin",
    pwd: "password",
    roles: [
        { role: "dbAdmin", db: "chat" }, 
        { role: "dbAdmin", db: "chat_test" }, 
        { role: "dbAdmin", db: "chat_prod" }
    ]
});

db.createUser({
    user: "chat_guest",
    pwd: "password",
    roles: [
        { role: "read", db: "chat" }, 
        { role: "read", db: "chat_test" }, 
        { role: "read", db: "chat_prod" }
    ]
});

db.createUser({
    user: "chat_restricted",
    pwd: "password",
    roles: [
        { role: "chat_restricted", db: "chat" }, 
    ]
});

