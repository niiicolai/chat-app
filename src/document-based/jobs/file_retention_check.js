import { CronJob } from 'cron';
import StorageService from "../../shared/services/storage_service.js";
import Room from '../mongoose/models/room.js';
import RoomFile from '../mongoose/models/room_file.js';
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
 * @param {number} batchSize - The batch size.
 * @returns {Promise<Array<Object>>}
 */
const loadExpiredRoomFiles = async (room_uuid, file_days_to_live, offset, batchSize = 10) => {
    if (!room_uuid) throw new Error('room_uuid is required');
    if (!file_days_to_live) throw new Error('file_days_to_live is required');
    if (!offset && offset !== 0) throw new Error('offset is required');
    if (!batchSize) throw new Error('batchSize is required');

    const created_at = { $lt: new Date(Date.now() - file_days_to_live * 24 * 60 * 60 * 1000) };
    console.log(`MESSAGE_RETENTION_CHECK (mongodb): ${Date.now()}: Loading expired room files for room: ${room_uuid}; offset: ${offset}; batchSize: ${batchSize}`);

    return await RoomFile.find({ room: room_uuid, created_at, room_file_type: 'ChannelMessageUpload' })
        .limit(batchSize)
        .skip(offset)
        .sort({ created_at: 1 });
};

/**
 * @function recursiveRoomFileCheck
 * @description Recursively check room files for expiration.
 * @param {string} room_uuid - The room UUID.
 * @param {number} file_days_to_live - The number of days a file is allowed to live.
 * @param {number} offset - The offset.
 * @param {Array<string>} sourcesForDeletion - The sources for deletion.
 * @returns {Promise<void>}
 */
export const recursiveRoomFileCheck = async (room_uuid, file_days_to_live, offset, sourcesForDeletion) => {
    if (!room_uuid) throw new Error('room_uuid is required');
    if (!file_days_to_live) throw new Error('file_days_to_live is required');
    if (!offset && offset !== 0) throw new Error('offset is required');
    if (!sourcesForDeletion) throw new Error('sourcesForDeletion is required');

    const roomFiles = await loadExpiredRoomFiles(room_uuid, file_days_to_live, offset);
    if (roomFiles.length === 0) return;
    sourcesForDeletion.push(...roomFiles.map(roomFile => roomFile.src));
    // Delete the room files
    await Promise.all(roomFiles.map(async roomFile => {
        console.log(`MESSAGE_RETENTION_CHECK (mongodb): ${Date.now()}: Deleting room file: ${roomFile._id}; (type: ${roomFile.room_file_type}) because it is older than ${file_days_to_live} days`);
        await RoomFile.deleteOne({ _id: roomFile._id });
    }));
    // Load the next batch of expired channel messages
    await recursiveRoomFileCheck(room_uuid, file_days_to_live, offset + roomFiles.length, sourcesForDeletion);
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

    return await Room.find().limit(roomBatch).skip(offset).sort({ created_at: 1 });
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

    try {
        await Promise.all(rooms.map(async (room) => {
            const { _id, room_file_settings } = room;
            const { file_days_to_live } = room_file_settings;

            await recursiveRoomFileCheck(_id, file_days_to_live, 0, sourcesForDeletion);

            // Delete the files
            await Promise.all(sourcesForDeletion.map(async (src) => {
                console.log(`FILE_RETENTION_CHECK (mongodb): ${Date.now()}: Deleting file: ${src}`);
                const key = storage.parseKey(src);
                await storage.deleteFile(key);
            }));
        }));
    } catch (error) {
        console.error(error);
        throw error;
    }

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
    console.log(`FILE_RETENTION_CHECK (mongodb): ${Date.now()}: Starting file retention check`);

    try {
        await recursiveRoomCheck(0);
        console.log(`FILE_RETENTION_CHECK (mongodb): ${Date.now()}: Finished file retention check`);
    } catch (error) {
        rollbar.error(error);
        console.error(`FILE_RETENTION_CHECK (mongodb): ${Date.now()}: Error during file retention check: ${error.message}`);
    }

};

// Create the job
CronJob.from({ cronTime, onTick, start: true, timeZone });
