import { CronJob } from 'cron';
import StorageService from "../../shared/services/storage_service.js";
import db from "../sequelize/models/index.cjs";
import rollbar from '../../../rollbar.js';

/**
 * File retention check job.
 * The job is responsible for finding and deleting files attached to messages that are older 
 * than a certain number of days.
 * The number of days are defined by the rooms' file_days_to_live property.
 */

// The number of rooms to process in a batch
const roomBatch = 10;

// Run once a day
const cronTime = '0 0 0 * * *';

// Copenhagen timezone
const timeZone = 'Europe/Copenhagen';

// The storage service instance for channel messages
const storage = new StorageService('channel_message_upload');

// Time between each batch
const timeBetweenBatches = 5000;

/**
 * @function loadRoomFileBatch
 * @description Load a batch of room files.
 * @param {string} room_uuid - The room UUID.
 * @param {number} file_days_to_live - The number of days a file is allowed to live.
 * @param {number} offset - The offset.
 * @param {Object} transaction - The transaction object.
 * @param {number} batchSize - The batch size.
 */
const loadExpiredRoomFiles = async (room_uuid, file_days_to_live, offset, transaction = null, batchSize = 10) => {
    if (!room_uuid) throw new Error('room_uuid is required');
    if (!file_days_to_live) throw new Error('file_days_to_live is required');
    if (!offset && offset !== 0) throw new Error('offset is required');
    if (!transaction) throw new Error('transaction is required');
    if (!batchSize) throw new Error('batchSize is required');

    console.log(`FILE_RETENTION_CHECK (mysql): ${Date.now()}: Loading expired room files for room: ${room_uuid}; offset: ${offset}; batchSize: ${batchSize}`);
    const createdAtInterval = db.Sequelize.literal(`NOW() - INTERVAL ${file_days_to_live} DAY`);
    
    return await db.RoomFileView.findAll({
        where: {
            room_uuid,
            room_file_type_name: 'ChannelMessageUpload',
            room_file_created_at: { [db.Sequelize.Op.lt]: createdAtInterval }
        },
        limit: batchSize,
        offset,
        order: [['room_file_created_at', 'ASC']]
    }, { transaction });
};

/**
 * @function recursiveRoomFileCheck
 * @description Recursively check room files for expiration.
 * @param {string} room_uuid - The room UUID.
 * @param {number} file_days_to_live - The number of days a file is allowed to live.
 * @param {number} offset - The offset.
 * @param {Object} transaction - The transaction object.
 * @param {Array<string>} sourcesForDeletion - The sources for deletion.
 * @returns {Promise<void>}
 */
export const recursiveRoomFileCheck = async (room_uuid, file_days_to_live, offset, transaction, sourcesForDeletion) => {
    if (!room_uuid) throw new Error('room_uuid is required');
    if (!file_days_to_live) throw new Error('file_days_to_live is required');
    if (!offset && offset !== 0) throw new Error('offset is required');
    if (!transaction) throw new Error('transaction is required');
    if (!sourcesForDeletion) throw new Error('sourcesForDeletion is required');

    const roomFiles = await loadExpiredRoomFiles(room_uuid, file_days_to_live, offset, transaction);
    if (roomFiles.length === 0) return;
    sourcesForDeletion.push(...roomFiles.map(roomFile => roomFile.room_file_src));
    // Delete the room files
    await Promise.all(roomFiles.map(async roomFile => {
        console.log(`MESSAGE_RETENTION_CHECK (mysql): ${Date.now()}: Deleting room file: ${roomFile.room_file_uuid} because it is older than ${file_days_to_live} days`);
        await db.RoomFileView.deleteRoomFileProcStatic({ uuid: roomFile.room_file_uuid }, transaction);
    }));
    // Load the next batch of expired channel messages
    await recursiveRoomFileCheck(room_uuid, file_days_to_live, offset + roomFiles.length, transaction, sourcesForDeletion);
};

/**
 * @function loadRoomsBatch
 * @description Load rooms batch.
 * @param {number} offset - The offset.
 * @param {number} batchSize - The batch size.
 * @returns {Promise<Array<Object>>}
 */
export const loadRoomsBatch = async (offset, batchSize = 10) => {
    if (!offset && offset !== 0) throw new Error('offset is required');
    if (!batchSize) throw new Error('batchSize is required');

    return await db.RoomView.findAll({ offset, limit: batchSize, order: [['room_created_at', 'ASC']] });
};

/**
 * @function recursiveRoomCheck
 * @description Recursively check rooms for expired files.
 * @param {number} offset - The offset.
 * @returns {Promise<void>}
 */
export const recursiveRoomCheck = async (offset) => {
    if (!offset && offset !== 0) throw new Error('offset is required');

    const rooms = await loadRoomsBatch(offset);
    const nextOffset = offset + roomBatch;

    if (rooms.length === 0) return;

    // An array for storing sources of files that need to be deleted
    // to be able to delete the files after deleting the messages
    const sourcesForDeletion = [];

    await db.sequelize.transaction(async (transaction) => {
        await Promise.all(rooms.map(async (room) => {
            await recursiveRoomFileCheck(room.room_uuid, room.file_days_to_live, 0, transaction, sourcesForDeletion);
        }));

        // Delete the files
        await Promise.all(sourcesForDeletion.map(async (src) => {
            console.log(`FILE_RETENTION_CHECK (mysql): ${Date.now()}: Deleting file: ${src}`);
            const key = storage.parseKey(src);
            await storage.deleteFile(key);
        }));
    });

    // Load the next batch of rooms
    await new Promise((resolve) => {
        setTimeout(async () => {
            await recursiveRoomCheck(nextOffset);
            resolve();
        }, timeBetweenBatches);
    });
};

/**
 * @function onTick
 * @description The function to run on tick.
 * @returns {Promise<void>}
 */
const onTick = async () => {
    console.log(`FILE_RETENTION_CHECK (mysql): ${Date.now()}: Starting file retention check`);

    try {
        await recursiveRoomCheck(0);
        console.log(`FILE_RETENTION_CHECK (mysql): ${Date.now()}: Finished file retention check`);

    } catch (error) {
        rollbar.error(error);
        console.error(`FILE_RETENTION_CHECK (mysql): ${Date.now()}: Error in file retention check: ${error}`);
    }
};

// Create a cron job
CronJob.from({ cronTime, onTick, start: true, timeZone });
