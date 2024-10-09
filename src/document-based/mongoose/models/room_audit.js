import mongoose from "mongoose";

export default mongoose.model("RoomAudit", new mongoose.Schema({
    uuid: { type: String, required: true },
    body: { type: String, required: true },
    room_audit_type: { type: mongoose.Schema.Types.ObjectId, ref: 'RoomAuditType', required: true },
    room: { type: mongoose.Schema.Types.ObjectId, ref: 'Room', required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now },
}));
