import mongoose from "mongoose";

export default mongoose.model("UserLogin", new mongoose.Schema({
    uuid: { type: String, required: true },
    password: { type: String, required: false },
    third_party_id: { type: String, required: false },
    user_login_type: { type: mongoose.Schema.Types.ObjectId, ref: 'UserLoginType', required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now },
}));
