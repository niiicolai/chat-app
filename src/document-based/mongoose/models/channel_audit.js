import mongoose from "mongoose";

import { channelAuditTypeSchema as channel_audit_type } from "./channel_audit_type.js";

export default mongoose.model("ChannelAudit", new mongoose.Schema({
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
    channel_audit_type,
}, {
    timestamps: {
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    }
}));
