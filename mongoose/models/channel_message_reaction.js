import mongoose from "mongoose";

export default mongoose.model("ChannelMessageReaction", new mongoose.Schema({
    uuid: { type: String, required: true },
    reaction: { type: String, required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    channel_message: { type: mongoose.Schema.Types.ObjectId, ref: 'ChannelMessage', required: true },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now },
}));
