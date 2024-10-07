import mongoose from "mongoose";

export default mongoose.model("RoomAvatar", new mongoose.Schema({
    uuid: { type: String, required: true },
    room_file: { type: mongoose.Schema.Types.ObjectId, ref: 'RoomFile', required: false },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now },
}));
