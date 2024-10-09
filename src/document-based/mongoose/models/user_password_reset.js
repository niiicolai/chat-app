import mongoose from "mongoose";

export default mongoose.model("UserPasswordReset", new mongoose.Schema({
    uuid: { type: String, required: true },
    expires_at: { type: Date, required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now },
}));
