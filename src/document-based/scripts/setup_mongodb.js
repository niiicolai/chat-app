/**
 * @function setupMongoDB
 * @description Setup MongoDB with collections, indexes, roles, and users
 * @param {Object} db
 * @returns {Promise<void>}
 */
export default async (db) => {

    try {

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
        const collections = await db.listCollections().toArray();
        const existingCollections = collections.map((col) => col.name);

        // Helper function to create indexes only if the collection exists
        async function createIndexIfExists(collectionName, index, options) {
            if (existingCollections.includes(collectionName)) {
                await db.collection(collectionName).createIndex(index, options);
                console.log(`Index created on '${collectionName}' with`, index);
            } else {
                console.warn(`Collection '${collectionName}' does not exist. Skipping index creation.`);
            }
        }

        await createIndexIfExists("rooms", { name: 1 }, { unique: true });
        await createIndexIfExists("channels", { name: 1, channel_type: 1, room: 1 }, { unique: true });
        await createIndexIfExists("users", { email: 1 }, { unique: true });
        await createIndexIfExists("users", { username: 1 }, { unique: true });
        await createIndexIfExists("rooms", { room_category: 1 }, {}); // Non-unique index

        /**
         * Create Custom Roles
         */
        const roleInfo = await db.command({
            rolesInfo: { role: "chat_restricted", db: "chat" },
            showPrivileges: true,
        });

        if (roleInfo.roles.length > 0) {
            console.log("Role 'chat_restricted' already exists. Skipping creation.");
        } else {
            const roleResult = await db.command({
                createRole: "chat_restricted",
                privileges: [
                    {
                        resource: { db: "chat", collection: "roomaudits" },
                        actions: ["find"],
                    },
                    {
                        resource: { db: "chat", collection: "channelaudits" },
                        actions: ["find"],
                    },
                ],
                roles: [],
            });
            console.log(`Role created: ${roleResult.role}`);
        }

        /**
         * Create Users
         */

        async function ensureUserExists(db, username, password, roles) {
            try {
                // Check if the user exists
                const userInfo = await db.command({ usersInfo: { user: username, db: "chat" } });

                if (userInfo.users.length > 0) {
                    console.log(`User '${username}' already exists. Skipping creation.`);
                    return;
                }

                // Create the user if it doesn't exist
                const result = await db.command({
                    createUser: username,
                    pwd: password,
                    roles: roles,
                });

                console.log(`User '${username}' created successfully:`, result);
            } catch (err) {
                if (err.codeName === "UserNotFound") {
                    // Handle case where the user doesn't exist
                    console.log(`User '${username}' does not exist. Creating...`);
                    const db = client.db("admin");
                    const result = await db.command({
                        createUser: username,
                        pwd: password,
                        roles: roles,
                    });
                    console.log(`User '${username}' created successfully:`, result);
                } else {
                    console.error("Error ensuring user existence:", err);
                }
            }
        }

        await ensureUserExists(db, "chat_user", "password", [
            { role: "readWrite", db: "chat" },
            { role: "readWrite", db: "chat_test" },
            { role: "readWrite", db: "chat_prod" },
        ]);

        await ensureUserExists(db, "chat_admin", "password", [
            { role: "dbAdmin", db: "chat" },
            { role: "dbAdmin", db: "chat_test" },
            { role: "dbAdmin", db: "chat_prod" },
        ]);

        await ensureUserExists(db, "chat_guest", "password", [
            { role: "read", db: "chat" },
            { role: "read", db: "chat_test" },
            { role: "read", db: "chat_prod" },
        ]);

        await ensureUserExists(db, "chat_restricted", "password", [
            { role: "chat_restricted", db: "chat" },
        ]);

    } catch (error) {
        console.error(error);
    }
}
