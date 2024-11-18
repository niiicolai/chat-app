import mongoose from "mongoose";

import { channelTypeSchema as channel_type } from "./channel_type.js";
import channel_webhook from "./channel_webhook.js";

export default mongoose.model("Channel", new mongoose.Schema({
    uuid: { 
        type: String, 
        required: true,
        unique: true 
    },
    name: { 
        type: String, 
        required: true 
    },
    description: { 
        type: String, 
        required: true 
    },
    room: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Room', 
        required: true 
    },
    room_file: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'RoomFile', 
        required: false 
    },
    channel_type,
    channel_webhook,
}, {
    timestamps: {
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    }
}));
