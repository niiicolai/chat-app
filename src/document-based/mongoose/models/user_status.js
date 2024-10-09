import mongoose from "mongoose";

export default mongoose.model("UserStatus", new mongoose.Schema({
    uuid: { type: String, required: true },
    last_seen_at: { type: Date, required: true },
    message: { type: String, required: true },
    total_online_hours: { type: Number, required: true },
    user_status_state: { type: mongoose.Schema.Types.ObjectId, ref: 'UserStatusState', required: true },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now },
}));
