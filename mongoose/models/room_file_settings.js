import mongoose from "mongoose";

export default mongoose.model("RoomFileSettings", new mongoose.Schema({
    uuid: { type: String, required: true },
    message_days_to_live: { type: Number, required: true },
    file_days_to_live: { type: Number, required: true },
    total_files_bytes_allowed: { type: Number, required: true },
    single_file_bytes_allowed: { type: Number, required: true },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now },
}));
