import { CronJob } from 'cron';
import StorageService from "../services/storage_service.js";
import db from "../../sequelize/models/index.cjs";
import rollbar from '../../rollbar.js';

const roomBatch = 10;
const msgBatch = 10;

// Run once a day
const cronTime = '0 0 0 * * *';

// Copenhagen timezone
const timeZone = 'Europe/Copenhagen';

// Load a batch of messages older than msg_days_to_live
const loadChannelMessagesBatch = async (room_uuid, msg_days_to_live, offset) => {
    return await db.ChannelMessageView.findAll({
        where: {
            channel_message_created_at: {
                [db.Sequelize.Op.lt]: db.Sequelize.literal(`NOW() - INTERVAL ${msg_days_to_live} DAY`)
            }
        },
        include: [
            { model: db.ChannelView, where: { room_uuid } }
        ],
        offset,
        limit: msgBatch
    });
};

// Job
const onTick = async () => {
    console.log(`MESSAGE_RETENTION_CHECK: ${Date.now()}: Starting message retention check`);

    try {
        const storage = new StorageService('channel_message_upload');
        const recursiveRoomCheck = async (offset) => {
            const rooms = await db.RoomView.findAll({
                offset,
                limit: roomBatch
            });

            if (rooms.length === 0) {
                return;
            }

            for (const room of rooms) {
                const { room_uuid, message_days_to_live } = room;

                let channelMessages = await loadChannelMessagesBatch(room_uuid, message_days_to_live, 0);
                while (channelMessages.length > 0) {
                    for (const channelMessage of channelMessages) {
                        if (channelMessage.room_file_uuid) {
                            const key = storage.parseKey(channelMessage.room_file_src);
                            await storage.deleteFile(key);
                        }

                        await db.sequelize.query('CALL delete_channel_message_proc(:channel_message_uuid, @result)', {
                            replacements: {
                                channel_message_uuid: channelMessage.channel_message_uuid,
                            },
                        });
                        console.log(`${Date.now()}: Deleted message ${channelMessage.channel_message_uuid} because it exceeded the retention period of ${message_days_to_live} days`);
                    }
                    channelMessages = await loadChannelMessagesBatch(room_uuid, message_days_to_live, channelMessages.length);
                }
            }

            await recursiveRoomCheck(offset + roomBatch);
        };

        await recursiveRoomCheck(0);
        console.log(`MESSAGE_RETENTION_CHECK: ${Date.now()}: Finished message retention check`);
    } catch (error) {
        rollbar.error(error);
        console.error(`MESSAGE_RETENTION_CHECK: ${Date.now()}: Error in message retention check: ${error}`);
    }
};

CronJob.from({ cronTime, onTick, start: true, timeZone });
