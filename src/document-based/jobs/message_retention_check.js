import { CronJob } from 'cron';
import StorageService from "../../shared/services/storage_service.js";
import ChannelMessage from '../mongoose/models/channel_message.js';
import Room from '../mongoose/models/room.js';
import Channel from '../mongoose/models/channel.js';
import rollbar from '../../../rollbar.js';

/**
 * Message retention check job.
 * The job is responsible for finding and deleting messages that are older than a certain number of days.
 * The number of days are defined by the rooms' msg_days_to_live property.
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
 * @function loadExpiredChannelMessages
 * @description Load expired channel messages.
 * @param {string} room_uuid - The room UUID.
 * @param {number} msg_days_to_live - The number of days a message is allowed to live.
 * @param {number} offset - The offset.
 * @param {number} batchSize - The batch size.
 * @returns {Promise<Array<Object>>}
 */
const loadExpiredChannelMessages = async (room_uuid, msg_days_to_live, offset, batchSize = 10) => {
    if (!room_uuid) throw new Error('room_uuid is required');
    if (!msg_days_to_live) throw new Error('msg_days_to_live is required');
    if (!offset && offset !== 0) throw new Error('offset is required');
    if (!batchSize) throw new Error('batchSize is required');

    const channels = await Channel.find({ room: room_uuid });
    const channel_ids = channels.map(channel => channel._id);
    const created_at = new Date(Date.now() - msg_days_to_live * 24 * 60 * 60 * 1000);
    console.log(`MESSAGE_RETENTION_CHECK (mongodb): ${Date.now()}: Loading expired channel messages for room: ${room_uuid}; offset: ${offset}; batchSize: ${batchSize}`);

    return await ChannelMessage.find({ channel: { $in: channel_ids }, created_at: { $lt: created_at } })
        .populate('channel_message_upload.room_file')
        .limit(batchSize)
        .skip(offset)
        .sort({ created_at: 1 });
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
 * @function recursiveChannelMessageCheck
 * @description Recursively check channel messages for expiration.
 * @param {string} room_uuid - The room UUID.
 * @param {number} message_days_to_live - The number of days a message is allowed to live.
 * @param {number} offset - The offset.
 * @param {Array<string>} sourcesForDeletion - The sources for deletion.
 * @returns {Promise<void>}
 */
export const recursiveChannelMessageCheck = async (room_uuid, message_days_to_live, offset, sourcesForDeletion) => {
    const channelMessages = await loadExpiredChannelMessages(room_uuid, message_days_to_live, offset);
    if (channelMessages.length === 0) return;
    // Add the sources of the files to the array and filter out the messages that have no file
    sourcesForDeletion.push(...channelMessages
        .filter(channelMessage => channelMessage.channel_message_upload?.room_file)
        .map(channelMessage => channelMessage.channel_message_upload.room_file.src));
    // Delete the messages
    await Promise.all(channelMessages.map(async channelMessage => {
        console.log(`MESSAGE_RETENTION_CHECK (mysql): ${Date.now()}: Deleting channel message: ${channelMessage._id} because it is older than ${message_days_to_live} days`);
        await ChannelMessage.findOneAndDelete({ _id: channelMessage._id });
    }));
    // Load the next batch of expired channel messages
    await recursiveChannelMessageCheck(room_uuid, message_days_to_live, offset + channelMessages.length, sourcesForDeletion);
};

/**
 * @function recursiveRoomCheck
 * @description Recursively check rooms for expired messages.
 * @param {number} offset - The offset.
 * @returns {Promise<void>}
 */
export const recursiveRoomCheck = async (offset) => {
    const rooms = await loadRoomsBatch(offset);
    const nextOffset = offset + roomBatch;

    if (rooms.length === 0) return;

    // An array for storing sources of files that need to be deleted
    // to be able to delete the files after deleting the messages
    const sourcesForDeletion = [];

    await Promise.all(rooms.map(async (room) => {
        const { _id, room_channel_settings } = room;
        const { message_days_to_live } = room_channel_settings;
        await recursiveChannelMessageCheck(_id, message_days_to_live, 0, sourcesForDeletion);
    }));

    // Delete the files
    await Promise.all(sourcesForDeletion.map(async (src) => {
        console.log(`MESSAGE_RETENTION_CHECK (mongodb): ${Date.now()}: Deleting file: ${src}`);
        const key = storage.parseKey(src);
        await storage.deleteFile(key);
    }));

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
    console.log(`MESSAGE_RETENTION_CHECK (mongodb): ${Date.now()}: Starting message retention check`);

    try {
        await recursiveRoomCheck(0);
        console.log(`MESSAGE_RETENTION_CHECK (mongodb): ${Date.now()}: Finished message retention check`);
    } catch (error) {
        rollbar.error(error);
        console.error(`MESSAGE_RETENTION_CHECK (mongodb): ${Date.now()}: Error in message retention check: ${error}`);
    }
};

// Create a cron job
CronJob.from({ cronTime, onTick, start: true, timeZone });
