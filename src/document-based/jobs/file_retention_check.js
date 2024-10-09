import { CronJob } from 'cron';
import StorageService from "../services/storage_service.js";
import db from "../../sequelize/models/index.cjs";
import rollbar from '../../rollbar.js';

const roomBatch = 10;
const fileBatch = 10;

// Run once a day
const cronTime = '0 0 0 * * *';

// Copenhagen timezone
const timeZone = 'Europe/Copenhagen';

// Load a batch of files older than file_days_to_live
const loadRoomFileBatch = async (room_uuid, file_days_to_live, offset) => {
    return await db.RoomFileView.findAll({
        where: {
            room_uuid,
            room_file_type_name: 'ChannelMessageUpload',
            room_file_created_at: {
                [db.Sequelize.Op.lt]: db.Sequelize.literal(`NOW() - INTERVAL ${file_days_to_live} DAY`)
            }
        },
        offset,
        limit: fileBatch
    });
};

// Job
const onTick = async () => {
    console.log(`FILE_RETENTION_CHECK: ${Date.now()}: Starting file retention check`);

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
                const { room_uuid, file_days_to_live } = room;

                let files = await loadRoomFileBatch(room_uuid, file_days_to_live, 0);
                while (files.length > 0) {
                    for (const file of files) {
                        const key = storage.parseKey(file.room_file_src);
                        await storage.deleteFile(key);
                        await db.sequelize.query('CALL delete_room_file_proc(:room_file_uuid, @result)', {
                            replacements: {
                                room_file_uuid: file.room_file_uuid,
                            },
                        });
                        console.log(`${Date.now()}: Deleted file ${file.room_file_uuid} because it exceeded the retention period of ${file_days_to_live} days`);
                    }
                    files = await loadRoomFileBatch(room_uuid, file_days_to_live, files.length);
                }
            }

            await recursiveRoomCheck(offset + roomBatch);
        };

        await recursiveRoomCheck(0);

        console.log(`FILE_RETENTION_CHECK: ${Date.now()}: Finished file retention check`);

    } catch (error) {
        rollbar.error(error);
        console.error(`FILE_RETENTION_CHECK: ${Date.now()}: Error in file retention check: ${error}`);
    }
};

CronJob.from({ cronTime, onTick, start: true, timeZone });
