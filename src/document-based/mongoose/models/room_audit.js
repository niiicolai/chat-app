import mongoose from "mongoose";

import { roomAuditTypeSchema as room_audit_type } from "./room_audit_type.js";

export default mongoose.model("RoomAudit", new mongoose.Schema({
    uuid: { 
        type: String, 
        required: true 
    },
    body: { 
        type: String, 
        required: true 
    },
    room: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Room', 
        required: true 
    },
    user: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
    room_audit_type,
}, {
    timestamps: {
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    }
}));
