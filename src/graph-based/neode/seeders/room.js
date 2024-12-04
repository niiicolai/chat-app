import data from '../../../seed_data.js';

export default class RoomSeeder {
    order() {
        return 2;
    }

    async up(neodeInstance) {
        await Promise.all(data.rooms.map(async (roomData) => {
            return new Promise(async (resolve, reject) => {
                const room = await neodeInstance.model('Room').create({
                    uuid: roomData.uuid,
                    name: roomData.name,
                    description: roomData.description,
                });

                const roomAvatar = await neodeInstance.model('RoomAvatar').create({
                    uuid: roomData.room_avatar.uuid,
                });

                const roomJoinSettings = await neodeInstance.model('RoomJoinSettings').create({
                    uuid: roomData.room_join_settings.uuid,
                    join_message: roomData.room_join_settings.join_message,
                });
        
                const roomFileSettings = await neodeInstance.model('RoomFileSettings').create({
                    uuid: roomData.room_file_settings.uuid,
                    file_days_to_live: roomData.room_file_settings.file_days_to_live,
                    total_files_bytes_allowed: roomData.room_file_settings.total_files_bytes_allowed,
                    single_file_bytes_allowed: roomData.room_file_settings.single_file_bytes_allowed,
                });
        
                const roomUserSettings = await neodeInstance.model('RoomUserSettings').create({
                    uuid: roomData.room_user_settings.uuid,
                    max_users: roomData.room_user_settings.max_users,
                });
        
                const roomChannelSettings = await neodeInstance.model('RoomChannelSettings').create({
                    uuid: roomData.room_channel_settings.uuid,
                    max_channels: roomData.room_channel_settings.max_channels,
                    message_days_to_live: roomData.room_channel_settings.message_days_to_live,
                });
        
                const roomRulesSettings = await neodeInstance.model('RoomRulesSettings').create({
                    uuid: roomData.room_rules_settings.uuid,
                    rules_text: roomData.room_rules_settings.rules_text,
                });

                const roomInviteLink = await neodeInstance.model('RoomInviteLink').create({
                    uuid: roomData.room_invite_link.uuid,
                });

                await room.relateTo(roomAvatar, 'room_avatar');
                await room.relateTo(roomJoinSettings, 'room_join_settings');
                await room.relateTo(roomFileSettings, 'room_file_settings');
                await room.relateTo(roomUserSettings, 'room_user_settings');
                await room.relateTo(roomChannelSettings, 'room_channel_settings');
                await room.relateTo(roomRulesSettings, 'room_rules_settings');
                await room.relateTo(roomInviteLink, 'room_invite_link');

                await Promise.all(roomData.room_files.map(async (roomFileData) => {
                    return new Promise(async (resolve, reject) => {
                        const type = await neodeInstance.model('RoomFileType').find(roomFileData.room_file_type_name);
                        const file = await neodeInstance.model('RoomFile').create({
                            uuid: roomFileData.uuid,
                            src: roomFileData.src,
                            size: roomFileData.size,
                        });

                        await file.relateTo(room, 'room');
                        await file.relateTo(type, 'room_file_type');
                        
                        if (roomFileData.room_file_type_name === 'RoomAvatar') {
                            await file.relateTo(roomAvatar, 'room_avatar');
                        }
                        resolve();
                    });
                }));

                await Promise.all(roomData.room_audits.map(async (auditData) => {
                    return new Promise(async (resolve, reject) => {
                        const type = await neodeInstance.model('RoomAuditType').find(auditData.room_audit_type_name);
                        const audit = await neodeInstance.model('RoomAudit').create({
                            uuid: auditData.uuid,
                            body: auditData.body,
                        });

                        await audit.relateTo(room, 'room');
                        await audit.relateTo(type, 'room_audit_type');
              
                        resolve();
                    });
                }));

                await neodeInstance.batch([
                    {
                        query:
                            'MATCH (rc:RoomCategory {name: $name}) ' +
                            'MATCH (r:Room {uuid: $uuid}) ' +
                            'CREATE (r)-[:CATEGORY_IS]->(rc)',
                        params: { uuid: roomData.uuid, name: roomData.room_category_name }
                    },
                    ...roomData.room_users.map((roomUserData) => {
                        return {
                            query:
                                'MATCH (u:User {uuid: $user_uuid}) ' +
                                'MATCH (r:Room {uuid: $room_uuid}) ' +
                                'CREATE (u)-[:MEMBER_IN {role: $role}]->(r) ',
                            params: {
                                user_uuid: roomUserData.user_uuid,
                                room_uuid: roomData.uuid,
                                role: roomUserData.room_user_role_name,
                            }
                        }
                    })
                ]);

                resolve();
            });
        }));
        

        /*

        const roomAvatarFileType = await neodeInstance.model('RoomFileType').find('RoomAvatar');
        

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
        await roomAudit.relateTo(roomAuditType, 'room_audit_type');*/
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
