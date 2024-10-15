import mongoose from "mongoose";

export default mongoose.model("ChannelMessage", new mongoose.Schema({
    uuid: { type: String, required: true },
    body: { type: String, required: true },
    channel: { type: mongoose.Schema.Types.ObjectId, ref: 'Channel', required: true },
    channel_message_type: { type: mongoose.Schema.Types.ObjectId, ref: 'ChannelMessageType', required: true },
    channel_message_upload: { type: mongoose.Schema.Types.ObjectId, ref: 'ChannelMessageUpload', required: false },
    channel_webhook_message: { type: mongoose.Schema.Types.ObjectId, ref: 'ChannelWebhookMessage', required: false },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now },
}));
