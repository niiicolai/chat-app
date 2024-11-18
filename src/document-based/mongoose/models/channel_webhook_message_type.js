import mongoose from "mongoose";

export const channelWebhookMessageTypeSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        index: true
    }
}, {
    timestamps: {
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    }
});

const ChannelWebhookMessageType = mongoose.model("ChannelWebhookMessageType", channelWebhookMessageTypeSchema);

export default ChannelWebhookMessageType;
