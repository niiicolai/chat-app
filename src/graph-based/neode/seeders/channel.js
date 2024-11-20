import data from "./data.js";
import { v4 as uuidv4 } from 'uuid';

const channelUuid = "a595b5cb-7e47-4ce7-9875-cdf99184a73c";

export default class ChannelSeeder {
    async up(neodeInstance) {
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
            uuid: uuidv4(),
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
    }

    async down(neodeInstance) {
        const channel = await neodeInstance.model('Channel').find(channelUuid);
        if (!channel) {
            return;
        }

        await channel.delete();
    }
}
