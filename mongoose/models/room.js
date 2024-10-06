import mongoose from "mongoose";

export default mongoose.model("Room", new mongoose.Schema({
    uuid: { type: String, required: true },
    name: { type: String, required: false },
    description: { type: String, required: true },
    room_category: { type: mongoose.Schema.Types.ObjectId, ref: 'RoomCategory', required: true },
    room_join_settings: { type: mongoose.Schema.Types.ObjectId, ref: 'RoomJoinSettings', required: true },
    room_file_settings: { type: mongoose.Schema.Types.ObjectId, ref: 'RoomFileSettings', required: true },
    room_user_settings: { type: mongoose.Schema.Types.ObjectId, ref: 'RoomUserSettings', required: true },
    room_channel_settings: { type: mongoose.Schema.Types.ObjectId, ref: 'RoomChannelSettings', required: true },
    room_rules_settings: { type: mongoose.Schema.Types.ObjectId, ref: 'RoomRulesSettings', required: true },
    room_avatar: { type: mongoose.Schema.Types.ObjectId, ref: 'RoomAvatar', required: true },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now },
}));
