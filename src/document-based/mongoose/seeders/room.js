import Room from '../models/room.js';
import RoomFile from '../models/room_file.js';
import RoomAudit from '../models/room_audit.js';
import mongoose from 'mongoose';
import data from '../../../seed_data.js';

const max_users = parseInt(process.env.ROOM_MAX_MEMBERS || 25);
const max_channels = parseInt(process.env.ROOM_MAX_CHANNELS || 5);
const message_days_to_live = parseInt(process.env.ROOM_MESSAGE_DAYS_TO_LIVE || 30);
const file_days_to_live = parseInt(process.env.ROOM_FILE_DAYS_TO_LIVE || 30);
const total_files_bytes_allowed = parseInt(process.env.ROOM_TOTAL_UPLOAD_SIZE || 52428800);
const single_file_bytes_allowed = parseInt(process.env.ROOM_UPLOAD_SIZE || 5242880);
const join_message = process.env.ROOM_JOIN_MESSAGE || "Welcome to the room!";
const rules_text = process.env.ROOM_RULES_TEXT || "# Rules\n 1. No Spamming!";

export default class RoomSeeder {
    async up() {
        const session = await mongoose.startSession();
        try {
            session.startTransaction();

            await Room.insertMany(data.rooms.map((room) => {
                return {
                    _id: room.uuid,
                    name: room.name,
                    description: room.description,
                    room_category: room.room_category_name,
                    room_join_settings: {
                        _id: room.room_join_settings.uuid,
                        join_message
                    },
                    room_file_settings: {
                        _id: room.room_file_settings.uuid,
                        file_days_to_live,
                        total_files_bytes_allowed,
                        single_file_bytes_allowed
                    },
                    room_user_settings: {
                        _id: room.room_user_settings.uuid,
                        max_users
                    },
                    room_channel_settings: {
                        _id: room.room_channel_settings.uuid,
                        max_channels,
                        message_days_to_live
                    },
                    room_rules_settings: {
                        _id: room.room_rules_settings.uuid,
                        rules_text
                    },
                    room_avatar: {
                        _id: room.room_avatar.uuid,
                        room_file: room.room_avatar.room_file_uuid
                    },
                    room_invite_links: [{
                        _id: room.room_invite_link.uuid,
                        expires_at: null
                    }],
                    room_users: room.room_users.map((room_user) => {
                        return {
                            _id: room_user.uuid,
                            room_user_role: room_user.room_user_role_name,
                            user: room_user.user_uuid
                        }
                    })
                }
            }, { session }));

            await RoomFile.insertMany(data.rooms.flatMap((room) => {
                return room.room_files.map((room_file) => {
                    return {
                        _id: room_file.uuid,
                        src: room_file.src,
                        size: room_file.size,
                        room: room.uuid,
                        room_file_type: room_file.room_file_type_name
                    }
                })
            }), { session });

            await RoomAudit.insertMany(data.rooms.flatMap((room) => {
                return room.room_audits.map((audit) => {
                    return {
                        _id: audit.uuid,
                        body: audit.body,
                        room: room.uuid,
                        room_audit_type: audit.room_audit_type_name,
                    }
                })
            }), { session });

            await session.commitTransaction();
        } catch (error) {
            await session.abortTransaction();
            throw error;
        } finally {
            session.endSession();
        }
    }

    async down() {
        if (await RoomFile.exists()) {
            await RoomFile.collection.drop();
        }

        if (await RoomAudit.exists()) {
            await RoomAudit.collection.drop();
        }

        if (await Room.exists()) {
            await Room.collection.drop();
        }
    }
}
