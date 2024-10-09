import mongoose from "mongoose";

export default mongoose.model("Channel", new mongoose.Schema({
    uuid: { type: String, required: true },
    name: { type: String, required: true },
    description: { type: String, required: true },
    channel_type: { type: mongoose.Schema.Types.ObjectId, ref: 'ChannelType', required: true },
    room: { type: mongoose.Schema.Types.ObjectId, ref: 'Room', required: true },
    room_file: { type: mongoose.Schema.Types.ObjectId, ref: 'RoomFile', required: false },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now },
}));
