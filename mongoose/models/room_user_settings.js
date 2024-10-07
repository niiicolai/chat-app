import mongoose from "mongoose";

export default mongoose.model("RoomUserSettings", new mongoose.Schema({
    uuid: { type: String, required: true },
    max_users: { type: Number, required: true },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now },
}));
