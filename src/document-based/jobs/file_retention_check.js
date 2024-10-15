import { CronJob } from 'cron';
import StorageService from "../../shared/services/storage_service.js";
import Room from '../mongoose/models/room.js';
import RoomFile from '../mongoose/models/room_file.js';
import rollbar from '../../../rollbar.js';

const roomBatch = 10;
const fileBatch = 10;

// Run once a day
const cronTime = '0 0 0 * * *';

// Copenhagen timezone
const timeZone = 'Europe/Copenhagen';

// Load a batch of files older than file_days_to_live
const loadRoomFileBatch = async (room_id, file_days_to_live, offset) => {
    return await RoomFile.find({ room: room_id, created_at: { $lt: new Date(Date.now() - file_days_to_live * 24 * 60 * 60 * 1000) } })
        .limit(fileBatch)
        .skip(offset)
        .sort({ created_at: 1 });
};

// Job
const onTick = async () => {
    console.log(`FILE_RETENTION_CHECK (mongodb): ${Date.now()}: Starting file retention check`);

    try {
        const storage = new StorageService('channel_message_upload');
        const recursiveRoomCheck = async (offset) => {
            const rooms = await Room.find()
                .populate('room_file_settings')
                .limit(roomBatch)
                .skip(offset);
            if (rooms.length === 0) {
                return;
            }

            for (const room of rooms) {
                const room_id = room._id;
                const file_days_to_live = room.room_file_settings?.file_days_to_live || process.env.ROOM_FILE_DAYS_TO_LIVE || 30;
                
                let files = await loadRoomFileBatch(room_id, file_days_to_live, 0);
                
                while (files.length > 0) {
                    for (const file of files) {
                        const key = storage.parseKey(file.src);
                        await storage.deleteFile(key);
                        await RoomFile.deleteOne({ uuid: file.uuid });
                        console.log(`${Date.now()}: Deleted file ${file.uuid} because it exceeded the retention period of ${file_days_to_live} days`);
                    }
                    files = await loadRoomFileBatch(room_id, file_days_to_live, files.length);
                }
            }

            await recursiveRoomCheck(offset + roomBatch);
        };

        await recursiveRoomCheck(0);
        console.log(`FILE_RETENTION_CHECK (mongodb): ${Date.now()}: Finished file retention check`);
    } catch (error) {
        rollbar.error(error);
        console.error(`FILE_RETENTION_CHECK (mongodb): ${Date.now()}: Error during file retention check: ${error.message}`);
    }

};

CronJob.from({ cronTime, onTick, start: true, timeZone });
