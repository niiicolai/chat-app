import { broadcastChannel } from '../../../websocket_server.js';

/**
 * A prefix used to filter websocket connections specific to a channel.
 */
const PREFIX = 'channel-';

/**
 * Events that can be broadcasted to a channel.
 */
const EVENTS = {
    chat_message_created: 'chat_message_created',
    chat_message_updated: 'chat_message_updated',
    chat_message_deleted: 'chat_message_deleted'
};

/**
 * @class BroadcastChannelService
 * @description Service class for broadcast channels.
 * @exports BroadcastChannelService
 */
export default class BroadcastChannelService {

    /**
     * @function create
     * @description Broadcast a chat message to a channel.
     * @returns {String}
     */
    static create(channelMessage) {
        if (!channelMessage) throw new Error('Channel message is required.');
        if (typeof channelMessage !== 'object') throw new Error('Channel message must be an object.');
        if (!channelMessage.channel_uuid) throw new Error('Channel UUID is required.');

        broadcastChannel(`${PREFIX}${channelMessage.channel_uuid}`, EVENTS.chat_message_created, channelMessage);
    }

    /**
     * @function update
     * @description Broadcast an updated chat message to a channel.
     * @returns {String}
     */
    static update(channelMessage) {
        if (!channelMessage) throw new Error('Channel message is required.');
        if (typeof channelMessage !== 'object') throw new Error('Channel message must be an object.');
        if (!channelMessage.channel_uuid) throw new Error('Channel UUID is required.');

        broadcastChannel(`${PREFIX}${channelMessage.channel_uuid}`, EVENTS.chat_message_updated, channelMessage);
    }

    /**
     * @function destroy
     * @description Broadcast a deleted chat message to a channel.
     * @returns {String}
     */
    static destroy(channel_uuid , channel_message_uuid) {
        if (!channel_uuid) throw new Error('Channel UUID is required.');
        if (!channel_message_uuid) throw new Error('Channel message UUID is required.');

        broadcastChannel(`${PREFIX}${channel_uuid}`, EVENTS.chat_message_deleted, channel_message_uuid);
    }
}
