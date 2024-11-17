import mongoose from "mongoose";

import { roomFileTypeSchema as room_file_type } from "./room_file_type.js";

export default mongoose.model("RoomFile", new mongoose.Schema({
    uuid: { 
        type: String, 
        required: true 
    },
    src: { 
        type: String, 
        required: true 
    },
    size: { 
        type: Number, 
        required: true 
    },
    room: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Room', 
        required: true 
    },
    room_file_type,
}, {
    timestamps: {
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    }
}));
