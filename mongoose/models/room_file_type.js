import mongoose from "mongoose";

export default mongoose.model("RoomFileType", new mongoose.Schema({
    name: { type: String, required: true },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now },
}));
