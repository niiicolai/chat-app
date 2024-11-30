import data from '../../../seed_data.js';
import { v4 as uuidv4 } from 'uuid';

export default class RoomSeeder {
    order() {
        return 2;
    }

    async up(neodeInstance) {
        const roomCategory = await neodeInstance.model('RoomCategory').find('General');
        const room = await neodeInstance.model('Room').create({
            uuid: data.room.uuid,
            name: data.room.name,
            description: data.room.description,
            created_at: new Date(),
            updated_at: new Date()
        });

        await room.relateTo(roomCategory, 'room_category');

        const roomAvatarFileType = await neodeInstance.model('RoomFileType').find('RoomAvatar');
        const roomAvatarFile = await neodeInstance.model('RoomFile').create({
            uuid: data.room.room_avatar.room_file.uuid,
            src: data.room.room_avatar.room_file.src,
            size: data.room.room_avatar.room_file.size,
        });

        await roomAvatarFile.relateTo(room, 'room');
        await roomAvatarFile.relateTo(roomAvatarFileType, 'room_file_type');
        
        const roomAvatar = await neodeInstance.model('RoomAvatar').create({
            uuid: data.room.room_avatar.uuid,
        });

        await room.relateTo(roomAvatar, 'room_avatar');
        await roomAvatar.relateTo(roomAvatarFile, 'room_file');

        const roomJoinSettings = await neodeInstance.model('RoomJoinSettings').create({
            uuid: data.room.room_join_settings.uuid,
            join_message: "{name} joined the room!",
        });

        const roomFileSettings = await neodeInstance.model('RoomFileSettings').create({
            uuid: data.room.room_file_settings.uuid,
            file_days_to_live: 30,
            total_files_bytes_allowed: 52428800,
            single_file_bytes_allowed: 5242880,
        });

        const roomUserSettings = await neodeInstance.model('RoomUserSettings').create({
            uuid: data.room.room_user_settings.uuid,
            max_users: 25,
        });

        const roomChannelSettings = await neodeInstance.model('RoomChannelSettings').create({
            uuid: data.room.room_channel_settings.uuid,
            max_channels: 10,
            message_days_to_live: 30,
        });

        const roomRulesSettings = await neodeInstance.model('RoomRulesSettings').create({
            uuid: data.room.room_rules_settings.uuid,
            rules_text: "# Chat Rules\n\n1. No spamming\n2. No trolling\n3. No NSFW content\n\nBreaking the rules will result in a ban.",
        });

        await room.relateTo(roomJoinSettings, 'room_join_settings');
        await room.relateTo(roomFileSettings, 'room_file_settings');
        await room.relateTo(roomUserSettings, 'room_user_settings');
        await room.relateTo(roomChannelSettings, 'room_channel_settings');
        await room.relateTo(roomRulesSettings, 'room_rules_settings');

        const roomInviteLink = await neodeInstance.model('RoomInviteLink').create({
            uuid: data.room.room_invite_link.uuid,
        });
        
        await roomInviteLink.relateTo(room, 'room');        

        const user1 = await neodeInstance.model('User').find(data.users[0].uuid);
        const user2 = await neodeInstance.model('User').find(data.users[1].uuid);
        const user3 = await neodeInstance.model('User').find(data.users[2].uuid);

        const roomUserRole1 = await neodeInstance.model('RoomUserRole').find('Admin');
        const roomUserRole2 = await neodeInstance.model('RoomUserRole').find('Moderator');
        const roomUserRole3 = await neodeInstance.model('RoomUserRole').find('Member');

        const roomUser1 = await neodeInstance.model('RoomUser').create({
            uuid: data.room.room_users[0].uuid,
        });
        const roomUser2 = await neodeInstance.model('RoomUser').create({
            uuid: data.room.room_users[1].uuid,
        });
        const roomUser3 = await neodeInstance.model('RoomUser').create({
            uuid: data.room.room_users[2].uuid,
        });

        await roomUser1.relateTo(room, 'room');
        await roomUser1.relateTo(user1, 'user');
        await roomUser1.relateTo(roomUserRole1, 'room_user_role');

        await roomUser2.relateTo(room, 'room');
        await roomUser2.relateTo(user2, 'user');
        await roomUser2.relateTo(roomUserRole2, 'room_user_role');

        await roomUser3.relateTo(room, 'room');
        await roomUser3.relateTo(user3, 'user');
        await roomUser3.relateTo(roomUserRole3, 'room_user_role');

        const roomAuditType = await neodeInstance.model('RoomAuditType').find('ROOM_CREATED');
        const roomAudit = await neodeInstance.model('RoomAudit').create({
            uuid: uuidv4(),
            body: "{}",
        });
        await roomAudit.relateTo(room, 'room');
        await roomAudit.relateTo(roomAuditType, 'room_audit_type');
    }

    async down(neodeInstance) {
        const room = await neodeInstance.model('Room').find(data.room.uuid);
        if (!room) {
            return;
        }

        const roomFileSettings = await room.get("room_file_settings");
        const roomJoinSettings = await room.get("room_join_settings");
        const roomUserSettings = await room.get("room_user_settings");
        const roomChannelSettings = await room.get("room_channel_settings");
        const roomRulesSettings = await room.get("room_rules_settings");
        const roomAvatar = await room.get("room_avatar");
        const roomInviteLink = await room.get("room_invite_link");
        const roomFiles = await room.get("room_files");
        const roomUsers = await room.get("room_users");

        await roomFileSettings?.delete();
        await roomJoinSettings?.delete();
        await roomUserSettings?.delete();
        await roomChannelSettings?.delete();
        await roomRulesSettings?.delete();
        await roomAvatar?.delete();
        await roomInviteLink?.delete();
        await roomFiles?.delete();
        await roomUsers?.delete();
        await room.delete();
    }
}
