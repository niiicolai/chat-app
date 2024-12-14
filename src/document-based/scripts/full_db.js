async function buildDb() {
    /**
      * Collection JSON Schema Validations
      */

    await db.createCollection("roomcategories", {
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

    await db.createCollection("roomaudittypes", {
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

    await db.createCollection("roomfiletypes", {
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

    await db.createCollection("roomuserroles", {
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

    await db.createCollection("userlogintypes", {
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

    await db.createCollection("userstatusstates", {
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

    await db.createCollection("channeltypes", {
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

    await db.createCollection("channelaudittypes", {
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

    await db.createCollection("channelmessagetypes", {
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

    await db.createCollection("channelmessageuploadtypes", {
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

    await db.createCollection("channelwebhookmessagetypes", {
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

    await db.createCollection("users", {
        validator: {
            $jsonSchema: {
                bsonType: "object",
                required: ["_id", "username", "email", "user_email_verification", "user_status"],
                properties: {
                    _id: {
                        bsonType: "binData",
                        pattern: "^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$",
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
                        bsonType: ["string", "null"],
                        description: "must be a string"
                    },
                    user_email_verification: {
                        bsonType: "object",
                        required: ["_id"],
                        properties: {
                            _id: {
                                bsonType: "binData",
                                pattern: "^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$",
                                description: "must be a valid UUID"
                            },
                            is_verified: {
                                bsonType: "bool",
                                description: "must be a boolean"
                            },
                        }
                    },
                    user_status: {
                        bsonType: "object",
                        required: ["_id", "last_seen_at", "message", "total_online_hours", "user_status_state"],
                        properties: {
                            _id: {
                                bsonType: "binData",
                                pattern: "^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$",
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
                                description: "must be an integer"
                            },
                            user_status_state: {
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
                            required: ["_id", "user_login_type"],
                            properties: {
                                _id: {
                                    bsonType: "binData",
                                    pattern: "^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$",
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
                                user_login_type: {
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
                            required: ["_id", "expires_at"],
                            properties: {
                                _id: {
                                    bsonType: "binData",
                                    pattern: "^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$",
                                    description: "must be a valid UUID"
                                },
                                expires_at: {
                                    bsonType: "date",
                                    description: "must be a date"
                                }
                            }
                        }
                    },
                }
            }
        }
    })

    await db.createCollection("rooms", {
        validator: {
            $jsonSchema: {
                bsonType: "object",
                required: [
                    "_id",
                    "name",
                    "description",
                    "room_category",
                    "room_join_settings",
                    "room_file_settings",
                    "room_user_settings",
                    "room_channel_settings",
                    "room_rules_settings",
                    "room_avatar",
                ],
                properties: {
                    _id: {
                        bsonType: "binData",
                        pattern: "^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$",
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
                    room_category: {
                        bsonType: "string",
                        description: "must be a string"
                    },
                    room_join_settings: {
                        bsonType: "object",
                        required: ["_id", "join_message"],
                        properties: {
                            _id: {
                                bsonType: "binData",
                                pattern: "^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$",
                                description: "must be a valid UUID"
                            },
                            join_message: {
                                bsonType: "string",
                                description: "must be a string and is required"
                            },
                            join_channel: {
                                bsonType: "binData",
                                pattern: "^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$",
                                description: "must be a valid UUID referencing a channel document"
                            }
                        }
                    },
                    room_file_settings: {
                        bsonType: "object",
                        required: ["_id", "file_days_to_live", "total_files_bytes_allowed", "single_file_bytes_allowed"],
                        properties: {
                            _id: {
                                bsonType: "binData",
                                pattern: "^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$",
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
                                bsonType: "binData",
                                pattern: "^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$",
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
                                bsonType: "binData",
                                pattern: "^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$",
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
                                bsonType: "binData",
                                pattern: "^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$",
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
                                bsonType: "binData",
                                pattern: "^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$",
                                description: "must be a valid UUID"
                            },
                            room_file: {
                                bsonType: "binData",
                                pattern: "^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$",
                                description: "must be a valid UUID referencing a room file document"
                            }
                        }
                    },
                    room_users: {
                        bsonType: "array",
                        minItems: 1,
                        description: "must be an array and must have at least one item",
                        items: {
                            bsonType: "object",
                            required: ["_id", "room_user_role", "user"],
                            properties: {
                                _id: {
                                    bsonType: "binData",
                                    pattern: "^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$",
                                    description: "must be a valid UUID"
                                },
                                room_user_role: {
                                    bsonType: "string",
                                    description: "must be a string"
                                },
                                user: {
                                    bsonType: "binData",
                                    pattern: "^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$",
                                    description: "must be a valid UUID referencing a user document"
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
                                    bsonType: "binData",
                                    pattern: "^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$",
                                    description: "must be a valid UUID"
                                },
                                expires_at: {
                                    bsonType: ["date", "null"],
                                    description: "must be a date or null"
                                },
                                never_expires: {
                                    bsonType: "bool",
                                    description: "must be a boolean"
                                }
                            }
                        }
                    }
                }
            }
        }
    })

    await db.createCollection("roomfiles", {
        validator: {
            $jsonSchema: {
                bsonType: "object",
                required: [
                    "_id",
                    "src",
                    "size",
                    "room",
                    "room_file_type",
                ],
                properties: {
                    _id: {
                        bsonType: "binData",
                        pattern: "^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$",
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
                        bsonType: "binData",
                        pattern: "^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$",
                        description: "must be a valid UUID referencing a room document"
                    },
                    room_file_type: {
                        bsonType: "string",
                        description: "must be a string"
                    }
                }
            }
        }
    })

    await db.createCollection("roomaudits", {
        validator: {
            $jsonSchema: {
                bsonType: "object",
                required: [
                    "_id",
                    "body",
                    "room_audit_type",
                ],
                properties: {
                    _id: {
                        bsonType: "binData",
                        pattern: "^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$",
                        description: "must be a valid UUID"
                    },
                    body: {
                        bsonType: "string",
                        description: "must be a string and is required"
                    },
                    room_audit_type: {
                        bsonType: "string",
                        description: "must be a string"
                    },
                    room: {
                        bsonType: "binData",
                        pattern: "^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$",
                        description: "must be a valid UUID referencing a room document"
                    }
                }
            }
        }
    })

    await db.createCollection("channels", {
        validator: {
            $jsonSchema: {
                bsonType: "object",
                required: [
                    "_id",
                    "name",
                    "description",
                    "room",
                    "channel_type",
                ],
                properties: {
                    _id: {
                        bsonType: "binData",
                        pattern: "^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$",
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
                        bsonType: "binData",
                        pattern: "^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$",
                        description: "must be a valid UUID referencing a room document"
                    },
                    channel_type: {
                        bsonType: "string",
                        description: "must be a string"
                    },
                    channel_webhook: {
                        bsonType: "object",
                        required: ["_id", "name", "description"],
                        properties: {
                            _id: {
                                bsonType: "binData",
                                pattern: "^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$",
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
                                bsonType: "binData",
                                pattern: "^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$",
                                description: "must be a valid UUID referencing a room file document"
                            }
                        }
                    },
                    room_file: {
                        bsonType: "binData",
                        pattern: "^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$",
                        description: "must be a valid UUID referencing a room file document"
                    }
                }
            }
        }
    })

    await db.createCollection("channelaudits", {
        validator: {
            $jsonSchema: {
                bsonType: "object",
                required: [
                    "_id",
                    "body",
                    "channel_audit_type",
                ],
                properties: {
                    _id: {
                        bsonType: "binData",
                        pattern: "^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$",
                        description: "must be a valid UUID"
                    },
                    body: {
                        bsonType: "string",
                        description: "must be a string and is required"
                    },
                    channel_audit_type: {
                        bsonType: "string",
                        description: "must be a string"
                    },
                    channel: {
                        bsonType: "binData",
                        pattern: "^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$",
                        description: "must be a valid UUID referencing a channel document"
                    }
                }
            }
        }
    })

    await db.createCollection("channelmessages", {
        validator: {
            $jsonSchema: {
                bsonType: "object",
                required: [
                    "_id",
                    "body",
                    "channel",
                    "channel_message_type",
                ],
                properties: {
                    _id: {
                        bsonType: "binData",
                        pattern: "^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$",
                        description: "must be a valid UUID"
                    },
                    body: {
                        bsonType: "string",
                        description: "must be a string and is required"
                    },
                    channel: {
                        bsonType: "binData",
                        pattern: "^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$",
                        description: "must be a valid UUID referencing a channel document"
                    },
                    channel_message_type: {
                        bsonType: "string",
                        description: "must be a string"
                    },
                    channel_message_upload: {
                        bsonType: "object",
                        required: ["_id", "channel_message_upload_type", "room_file"],
                        properties: {
                            _id: {
                                bsonType: "binData",
                                pattern: "^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$",
                                description: "must be a valid UUID"
                            },
                            channel_message_upload_type: {
                                bsonType: "string",
                                description: "must be a string"
                            },
                            room_file: {
                                bsonType: "binData",
                                pattern: "^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$",
                                description: "must be a valid UUID referencing a room file document"
                            }
                        }
                    },
                    channel_webhook_message: {
                        bsonType: "object",
                        required: ["_id", "body", "channel_webhook", "channel_webhook_message_type"],
                        properties: {
                            _id: {
                                bsonType: "binData",
                                pattern: "^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$",
                                description: "must be a valid UUID"
                            },
                            body: {
                                bsonType: "string",
                                description: "must be a string"
                            },
                            channel_webhook: {
                                bsonType: "binData",
                                pattern: "^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$",
                                description: "must be a valid UUID referencing a channel webhook document"
                            },
                            channel_webhook_message_type: {
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
    await db.users.createIndex({ email: 1 }, { unique: true });
    await db.users.createIndex({ username: 1 }, { unique: true });
    await db.rooms.createIndex({ name: 1 }, { unique: true });
    await db.channels.createIndex({ name: 1, channel_type: 1, room: 1 }, { unique: true });
    await db.rooms.createIndex({ room_category: 1 }, {}); // Non-unique index
    
    /**
     * Create Default Data
     */
    await db.roomcategories.insertMany([
        { _id: "General" },
        { _id: "Tech" },
        { _id: "Sports" },
        { _id: "Music" },
        { _id: "Movies" },
        { _id: "Books" },
        { _id: "Gaming" },
        { _id: "Food" },
        { _id: "Travel" },
        { _id: "Fitness" },
        { _id: "Fashion" },
        { _id: "Art" },
        { _id: "Science" },
        { _id: "Politics" },
        { _id: "Business" },
        { _id: "Education" },
        { _id: "Health" },
        { _id: "Lifestyle" },
        { _id: "Entertainment" },
        { _id: "Other" }
    ]);

    await db.roomaudittypes.insertMany([
        { _id: "ROOM_CREATED" },
        { _id: "ROOM_EDITED" },
        { _id: "ROOM_DELETED" },
        { _id: "JOIN_SETTING_EDITED" },
        { _id: "INVITE_LINK_CREATED" },
        { _id: "INVITE_LINK_EDITED" },
        { _id: "INVITE_LINK_DELETED" },
        { _id: "USER_ADDED" },
        { _id: "USER_REMOVED" },
        { _id: "FILE_CREATED" },
        { _id: "FILE_DELETED" },
        { _id: "AVATAR_CREATED" },
        { _id: "AVATAR_EDITED" },
        { _id: "AVATAR_DELETED" }
    ]);

    await db.roomfiletypes.insertMany([
        { _id: "RoomAvatar" },
        { _id: "ChannelAvatar" },
        { _id: "ChannelWebhookAvatar" },
        { _id: "ChannelMessageUpload" }
    ]);

    await db.roomuserroles.insertMany([
        { _id: "Admin" },
        { _id: "Moderator" },
        { _id: "Member" }
    ]);

    await db.userlogintypes.insertMany([
        { _id: "Password" },
        { _id: "Google" }
    ]);

    await db.userstatusstates.insertMany([
        { _id: "Online" },
        { _id: "Away" },
        { _id: "Do Not Disturb" },
        { _id: "Offline" }
    ]);

    await db.channeltypes.insertMany([
        { _id: "Text" },
        { _id: "Call" }
    ]);

    await db.channelaudittypes.insertMany([
        { _id: "CHANNEL_CREATED" },
        { _id: "CHANNEL_EDITED" },
        { _id: "CHANNEL_DELETED" },
        { _id: "MESSAGE_CREATED" },
        { _id: "MESSAGE_EDITED" },
        { _id: "MESSAGE_DELETED" },
        { _id: "WEBHOOK_CREATED" },
        { _id: "WEBHOOK_EDITED" },
        { _id: "WEBHOOK_DELETED" }
    ]);

    await db.channelmessagetypes.insertMany([
        { _id: "User" },
        { _id: "System" },
        { _id: "Webhook" }
    ]);

    await db.channelmessageuploadtypes.insertMany([
        { _id: "Image" },
        { _id: "Video" },
        { _id: "Document" }
    ]);

    await db.channelwebhookmessagetypes.insertMany([
        { _id: "Custom" },
        { _id: "GitHub" }
    ]);

    await db.users.insertMany([
        {
            _id: UUID("98f8833c-fd3e-407a-a876-1313016921a6"),
            username: "admin",
            email: "admin@example.com",
            avatar_src: "https://ghostchat.fra1.cdn.digitaloceanspaces.com/static/c7QiLXb.png",
            created_at: new Date(),
            updated_at: new Date(),
            user_email_verification: {
                _id: UUID("c1937ab7-2aff-4208-aabf-8c44b7e9a6a0"),
                is_verified: true
            },
            user_status: {
                _id: UUID("c212179e-845c-465a-869b-f35a7d5d56d0"),
                last_seen_at: new Date(),
                message: "I'm an admin",
                total_online_hours: 0,
                user_status_state: "Offline"
            },
            user_logins: [
                {
                    _id: UUID("c3d6cd83-8924-42f5-9e17-9ec6770829db"),
                    password: "$2b$10$sB6/ocJJK9HodVv7qEozKO826Ik5gmZH/1GU/xReM1ijIjlA7hvTa",
                    user_login_type: "Password"
                }
            ],
            user_password_resets: [
                {
                    _id: UUID("ac03f7c2-d3ab-4508-976b-adacd7d34253"),
                    expires_at: new Date()
                }
            ]
        },
        {
            _id: UUID("f75e037f-98e1-44cd-9ef2-7d2bf2487cac"),
            username: "moderator",
            email: "moderator@example.com",
            avatar_src: "https://ghostchat.fra1.cdn.digitaloceanspaces.com/static/c7QiLXb.png",
            created_at: new Date(),
            updated_at: new Date(),
            user_email_verification: {
                _id: UUID("c11629fc-968e-4599-9a70-39ad8a795447"),
                is_verified: true
            },
            user_status: {
                _id: UUID("595ea69a-d5b8-45de-922e-15060f4d0458"),
                last_seen_at: new Date(),
                message: "I'm a moderator",
                total_online_hours: 0,
                user_status_state: "Offline"
            },
            user_logins: [
                {
                    _id: UUID("5d7e71ef-cb3e-4aed-b819-1fa13f167459"),
                    password: "$2b$10$sB6/ocJJK9HodVv7qEozKO826Ik5gmZH/1GU/xReM1ijIjlA7hvTa",
                    user_login_type: "Password"
                }
            ],
            user_password_resets: [
                {
                    _id: UUID("c5dfaf46-87dc-4f24-b721-9c83759878d8"),
                    expires_at: new Date()
                }
            ]
        },
        {
            _id: UUID("39fc54f4-7a2b-4c83-9ca0-1a745e7b20eb"),
            username: "member",
            email: "member@example.com",
            avatar_src: "https://ghostchat.fra1.cdn.digitaloceanspaces.com/static/c7QiLXb.png",
            created_at: new Date(),
            updated_at: new Date(),
            user_email_verification: {
                _id: UUID("a5603354-3d20-4502-b478-089db518a113"),
                is_verified: true
            },
            user_status: {
                _id: UUID("7e1f5eaa-0fcb-4208-8dc3-3b14d1179d57"),
                last_seen_at: new Date(),
                message: "I'm a member",
                total_online_hours: 0,
                user_status_state: "Offline"
            },
            user_logins: [
                {
                    _id: UUID("6eabf282-4e2f-4ca2-b248-da124002792f"),
                    password: "$2b$10$sB6/ocJJK9HodVv7qEozKO826Ik5gmZH/1GU/xReM1ijIjlA7hvTa",
                    user_login_type: "Password"
                }
            ],
            user_password_resets: [
                {
                    _id: UUID("27a77f21-7deb-4b7c-afbd-a395fc555302"),
                    expires_at: new Date()
                }
            ]
        }
    ]);

    await db.rooms.insertMany([
        {
            _id: UUID("d07c999f-2c2b-4440-89a7-44c64c1c5c13"),
            name: "General",
            description: "General chat room",
            created_at: new Date(),
            updated_at: new Date(),
            room_category: "General",
            room_join_settings: {
                _id: UUID("03af87c7-18bc-4d78-96a4-39f71acc7e61"),
                join_message: "Welcome, {name} to the general chat room"
            },
            room_file_settings: {
                _id: UUID("4ced5816-608a-4676-9aff-df1c5c8793cf"),
                file_days_to_live: 30,
                total_files_bytes_allowed: 1073741824,
                single_file_bytes_allowed: 10485760
            },
            room_user_settings: {
                _id: UUID("3e94a173-15ee-41cf-87b1-884b8c1a65bb"),
                max_users: 100
            },
            room_channel_settings: {
                _id: UUID("5963726c-4c2d-40fa-b769-24a2c9cf7add"),
                max_channels: 100,
                message_days_to_live: 30
            },
            room_rules_settings: {
                _id: UUID("86bb4303-f426-4554-9877-67b506a5a7c2"),
                rules_text: "No rules"
            },
            room_avatar: {
                _id: UUID("5825088d-5398-40da-a17e-61c972fd9181")
            },
            room_users: [
                {
                    _id: UUID("fa0253f4-dfea-4571-bba0-40b408da2087"),
                    room_user_role: "Admin",
                    user: UUID("98f8833c-fd3e-407a-a876-1313016921a6")
                },
                {
                    _id: UUID("13b8a2d1-d1f5-418e-92af-b8a48e7c49dc"),
                    room_user_role: "Moderator",
                    user: UUID("f75e037f-98e1-44cd-9ef2-7d2bf2487cac")
                },
                {
                    _id: UUID("3f34b0f7-e10f-4e2f-97e4-ae7e0c526896"),
                    room_user_role: "Member",
                    user: UUID("39fc54f4-7a2b-4c83-9ca0-1a745e7b20eb")
                }
            ],
            room_invite_links: [
                {
                    _id: UUID("27ce1e37-fbb4-4fc1-85cb-8f6914f3be35"),
                    expires_at: new Date(),
                    never_expires: false,
                    created_at: new Date(),
                    updated_at: new Date()
                }
            ]
        }
    ]);

    await db.channels.insertMany([
        {
            _id: UUID("0177b962-c6ad-4493-916d-b6d540dcc4ad"),
            name: "General",
            description: "General chat channel",
            created_at: new Date(),
            updated_at: new Date(),
            room: UUID("d07c999f-2c2b-4440-89a7-44c64c1c5c13"),
            channel_type: "Text",
            channel_webhook: {
                _id: UUID("b13fcd56-b796-4697-af76-4923d7157759"),
                name: "GitHub",
                description: "GitHub webhook",
                created_at: new Date(),
                updated_at: new Date()
            }
        }
    ]);

    await db.roomfiles.insertMany([
        {
            _id: UUID("49ba53e4-4cbb-4acd-85ae-217b2ec8d740"),
            src: "https://ghostchat.fra1.cdn.digitaloceanspaces.com/static/c7QiLXb.png",
            size: 1048576,
            created_at: new Date(),
            updated_at: new Date(),
            room: UUID("d07c999f-2c2b-4440-89a7-44c64c1c5c13"),
            room_file_type: "ChannelMessageUpload"
        }
    ]);

    await db.channelmessages.insertMany([
        {
            _id: UUID("8331b2f9-2a7f-46ed-85ee-38455c21c837"),
            body: "Hello, I'm an admin",
            created_at: new Date(),
            updated_at: new Date(),
            channel: UUID("0177b962-c6ad-4493-916d-b6d540dcc4ad"),
            channel_message_type: "User",
            channel_message_upload: {
                _id: UUID("1faad8f6-2508-4c79-bafa-6325b31631c7"),
                channel_message_upload_type: "Image",
                room_file: UUID("49ba53e4-4cbb-4acd-85ae-217b2ec8d740")
            },
            user: UUID("98f8833c-fd3e-407a-a876-1313016921a6")
        },
        {
            _id: UUID("841bfe16-11e0-432b-b6fc-d9c457a23fbd"),
            body: "Hello, I'm a webhook",
            created_at: new Date(),
            updated_at: new Date(),
            channel: UUID("0177b962-c6ad-4493-916d-b6d540dcc4ad"),
            channel_message_type: "User",
            channel_webhook_message: {
                _id: UUID("b1156bf4-5ee1-4a7f-91b7-c551399f10ba"),
                body: "Hello, I'm a webhook",
                channel_webhook: UUID("b13fcd56-b796-4697-af76-4923d7157759"),
                channel_webhook_message_type: "GitHub"
            },
        }
    ]);

    await db.roomaudits.insertMany([
        {
            _id: UUID("28dc106e-7c6c-4e29-a3d8-9b307199d9e4"),
            body: "Room created",
            created_at: new Date(),
            updated_at: new Date(),
            room_audit_type: "ROOM_CREATED",
            room: UUID("d07c999f-2c2b-4440-89a7-44c64c1c5c13")
        }
    ]);

    await db.channelaudits.insertMany([
        {
            _id: UUID("972afca8-3772-406b-93a1-2b94ef4bd4f0"),
            body: "Channel created",
            created_at: new Date(),
            updated_at: new Date(),
            channel_audit_type: "CHANNEL_CREATED",
            channel: UUID("0177b962-c6ad-4493-916d-b6d540dcc4ad")
        }
    ]);
}

buildDb()
