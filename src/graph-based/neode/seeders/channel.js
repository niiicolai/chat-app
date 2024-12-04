import data from '../../../seed_data.js';

const channelUuid = "1c9437b0-4e88-4a8e-84f0-679c7714407f";

export default class ChannelSeeder {
    order() {
        return 3;
    }

    async up(neodeInstance) {
        await Promise.all(data.rooms.flatMap(async (roomData) => {
            return roomData.channels.map(async (channelData) => {
                return new Promise(async (resolve, reject) => {
                    const channel = await neodeInstance.model('Channel').create({
                        uuid: channelData.uuid,
                        name: channelData.name,
                        description: channelData.description,
                    });

                    if (channelData.channel_webhook) {
                        const channelWebhook = await neodeInstance.model('ChannelWebhook').create({
                            uuid: channelData.channel_webhook.uuid,
                            name: channelData.channel_webhook.name,
                            description: channelData.channel_webhook.description,
                        });
                        await channel.relateTo(channelWebhook, 'channel_webhook');
                    }

                    await Promise.all(channelData.channel_messages.map(async (channel_message) => {
                        return new Promise(async (resolve, reject) => {
                            const type = await neodeInstance.model('ChannelMessageType').find(channel_message.channel_message_type_name);
                            const msg = await neodeInstance.model('ChannelMessage').create({
                                uuid: channel_message.uuid,
                                body: channel_message.body,
                            });

                            await msg.relateTo(channel, 'channel');
                            await msg.relateTo(type, 'channel_message_type');

                            if (channel_message.user) {
                                const user = await neodeInstance.model('User').find(channel_message.user.uuid);
                                await msg.relateTo(user, 'user');
                            }

                            if (channel_message.channel_message_upload) {
                                const uploadType = await neodeInstance.model('ChannelMessageUploadType').find(channel_message.channel_message_upload.channel_message_upload_type_name);
                                const upload = await neodeInstance.model('ChannelMessageUpload').create({
                                    uuid: channel_message.channel_message_upload.uuid,
                                });

                                await upload.relateTo(uploadType, 'channel_message_upload_type');
                                await msg.relateTo(upload, 'channel_message_upload');

                                await neodeInstance.batch([
                                    {
                                        query:
                                            'MATCH (rf:RoomFile {uuid: $uuid}) ' +
                                            'MATCH (c:ChannelMessageUpload {uuid: $upload_uuid}) ' +
                                            'CREATE (c)-[:SAVED_AS]->(rf)',
                                        params: { 
                                            uuid: channel_message.channel_message_upload.room_file_uuid, 
                                            upload_uuid: channel_message.channel_message_upload.uuid
                                        }
                                    },
                                ]);
                            }

                            if (channel_message.channel_webhook_message) {
                                const webhook = await neodeInstance.model('ChannelWebhook').find(channelData.channel_webhook.uuid);
                                const webhookMessageType = await neodeInstance.model('ChannelWebhookMessageType').find(channel_message.channel_webhook_message.channel_webhook_message_type_name);
                                const webhookMessage = await neodeInstance.model('ChannelWebhookMessage').create({
                                    uuid: channel_message.channel_webhook_message.uuid,
                                    body: channel_message.channel_webhook_message.body,
                                });

                                await webhookMessage.relateTo(webhookMessageType, 'channel_webhook_message_type');
                                await webhookMessage.relateTo(webhook, 'channel_webhook');
                                await msg.relateTo(webhookMessage, 'channel_webhook_message');
                            }

                            resolve();
                        });
                    }));

                    await neodeInstance.batch([
                        {
                            query:
                                'MATCH (ct:ChannelType {name: $name}) ' +
                                'MATCH (c:Channel {uuid: $uuid}) ' +
                                'CREATE (c)-[:TYPE_IS]->(ct)',
                            params: { uuid: channelData.uuid, name: channelData.channel_type_name }
                        },
                        {
                            query:
                                'MATCH (r:Room {uuid: $room_uuid}) ' +
                                'MATCH (c:Channel {uuid: $uuid}) ' +
                                'CREATE (c)-[:COMMUNICATES_IN]->(r)',
                            params: { uuid: channelData.uuid, room_uuid: roomData.uuid }
                        },
                    ]);

                    resolve();
                });
            });
        }));
        /*
        const room = await neodeInstance.model('Room').find(data.room.uuid);
        const roomJoinSettings = await neodeInstance.model('RoomJoinSettings').find(data.room.room_join_settings.uuid);
        const roomFileType = await neodeInstance.model('RoomFileType').find('ChannelAvatar');
        const roomFile = await neodeInstance.model('RoomFile').create({
            uuid: uuidv4(),
            src: "https://ghostchat.fra1.cdn.digitaloceanspaces.com/static/c7QiLXb.png",
            size: 1024,
            created_at: new Date(),
            updated_at: new Date()
        });

        await roomFile.relateTo(room, 'room');
        await roomFile.relateTo(roomFileType, 'room_file_type');

        const channelType = await neodeInstance.model('ChannelType').find('Text');
        const channel = await neodeInstance.model('Channel').create({
            uuid: channelUuid,
            name: "General Discussion",
            description: "General discussion channel",
            created_at: new Date(),
            updated_at: new Date()
        });

        await channel.relateTo(room, 'room');
        await channel.relateTo(channelType, 'channel_type');
        await channel.relateTo(roomFile, 'room_file');
        await roomJoinSettings.relateTo(channel, 'join_channel');

        const channelWebhookRoomFileType = await neodeInstance.model('RoomFileType').find('ChannelWebhookAvatar');
        const channelWebhookRoomFile = await neodeInstance.model('RoomFile').create({
            uuid: uuidv4(),
            src: "https://ghostchat.fra1.cdn.digitaloceanspaces.com/static/c7QiLXb.png",
            size: 1024,
            created_at: new Date(),
            updated_at: new Date()
        });

        await channelWebhookRoomFile.relateTo(room, 'room');
        await channelWebhookRoomFile.relateTo(channelWebhookRoomFileType, 'room_file_type');

        const channelWebhook = await neodeInstance.model('ChannelWebhook').create({
            uuid: uuidv4(),
            name: "General Discussion Webhook",
            description: "General discussion channel webhook",
            created_at: new Date(),
            updated_at: new Date()
        });

        await channelWebhook.relateTo(channel, 'channel');
        await channelWebhook.relateTo(channelWebhookRoomFile, 'room_file');

        const channelWebhookMessageType = await neodeInstance.model('ChannelWebhookMessageType').find('Custom');
        const channelWebhookMessage = await neodeInstance.model('ChannelWebhookMessage').create({
            uuid: uuidv4(),
            body: "Hello, world!",
            created_at: new Date(),
            updated_at: new Date()
        });

        await channelWebhookMessage.relateTo(channelWebhook, 'channel_webhook');
        await channelWebhookMessage.relateTo(channelWebhookMessageType, 'channel_webhook_message_type');

        const channelWebhookMessage_MessageType = await neodeInstance.model('ChannelMessageType').find('Webhook');
        const channelWebhookMessage_Message = await neodeInstance.model('ChannelMessage').create({
            uuid: uuidv4(),
            body: "Hello, world!",
            created_at: new Date(),
            updated_at: new Date()
        });

        await channelWebhookMessage_Message.relateTo(channel, 'channel');
        await channelWebhookMessage_Message.relateTo(channelWebhookMessage_MessageType, 'channel_message_type');
        await channelWebhookMessage_Message.relateTo(channelWebhookMessage, 'channel_webhook_message');

        const channelMessageType = await neodeInstance.model('ChannelMessageType').find('User');
        const user1 = await neodeInstance.model('User').find(data.users[0].uuid);
        const user2 = await neodeInstance.model('User').find(data.users[1].uuid);
        const user3 = await neodeInstance.model('User').find(data.users[2].uuid);

        const channelMessage1 = await neodeInstance.model('ChannelMessage').create({
            uuid: uuidv4(),
            body: "Hi everyone!",
            created_at: new Date(),
            updated_at: new Date()
        });
        const channelMessage2 = await neodeInstance.model('ChannelMessage').create({
            uuid: uuidv4(),
            body: "Hello!",
            created_at: new Date(),
            updated_at: new Date()
        });
        const channelMessage3 = await neodeInstance.model('ChannelMessage').create({
            uuid: uuidv4(),
            body: "Hi!",
            created_at: new Date(),
            updated_at: new Date()
        });

        await channelMessage1.relateTo(channel, 'channel');
        await channelMessage1.relateTo(channelMessageType, 'channel_message_type');
        await channelMessage1.relateTo(user1, 'user');

        await channelMessage2.relateTo(channel, 'channel');
        await channelMessage2.relateTo(channelMessageType, 'channel_message_type');
        await channelMessage2.relateTo(user2, 'user');

        await channelMessage3.relateTo(channel, 'channel');
        await channelMessage3.relateTo(channelMessageType, 'channel_message_type');
        await channelMessage3.relateTo(user3, 'user');

        const channelMessage4 = await neodeInstance.model('ChannelMessage').create({
            uuid: uuidv4(),
            body: "Check this out!",
            created_at: new Date(),
            updated_at: new Date()
        });
        const channelMessageUploadType = await neodeInstance.model('ChannelMessageUploadType').find('Image');
        const channelMessageUpload = await neodeInstance.model('ChannelMessageUpload').create({
            uuid: uuidv4(),
            created_at: new Date(),
            updated_at: new Date()
        });
        const channelMessageUploadFileType = await neodeInstance.model('RoomFileType').find('ChannelMessageUpload');
        const channelMessageUploadFile = await neodeInstance.model('RoomFile').create({
            uuid: uuidv4(),
            src: "https://ghostchat.fra1.cdn.digitaloceanspaces.com/static/c7QiLXb.png",
            size: 1024,
            created_at: new Date(),
            updated_at: new Date()
        });

        await channelMessageUploadFile.relateTo(channelMessageUploadFileType, 'room_file_type');
        await channelMessageUploadFile.relateTo(room, 'room');

        await channelMessage4.relateTo(channel, 'channel');
        await channelMessage4.relateTo(channelMessageType, 'channel_message_type');
        await channelMessage4.relateTo(user1, 'user');
        await channelMessage4.relateTo(channelMessageUpload, 'channel_message_upload');

        await channelMessageUpload.relateTo(channelMessageUploadType, 'channel_message_upload_type');
        await channelMessageUpload.relateTo(channelMessageUploadFile, 'room_file');

        const channelAuditType = await neodeInstance.model('ChannelAuditType').find('CHANNEL_CREATED');
        const channelAudit = await neodeInstance.model('ChannelAudit').create({
            uuid: uuidv4(),
            body: "Channel created",
        });
        await channelAudit.relateTo(channel, 'channel');
        await channelAudit.relateTo(channelAuditType, 'channel_audit_type');*/
    }

    async down(neodeInstance) {
        await neodeInstance.cypher('MATCH (n:Channel) DETACH DELETE n');
        await neodeInstance.cypher('MATCH (n:ChannelMessage) DETACH DELETE n');
        await neodeInstance.cypher('MATCH (n:ChannelMessageUpload) DETACH DELETE n');
        await neodeInstance.cypher('MATCH (n:ChannelWebhook) DETACH DELETE n');
        await neodeInstance.cypher('MATCH (n:ChannelWebhookMessage) DETACH DELETE n');
        await neodeInstance.cypher('MATCH (n:ChannelAudit) DETACH DELETE n');
        await neodeInstance.cypher('MATCH (n:RoomFile) DETACH DELETE n');
    }
}
