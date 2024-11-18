import mongoose from "mongoose";

import { channelWebhookMessageTypeSchema as channel_webhook_message_type } from "./channel_webhook_message_type.js";

export default new mongoose.Schema({
    uuid: { 
        type: String, 
        required: true,
        index: true
    },
    body: { 
        type: String, 
        required: true 
    },
    channel_webhook: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'ChannelWebhook', 
        required: true 
    },
    channel_webhook_message_type,
}, {
    timestamps: {
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    }
});
