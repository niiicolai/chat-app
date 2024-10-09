import mongoose from "mongoose";

export default mongoose.model("UserEmailVerification", new mongoose.Schema({
    uuid: { type: String, required: true },
    is_verified: { type: Boolean, required: true },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now },
}));
