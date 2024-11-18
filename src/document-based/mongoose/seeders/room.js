import Room from '../models/room.js';
import RoomFile from '../models/room_file.js';
import RoomFileType from '../models/room_file_type.js';
import RoomUserRole from '../models/room_user_role.js';
import RoomCategory from '../models/room_category.js';
import RoomAudit from '../models/room_audit.js';
import RoomAuditType from '../models/room_audit_type.js';
import User from '../models/user.js';
import { v4 as uuidv4 } from 'uuid';

import data from './data.js';

export const roomUuid = "a595b5cb-7e47-4ce7-9875-cdf99184a73c";
const roomUserSettingsUuid = "986f3733-7bbd-4744-8ce2-ad11ddd95462";
const roomChannelSettingsUuid = "c08d0b09-698f-46d5-8903-dc1236bf0b95";
const roomRulesSettingsUuid = "1d9ace5f-b43a-46d4-aa61-2671fe5ced52";
const roomFileSettingsUuid = "dafd92a0-9319-442f-93d8-1a601d65a00c";
const roomJoinSettingsUuid = "c23d7a4e-b515-49e7-a754-64c57152607c";
const roomAvatarUuid = "58158a72-9d4e-4454-8ddc-ab1d5e0a7720";
const roomInviteLinkUuid = "0bd06de6-b6df-4abe-8385-5e57cdb13649";
const roomUser1Uuid = "5b0d4bbc-a1dd-4cd9-aeee-aecf63083693";
const roomUser2Uuid = "b0246111-5172-44df-9f36-22f7d18826a5";
const roomUser3Uuid = "2a2a430a-016e-4c06-bc48-0ee2b8b176d8";
const roomAvatarFileUuid = "5c18ae8b-40c1-49dc-ba42-544f87520cf5";

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
        const room_category = await RoomCategory.findOne({ 
            name: "General" 
        });

        const role1 = await RoomUserRole.findOne({ name: data.room_user_roles[0].name });
        const role2 = await RoomUserRole.findOne({ name: data.room_user_roles[1].name });
        const role3 = await RoomUserRole.findOne({ name: data.room_user_roles[2].name });
        const user1 = await User.findOne({ uuid: data.users[0].uuid });
        const user2 = await User.findOne({ uuid: data.users[1].uuid });
        const user3 = await User.findOne({ uuid: data.users[2].uuid });

        // Create Room
        const room = await new Room({
            uuid: roomUuid,
            name: "Test Room",
            description: "Test Room Description",
            room_category,
            room_join_settings: { 
                uuid: roomJoinSettingsUuid, 
                join_message 
            },
            room_file_settings: { 
                uuid: roomFileSettingsUuid, 
                file_days_to_live, 
                total_files_bytes_allowed, 
                single_file_bytes_allowed 
            },
            room_user_settings: { 
                uuid: roomUserSettingsUuid, 
                max_users 
            },
            room_channel_settings: { 
                uuid: roomChannelSettingsUuid, 
                max_channels, 
                message_days_to_live 
            },
            room_rules_settings: { 
                uuid: roomRulesSettingsUuid, 
                rules_text 
            },
            room_avatar: { 
                uuid: roomAvatarUuid 
            },
            room_invite_links: [{
                uuid: roomInviteLinkUuid,
                expires_at: null
            }],
            room_users: [
                { uuid: roomUser1Uuid, room_user_role: role1, user: user1._id },
                { uuid: roomUser2Uuid, room_user_role: role2, user: user2._id },
                { uuid: roomUser3Uuid, room_user_role: role3, user: user3._id }
            ],
        }).save();

        // Add Room file to room avatar
        const room_file_type = await RoomFileType.findOne({ name: "RoomAvatar" });
        const roomAvatarFile = await new RoomFile({
            uuid: roomAvatarFileUuid,
            src: 'https://ghostchat.fra1.cdn.digitaloceanspaces.com/room_avatar/pexels-luis-gomes-166706-546819-4157b6a2-6856-4b54-aaa5-dc4f9a80062f-1727561140754.jpeg',
            room_file_type,
            size: 540000,
            room: room._id
        }).save();
        room.room_avatar.room_file = roomAvatarFile._id;
        await room.save();

        // Create Room Audit
        const room_audit_type = await RoomAuditType.findOne({ name: "ROOM_CREATED" });
        await new RoomAudit({
            uuid: uuidv4(),
            body: "Room created",
            room: room._id,
            room_audit_type,
            user: user1._id
        }).save();
    }

    async down() {
        const room = await Room.findOne({ uuid: roomUuid });
        if (!room) return;
        await Promise.all([
            RoomFile.deleteMany({ room: room._id }),
            RoomAudit.deleteMany({ room: room._id }),
            Room.findOneAndDelete({ uuid: roomUuid })
        ]);
    }
}
