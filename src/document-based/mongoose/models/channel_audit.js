import mongoose from "mongoose";

export default mongoose.model("ChannelAudit", new mongoose.Schema({
    uuid: { type: String, required: true },
    body: { type: String, required: true },
    channel_audit_type: { type: mongoose.Schema.Types.ObjectId, ref: 'ChannelAuditType', required: true },
    channel: { type: mongoose.Schema.Types.ObjectId, ref: 'Channel', required: true },
    room: { type: mongoose.Schema.Types.ObjectId, ref: 'Room', required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now },
}));
