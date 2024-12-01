import mongoose from "mongoose";

import channel_message_upload from "../subdocuments/channel_message_upload.js";
import channel_webhook_message from "../subdocuments/channel_webhook_message.js";

export default mongoose.model("ChannelMessage", new mongoose.Schema({
    _id: mongoose.Schema.Types.UUID,
    body: { 
        type: mongoose.Schema.Types.String, 
        required: true 
    },
    channel: { 
        type: mongoose.Schema.Types.UUID, 
        ref: 'Channel', 
        required: true 
    },
    user: { 
        type: mongoose.Schema.Types.UUID, 
        ref: 'User', 
        required: false 
    },
    channel_message_type: {
        type: mongoose.Schema.Types.String, 
        ref: 'ChannelMessageType',
        required: false  
    },
    channel_message_upload,
    channel_webhook_message,
}, {
    timestamps: {
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    }
}));
