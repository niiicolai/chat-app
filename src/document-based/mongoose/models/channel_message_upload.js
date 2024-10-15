import mongoose from "mongoose";

export default mongoose.model("ChannelMessageUpload", new mongoose.Schema({
    uuid: { type: String, required: true },
    room_file: { type: mongoose.Schema.Types.ObjectId, ref: 'RoomFile', required: true },
    channel_message_upload_type: { type: mongoose.Schema.Types.ObjectId, ref: 'ChannelMessageUploadType', required: true },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now },
}));
