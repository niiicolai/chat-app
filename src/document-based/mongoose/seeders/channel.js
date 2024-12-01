import Channel from '../models/channel.js';
import ChannelMessage from '../models/channel_message.js';
import ChannelAudit from '../models/channel_audit.js';
import mongoose from 'mongoose';
import data from '../../../seed_data.js';

export default class ChannelSeeder {
    async up() {
        const session = await mongoose.startSession();
        try {
            session.startTransaction();

            await Channel.insertMany(data.rooms.flatMap((room) => {
                return room.channels.map((channel) => {
                    return {
                        _id: channel.uuid,
                        name: channel.name,
                        description: channel.description,
                        channel_type: channel.channel_type_name,
                        room: room.uuid,
                        ...(channel.channel_webhook && {
                            channel_webhook: {
                                _id: channel.channel_webhook.uuid,
                                name: channel.channel_webhook.name,
                                description: channel.channel_webhook.description,
                            }
                        })
                    }
                })
            }), { session });

            await ChannelMessage.insertMany(data.rooms.flatMap((room) => {
                return room.channels.flatMap((channel) => {
                    return channel.channel_messages.map((channelMessage) => {
                        return {
                            _id: channelMessage.uuid,
                            body: channelMessage.body,
                            channel_message_type: channelMessage.channel_message_type_name,
                            channel: channel.uuid,
                            ...(channelMessage.user_uuid && { user: channelMessage.user_uuid }),
                            ...(channelMessage.channel_message_upload && {
                                channel_message_upload: {
                                    _id: channelMessage.channel_message_upload.uuid,
                                    room_file: channelMessage.channel_message_upload.room_file_uuid,
                                    channel_message_upload_type: channelMessage.channel_message_upload.channel_message_upload_type_name
                                }
                            }),
                            ...(channelMessage.channel_webhook_message && {
                                channel_webhook_message: {
                                    _id: channelMessage.channel_webhook_message.uuid,
                                    body: channelMessage.channel_webhook_message.body,
                                    channel_webhook_message_type: channelMessage.channel_webhook_message.channel_webhook_message_type_name,
                                    channel_webhook: channel.channel_webhook.uuid
                                }
                            }),
                        }
                    })
                })
            }), { session });

            await ChannelAudit.insertMany(data.rooms.flatMap((room) => {
                return room.channels.flatMap((channel) => {
                    return {
                        _id: channel.uuid,
                        body: JSON.stringify(channel),
                        channel_audit_type: "CHANNEL_CREATED",
                        channel: channel.uuid,
                    }
                })
            }), { session });

            await session.commitTransaction();
        } catch (error) {
            await session.abortTransaction();
            throw error;
        } finally {
            session.endSession();
        }
    }

    async down() {
        if (await ChannelAudit.exists()) {
            await ChannelAudit.collection.drop();
        }

        if (await ChannelMessage.exists()) {
            await ChannelMessage.collection.drop();
        }

        if (await Channel.exists()) {
            await Channel.collection.drop();
        }
    }
}
