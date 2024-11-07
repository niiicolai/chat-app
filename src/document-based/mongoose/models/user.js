import mongoose from "mongoose";

export default mongoose.model("User", new mongoose.Schema({
    uuid: { type: String, required: true },
    username: { type: String, required: true },
    email: { type: String, required: true },
    avatar_src: { type: String, required: false },
    user_email_verification: { type: mongoose.Schema.Types.ObjectId, ref: 'UserEmailVerification', required: true },
    user_status: { type: mongoose.Schema.Types.ObjectId, ref: 'UserStatus', required: true },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now },
}));
