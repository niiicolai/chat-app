import mongoose from "mongoose";

export default mongoose.model("RoomChannelSettings", new mongoose.Schema({
    uuid: { type: String, required: true },
    max_channels: { type: Number, required: true },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now },
}));
