import { CronJob } from 'cron';
import neodeInstance from '../neode/index.js';
import StorageService from "../../shared/services/storage_service.js";
import rollbar from '../../../rollbar.js';
import neo4j from 'neo4j-driver';

const roomBatch = 10;
const msgBatch = 10;

// Run once a day
const cronTime = '0 0 0 * * *';

// Copenhagen timezone
const timeZone = 'Europe/Copenhagen';

// Load a batch of messages older than msg_days_to_live
const loadChannelMessagesBatch = async (room_uuid, msg_days_to_live, offset) => {
    const timestampCutoff = Date.now() - msg_days_to_live * 24 * 60 * 60 * 1000;
    const datetimeCutoff = new Date(timestampCutoff).toISOString();

    return await neodeInstance.cypher(
        'MATCH (cm:ChannelMessage)-[:IN_CHANNEL]->(c:Channel)-[:IN_ROOM]->(r:Room {uuid: $room_uuid}) ' +
        'MATCH (cm)-[:HAS_CHANNEL_MESSAGE_UPLOAD]->(cmu:ChannelMessageUpload) ' +
        'MATCH (cmu)-[:HAS_ROOM_FILE]->(rf:RoomFile) ' +
        'WHERE cm.created_at < datetime($datetimeCutoff) ' +
        'RETURN cm, c, r, cmu, rf ' +
        'ORDER BY cm.created_at ASC ' +
        'SKIP $offset ' +
        'LIMIT $msgBatch',
        {
            room_uuid,
            datetimeCutoff,
            offset: neo4j.int(offset),
            msgBatch: neo4j.int(msgBatch)
        }
    );
};

// Job
const onTick = async () => {
    console.log(`MESSAGE_RETENTION_CHECK: ${Date.now()}: Starting message retention check`);

    try {
        const storage = new StorageService('channel_message_upload');
        const recursiveRoomCheck = async (offset) => {
            const result = await neodeInstance.cypher(
                'MATCH (r:Room) ' +
                'MATCH (r)-[:HAS_CHANNEL_SETTINGS]->(cs:RoomChannelSettings) ' +
                'RETURN r.uuid AS room_uuid, cs.message_days_to_live AS message_days_to_live ' +
                'ORDER BY r.created_at ASC ' +
                'SKIP $offset ' +
                'LIMIT $roomBatch',
                { offset: neo4j.int(offset), roomBatch: neo4j.int(roomBatch) }
            );

            if (result.records.length === 0) return;

            const rooms = result.records.map((record) => record.toObject());

            for (const room of rooms) {
                const { room_uuid, message_days_to_live } = room;

                let channelMessages = await loadChannelMessagesBatch(room_uuid, message_days_to_live, 0);
                while (channelMessages.records.length > 0) {
                    for (const channelMessageInstance of channelMessages.records) {
                        const channelMessage = channelMessageInstance.cm.properties;
                        const channelMessageUpload = channelMessageInstance.cmu.properties;
                        const roomFile = channelMessageInstance.rf.properties;

                        if (roomFile.uuid) {
                            const key = storage.parseKey(roomFile.src);
                            //await storage.deleteFile(key);
                        }
                        
                        await neodeInstance.model('RoomFile').find(roomFile.uuid).delete();
                        await neodeInstance.model('ChannelMessageUpload').find(channelMessageUpload.uuid).delete();
                        await neodeInstance.model('ChannelMessage').find(channelMessage.uuid).delete();                        

                        console.log(`${Date.now()}: Deleted message ${channelMessage.uuid} because it exceeded the retention period of ${message_days_to_live} days`);
                    }
                    channelMessages = await loadChannelMessagesBatch(room_uuid, message_days_to_live, channelMessages.records.length);
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
