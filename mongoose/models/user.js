import mongoose from "mongoose";

export default mongoose.model("User", new mongoose.Schema({
    uuid: { type: String, required: true },
    username: { type: String, required: true },
    email: { type: String, required: true },
    password: { type: String, required: true },
    avatar_src: { type: String, required: false },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now },
}));
