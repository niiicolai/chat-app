import mongoose from "mongoose";

export default mongoose.model("ChannelWebhook", new mongoose.Schema({
    uuid: { type: String, required: true },
    name: { type: String, required: true },
    description: { type: String, required: true },
    channel: { type: mongoose.Schema.Types.ObjectId, ref: 'Channel', required: true },
    room_file: { type: mongoose.Schema.Types.ObjectId, ref: 'RoomFile', required: false },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now },
}));
