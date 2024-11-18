import mongoose from "mongoose";

import { channelMessageUploadTypeSchema as channel_message_upload_type } from "./channel_message_upload_type.js";

export default new mongoose.Schema({
    uuid: { 
        type: String, 
        required: true 
    },
    room_file: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'RoomFile', 
        required: true 
    },
    channel_message_upload_type,
}, {
    timestamps: {
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    }
});
