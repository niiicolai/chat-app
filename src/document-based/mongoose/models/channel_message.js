import mongoose from "mongoose";

import { channelMessageTypeSchema as channel_message_type } from "./channel_message_type.js";
import channel_message_upload from "./channel_message_upload.js";
import channel_webhook_message from "./channel_webhook_message.js";

export default mongoose.model("ChannelMessage", new mongoose.Schema({
    uuid: { 
        type: String, 
        required: true 
    },
    body: { 
        type: String, 
        required: true 
    },
    channel: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Channel', 
        required: true 
    },
    user: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: false 
    },
    channel_message_type,
    channel_message_upload,
    channel_webhook_message,
}, {
    timestamps: {
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    }
}));
