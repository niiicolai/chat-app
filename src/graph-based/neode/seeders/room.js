import data from '../../../seed_data.js';

export default class RoomSeeder {
    order() {
        return 2;
    }

    async up(neodeInstance) {
        await Promise.all(data.rooms.map(async (roomData) => {
            return await neodeInstance.model('Room').create({
                uuid: roomData.uuid,
                name: roomData.name,
                description: roomData.description,
            });
        }));

        await Promise.all(data.rooms.map(async (roomData) => {
            return await neodeInstance.model('RoomAvatar').create({
                uuid: roomData.room_avatar.uuid,
            });
        }));

        await Promise.all(data.rooms.map(async (roomData) => {
            return await neodeInstance.model('RoomJoinSettings').create({
                uuid: roomData.room_join_settings.uuid,
                join_message: roomData.room_join_settings.join_message,
            });
        }));

        await Promise.all(data.rooms.map(async (roomData) => {
            return await neodeInstance.model('RoomFileSettings').create({
                uuid: roomData.room_file_settings.uuid,
                file_days_to_live: roomData.room_file_settings.file_days_to_live,
                total_files_bytes_allowed: roomData.room_file_settings.total_files_bytes_allowed,
                single_file_bytes_allowed: roomData.room_file_settings.single_file_bytes_allowed,
            });
        }));

        await Promise.all(data.rooms.map(async (roomData) => {
            return await neodeInstance.model('RoomUserSettings').create({
                uuid: roomData.room_user_settings.uuid,
                max_users: roomData.room_user_settings.max_users,
            });
        }));

        await Promise.all(data.rooms.map(async (roomData) => {
            return await neodeInstance.model('RoomChannelSettings').create({
                uuid: roomData.room_channel_settings.uuid,
                max_channels: roomData.room_channel_settings.max_channels,
                message_days_to_live: roomData.room_channel_settings.message_days_to_live,
            });
        }));

        await Promise.all(data.rooms.map(async (roomData) => {
            return await neodeInstance.model('RoomRulesSettings').create({
                uuid: roomData.room_rules_settings.uuid,
                rules_text: roomData.room_rules_settings.rules_text,
            });
        }));

        await Promise.all(data.rooms.map(async (roomData) => {
            return await neodeInstance.model('RoomInviteLink').create({
                uuid: roomData.room_invite_link.uuid,
            });
        }));
        
        await Promise.all(data.rooms.flatMap(async (roomData) => {
            return roomData.room_files.map(async (roomFileData) => {
                return await neodeInstance.model('RoomFile').create({
                    uuid: roomFileData.uuid,
                    src: roomFileData.src,
                    size: roomFileData.size,
                });
            });
        }));

        await Promise.all(data.rooms.flatMap(async (roomData) => {
            return roomData.room_audits.map(async (auditData) => {
                return await neodeInstance.model('RoomAudit').create({
                    uuid: auditData.uuid,
                    body: auditData.body,
                });
            });
        }));

        await Promise.all(data.rooms.map(async (roomData) => {
            const room = await neodeInstance.model('Room').find(roomData.uuid);

            const category = await neodeInstance.model('RoomCategory').first('name', roomData.room_category_name);
            await room.relateTo(category, 'room_category');

            const avatar = await neodeInstance.model('RoomAvatar').find(roomData.room_avatar.uuid);
            await room.relateTo(avatar, 'room_avatar');

            const joinSettings = await neodeInstance.model('RoomJoinSettings').find(roomData.room_join_settings.uuid);
            await room.relateTo(joinSettings, 'room_join_settings');

            const fileSettings = await neodeInstance.model('RoomFileSettings').find(roomData.room_file_settings.uuid);
            await room.relateTo(fileSettings, 'room_file_settings');

            const userSettings = await neodeInstance.model('RoomUserSettings').find(roomData.room_user_settings.uuid);
            await room.relateTo(userSettings, 'room_user_settings');

            const channelSettings = await neodeInstance.model('RoomChannelSettings').find(roomData.room_channel_settings.uuid);
            await room.relateTo(channelSettings, 'room_channel_settings');

            const rulesSettings = await neodeInstance.model('RoomRulesSettings').find(roomData.room_rules_settings.uuid);
            await room.relateTo(rulesSettings, 'room_rules_settings');

            const inviteLink = await neodeInstance.model('RoomInviteLink').find(roomData.room_invite_link.uuid);
            await room.relateTo(inviteLink, 'room_invite_link');

            await Promise.all(roomData.room_files.map(async (roomFileData) => {
                const roomFile = await neodeInstance.model('RoomFile').find(roomFileData.uuid);
                const fileType = await neodeInstance.model('RoomFileType').first('name', roomFileData.room_file_type_name);
                await roomFile.relateTo(fileType, 'room_file_type');
                await roomFile.relateTo(room, 'room');
                if (roomFileData.room_file_type_name === 'RoomAvatar') {
                    await avatar.relateTo(roomFile, 'room_file');
                }
            }));

            await Promise.all(roomData.room_audits.map(async (auditData) => {
                const audit = await neodeInstance.model('RoomAudit').find(auditData.uuid);
                const auditType = await neodeInstance.model('RoomAuditType').first('name', auditData.room_audit_type_name);
                await audit.relateTo(auditType, 'room_audit_type');
                await audit.relateTo(room, 'room');
            }));

            await Promise.all(roomData.room_users.map(async (roomUserData) => {
                const user = await neodeInstance.model('User').find(roomUserData.user_uuid);
                await user.relateTo(room, 'room_user', {
                    uuid: roomUserData.uuid,
                    role: roomUserData.room_user_role_name,
                    created_at: new Date(),
                    updated_at: new Date(),
                });
            }));

        }));
    }

    async down(neodeInstance) {
        await neodeInstance.cypher('MATCH (n:Room) DETACH DELETE n');
        await neodeInstance.cypher('MATCH (n:RoomFile) DETACH DELETE n');
        await neodeInstance.cypher('MATCH (n:RoomAvatar) DETACH DELETE n');
        await neodeInstance.cypher('MATCH (n:RoomJoinSettings) DETACH DELETE n');
        await neodeInstance.cypher('MATCH (n:RoomFileSettings) DETACH DELETE n');
        await neodeInstance.cypher('MATCH (n:RoomUserSettings) DETACH DELETE n');
        await neodeInstance.cypher('MATCH (n:RoomChannelSettings) DETACH DELETE n');
        await neodeInstance.cypher('MATCH (n:RoomRulesSettings) DETACH DELETE n');
        await neodeInstance.cypher('MATCH (n:RoomInviteLink) DETACH DELETE n');
        await neodeInstance.cypher('MATCH (n:RoomAudit) DETACH DELETE n');
    }
}
