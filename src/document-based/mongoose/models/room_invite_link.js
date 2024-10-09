import mongoose from "mongoose";

export default mongoose.model("RoomInviteLink", new mongoose.Schema({
    uuid: { type: String, required: true },
    expires_at: { type: Date, required: false },
    room: { type: mongoose.Schema.Types.ObjectId, ref: 'Room', required: true },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now },
}));
