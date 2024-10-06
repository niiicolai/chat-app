import mongoose from "mongoose";

export default mongoose.model("RoomFile", new mongoose.Schema({
    uuid: { type: String, required: true },
    src: { type: String, required: true },
    size: { type: Number, required: true },
    room_file_type: { type: mongoose.Schema.Types.ObjectId, ref: 'RoomFileType', required: true },
    room: { type: mongoose.Schema.Types.ObjectId, ref: 'Room', required: true },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now },
}));
