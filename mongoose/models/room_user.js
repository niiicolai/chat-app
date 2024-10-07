import mongoose from "mongoose";

export default mongoose.model("RoomUser", new mongoose.Schema({
    uuid: { type: String, required: true },
    room_user_role: { type: mongoose.Schema.Types.ObjectId, ref: 'RoomUserRole', required: true },
    room: { type: mongoose.Schema.Types.ObjectId, ref: 'Room', required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now },
}));
