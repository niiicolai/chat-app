import mongoose from "mongoose";

export default mongoose.model("RoomJoinSettings", new mongoose.Schema({
    uuid: { type: String, required: true },
    join_channel: { type: mongoose.Schema.Types.ObjectId, ref: 'Channel', required: false },
    join_message: { type: String, required: true },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now },
}));
