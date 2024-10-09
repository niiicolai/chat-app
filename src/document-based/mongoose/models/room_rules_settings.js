import mongoose from "mongoose";

export default mongoose.model("RoomRulesSettings", new mongoose.Schema({
    uuid: { type: String, required: true },
    rules_text: { type: String, required: true },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now },
}));
