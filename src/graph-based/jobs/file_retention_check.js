import { CronJob } from 'cron';
import neodeInstance from '../neode/index.js';
import StorageService from "../../shared/services/storage_service.js";
import rollbar from '../../../rollbar.js';
import neo4j from 'neo4j-driver';

const roomBatch = 10;
const fileBatch = 10;

// Run once a day
const cronTime = '0 0 0 * * *';

// Copenhagen timezone
const timeZone = 'Europe/Copenhagen';

// Load a batch of files older than file_days_to_live
const loadRoomFileBatch = async (room_uuid, file_days_to_live, offset) => {
    const timestampCutoff = Date.now() - file_days_to_live * 24 * 60 * 60 * 1000;
    const datetimeCutoff = new Date(timestampCutoff).toISOString();

    return await neodeInstance.cypher(
        'MATCH (raf:RoomFile)-[:HAS_ROOM]->(r:Room {uuid: $room_uuid}) ' +
        'MATCH (raf)-[:HAS_ROOM_FILE_TYPE]->(raft:RoomFileType {name: "ChannelMessageUpload"}) ' +
        'WHERE raf.created_at < datetime($datetimeCutoff) ' +
        'RETURN raf, r, raft ' +
        'ORDER BY raf.created_at ASC ' +
        'SKIP $offset ' +
        'LIMIT $fileBatch',
        {
            room_uuid,
            datetimeCutoff,
            offset: neo4j.int(offset),
            fileBatch: neo4j.int(fileBatch)
        }
    );
};

// Job
const onTick = async () => {
    console.log(`FILE_RETENTION_CHECK: ${Date.now()}: Starting file retention check`);

    try {
        const storage = new StorageService('channel_message_upload');
        const recursiveRoomCheck = async (offset) => {
            const result = await neodeInstance.cypher(
                'MATCH (r:Room) ' +
                'MATCH (r)-[:HAS_FILE_SETTINGS]->(fs:RoomFileSettings) ' +
                'RETURN r.uuid AS room_uuid, fs.file_days_to_live AS file_days_to_live ' +
                'ORDER BY r.created_at ASC ' +
                'SKIP $offset ' +
                'LIMIT $roomBatch',
                { offset: neo4j.int(offset), roomBatch: neo4j.int(roomBatch) }
            );

            if (result.records.length === 0) return;

            const rooms = result.records.map((record) => record.toObject());
            for (const room of rooms) {

                const { room_uuid, file_days_to_live } = room;
                let files = await loadRoomFileBatch(room_uuid, file_days_to_live, 0);
                
                while (files.records.length > 0) {
                    for (const fileInstance of files.records) {
                        const file = fileInstance.get('raf').properties;
                        const key = storage.parseKey(file.src);
                        await storage.deleteFile(key);
                        await neodeInstance.model('RoomFile').find(file.uuid).delete();
                        console.log(`${Date.now()}: Deleted file ${file.uuid} because it exceeded the retention period of ${file_days_to_live} days`);
                    }
                    files = await loadRoomFileBatch(room_uuid, file_days_to_live, files.records.length);
                }
            }

            await recursiveRoomCheck((offset + roomBatch));
        };

        await recursiveRoomCheck(0);

        console.log(`FILE_RETENTION_CHECK: ${Date.now()}: Finished file retention check`);

    } catch (error) {
        rollbar.error(error);
        console.error(`FILE_RETENTION_CHECK: ${Date.now()}: Error in file retention check: ${error}`);
    }
};

CronJob.from({ cronTime, onTick, start: true, timeZone });
