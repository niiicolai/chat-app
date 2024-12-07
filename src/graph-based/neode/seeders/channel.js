import data from '../../../seed_data.js';

const channelUuid = "1c9437b0-4e88-4a8e-84f0-679c7714407f";

export default class ChannelSeeder {
    order() {
        return 3;
    }

    async up(neodeInstance) {
        return await Promise.all(data.rooms.flatMap(async (roomData) => {
            return new Promise(async (resolveOuter, rejectOuter) => {
                await Promise.all(roomData.channels.map(async (channelData) => {
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

                        try {
                            await neodeInstance.batch([
                                {
                                    query:
                                        'MATCH (r:Room {uuid: $room_uuid}) ' +
                                        'MATCH (ct:ChannelType {name: $name}) ' +
                                        'MATCH (c:Channel {uuid: $uuid}) ' +
                                        'CREATE (c)-[:TYPE_IS]->(ct) ' +
                                        'CREATE (r)-[:COMMUNICATES_IN]->(c)',
                                    params: { uuid: channelData.uuid, name: channelData.channel_type_name, room_uuid: roomData.uuid }
                                },
                            ]);
                        } catch (e) {
                            console.log(e);
                        }
                        

                        resolve();
                    });
                }));

                await Promise.all(roomData.channel_audits.map(async (channel_audit) => {
                    return new Promise(async (resolve, reject) => {
                        const channel = await neodeInstance.model('Channel').find(channel_audit.channel_uuid);
                        const type = await neodeInstance.model('ChannelAuditType').find(channel_audit.channel_audit_type_name);
                        const audit = await neodeInstance.model('ChannelAudit').create({
                            uuid: channel_audit.uuid,
                            body: channel_audit.body,
                        });

                        await audit.relateTo(channel, 'channel');
                        await audit.relateTo(type, 'channel_audit_type');
        
                        resolve();
                    });
                }));

                resolveOuter();
            });
        }));
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
