import mongoose from "mongoose";

export default mongoose.model("ChannelWebhookMessage", new mongoose.Schema({
    uuid: { type: String, required: true },
    body: { type: String, required: true },
    channel_webhook_message_type: { type: mongoose.Schema.Types.ObjectId, ref: 'ChannelWebhookMessageType', required: true },
    channel_webhook: { type: mongoose.Schema.Types.ObjectId, ref: 'ChannelWebhook', required: true },
    channel_message: { type: mongoose.Schema.Types.ObjectId, ref: 'ChannelMessage', required: true },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now },
}));
