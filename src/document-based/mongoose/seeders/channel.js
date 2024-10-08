import { roomUuid } from './room.js';
import User from '../models/user.js';
import Room from '../models/room.js';
import RoomFile from '../models/room_file.js';
import RoomFileType from '../models/room_file_type.js';
import Channel from '../models/channel.js';
import ChannelType from '../models/channel_type.js';
import ChannelWebhook from '../models/channel_webhook.js';
import ChannelMessage from '../models/channel_message.js';
import ChannelMessageType from '../models/channel_message_type.js';
import ChannelMessageUpload from '../models/channel_message_upload.js';
import ChannelMessageUploadType from '../models/channel_message_upload_type.js';
import ChannelWebhookMessage from '../models/channel_webhook_message.js';
import ChannelWebhookMessageType from '../models/channel_webhook_message_type.js';

import data from './data.js';

const channelUuid = "1c9437b0-4e88-4a8e-84f0-679c7714407f";
const channelWebhookUuid = "3219fadb-a982-4b4c-81a3-d7b70b4c9963";
const channelMessageUploadUuid = "972462eb-938f-4728-8ce7-76938f635e7d";
const channelWebhookMessageUuid = "a94e56ff-f8e4-4a35-bf22-3542053232b3";
const channelMessageUuid1 = "507886b9-43ce-4af2-8d4e-0ef2af1245bf";
const channelMessageUuid2 = "3be500fe-6982-49d2-b22e-77593ddee4ee";
const roomFileUuid = "0ce35cef-37b0-4c01-bd15-cc3786bca6c0";

export default class ChannelSeeder {
    async up() {
        /**
         * Create Channel
         */
        const room = await Room.findOne({ uuid: roomUuid });
        const channelType = await ChannelType.findOne({ name: "Text" });
        const channel = await new Channel({ 
            uuid: channelUuid, 
            name: "Test Channel", 
            description: "Test Channel Description",
            channel_type: channelType._id,
            room: room._id
        }).save();

        /**
         * Create a Channel Message with a Channel Message Upload
         */

        const user1 = await User.findOne({ uuid: data.users[0].uuid });
        const channelMessageType1 = await ChannelMessageType.findOne({ name: "User" });
        const channelMessage1 = await new ChannelMessage({
            uuid: channelMessageUuid1,
            body: "Test Channel Message 1",
            channel: channel._id,
            channel_message_type: channelMessageType1._id,
            user: user1._id
        }).save();

        const roomFileType = await RoomFileType.findOne({ name: "ChannelMessageUpload" });
        const roomFile = await new RoomFile({
            uuid: roomFileUuid,
            src: "https://ghostchat.fra1.cdn.digitaloceanspaces.com/channel_message_upload/LemonadeGuyCardboardAndPencilWithShadow-8cdc3130cc5498718fce7ee9d1ff5d92ddcc2ed81c689a1bf275bd14189a607c-512-08efe54f-4cbc-4923-9a70-2ceb6a55d58e-1726929326038.jpeg",
            room_file_type: roomFileType._id,
            size: 540000,
            room: room._id
        }).save();

        const channelMessageUploadType = await ChannelMessageUploadType.findOne({ name: "Image" });
        await new ChannelMessageUpload({
            uuid: channelMessageUploadUuid,
            channel_message: channelMessage1._id,
            room_file: roomFile._id,
            channel_message_upload_type: channelMessageUploadType._id
        }).save();

        /**
         * Create a Channel Webhook with a Channel Webhook Message
         * and a Channel Message
         */
        const channelMessageType2 = await ChannelMessageType.findOne({ name: "Webhook" });
        const channelMessage2 = await new ChannelMessage({
            uuid: channelMessageUuid2,
            body: "Test Channel Message 2",
            channel: channel._id,
            channel_message_type: channelMessageType2._id
        }).save(); 

        const channelWebhook = await new ChannelWebhook({
            uuid: channelWebhookUuid,
            name: "Test Channel Webhook",
            description: "Test Channel Webhook Description",
            channel: channel._id
        }).save();

        const channelWebhookMessageType = await ChannelWebhookMessageType.findOne({ name: "Custom" });
        await new ChannelWebhookMessage({
            uuid: channelWebhookMessageUuid,
            body: "Test Channel Webhook Message",
            channel_webhook: channelWebhook._id,
            channel_message: channelMessage2._id,
            channel_webhook_message_type: channelWebhookMessageType._id
        }).save();
    }

    async down() {
        await Channel.findOneAndDelete({ uuid: channelUuid });
        await ChannelWebhook.findOneAndDelete({ uuid: channelWebhookUuid });
        await ChannelMessageUpload.findOneAndDelete({ uuid: channelMessageUploadUuid });
        await ChannelWebhookMessage.findOneAndDelete({ uuid: channelWebhookMessageUuid });
        await ChannelMessage.findOneAndDelete({ uuid: channelMessageUuid1 });
        await ChannelMessage.findOneAndDelete({ uuid: channelMessageUuid2 });
        await RoomFile.findOneAndDelete({ uuid: roomFileUuid });
    }
}
