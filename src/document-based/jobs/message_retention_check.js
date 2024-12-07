import { CronJob } from 'cron';
import StorageService from "../../shared/services/storage_service.js";
import ChannelMessage from '../mongoose/models/channel_message.js';
import ChannelMessageUpload from '../mongoose/subdocuments/channel_message_upload.js';
import ChannelWebhookMessage from '../mongoose/subdocuments/channel_webhook_message.js';
import RoomFile from '../mongoose/models/room_file.js';
import Room from '../mongoose/models/room.js';
import Channel from '../mongoose/models/channel.js';
import rollbar from '../../../rollbar.js';

const roomBatch = 10;
const msgBatch = 10;

// Run once a day
const cronTime = '0 0 0 * * *';

// Copenhagen timezone
const timeZone = 'Europe/Copenhagen';

// Load a batch of messages older than msg_days_to_live
const loadChannelMessagesBatch = async (channel_id, msg_days_to_live, offset) => {
    return await ChannelMessage.find({ channel: channel_id, created_at: { $lt: new Date(Date.now() - msg_days_to_live * 24 * 60 * 60 * 1000) } })
        .populate('channel_webhook_message')
        .populate({
            path: 'channel_message_upload',
            model: 'ChannelMessageUpload',
            populate: {
                path: 'room_file',
                model: 'RoomFile',
            },
        })
        .limit(msgBatch)
        .skip(offset)
        .sort({ created_at: 1 });
};

// Job
const onTick = async () => {
    console.log(`MESSAGE_RETENTION_CHECK (mongodb): ${Date.now()}: Starting message retention check`);

    try {
        const storage = new StorageService('channel_message_upload');
        const recursiveRoomCheck = async (offset) => {
            const rooms = await Room.find()
                .populate('room_channel_settings')
                .limit(roomBatch)
                .skip(offset);
            
            if (rooms.length === 0) {
                return;
            }

            for (const room of rooms) {
                const room_id = room._id;
                const message_days_to_live = room.room_channel_settings?.message_days_to_live || process.env.ROOM_MESSAGE_DAYS_TO_LIVE || 30;
                const channels = await Channel.find({ room: room_id });

                for (const channel of channels) {
                    const channel_id = channel._id;

                    let channelMessages = await loadChannelMessagesBatch(channel_id, message_days_to_live, 0);

                    while (channelMessages.length > 0) {
                        for (const channelMessage of channelMessages) {

                            /**
                             * Remove room file and channel message upload if they exist
                             */
                            if (channelMessage.channel_message_upload) {
                                if (channelMessage.channel_message_upload.room_file) {
                                    const { src, _id } = channelMessage.channel_message_upload.room_file;
                                    const key = storage.parseKey(src);
                                    await storage.deleteFile(key);
                                    await RoomFile.deleteOne({ _id });
                                }

                                await ChannelMessageUpload.deleteOne({ _id: channelMessage.channel_message_upload._id });
                            }
                            
                            /**
                             * Remove channel webhook message if it exists
                             */
                            if (channelMessage.channel_webhook_message) {
                                await ChannelWebhookMessage.deleteOne({ _id: channelMessage.channel_webhook_message._id });
                            }

                            /**
                             * Remove channel message
                             */
                            await ChannelMessage.deleteOne({ _id: channelMessage._id });

                            /**
                             * Log deletion
                             */
                            console.log(`${Date.now()}: Deleted message ${channelMessage.uuid} because it exceeded the retention period of ${message_days_to_live} days`);
                        }

                        /**
                         * Load next batch of messages
                         */
                        channelMessages = await loadChannelMessagesBatch(channel_id, message_days_to_live, channelMessages.length);
                    }
                }
            }

            await recursiveRoomCheck(offset + roomBatch);
        };

        setTimeout(async () => {
            await recursiveRoomCheck(0);
        }, 1000);
        
        console.log(`MESSAGE_RETENTION_CHECK (mongodb): ${Date.now()}: Finished message retention check`);
    } catch (error) {
        rollbar.error(error);
        console.error(`MESSAGE_RETENTION_CHECK (mongodb): ${Date.now()}: Error in message retention check: ${error}`);
    }
};

CronJob.from({ cronTime, onTick, start: true, timeZone });
