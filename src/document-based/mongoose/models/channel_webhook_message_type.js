import mongoose from "mongoose";

const channelWebhookMessageTypeSchema = new mongoose.Schema({
    _id: mongoose.Schema.Types.String,
}, {
    timestamps: {
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    },
    autoCreate: false
});

const ChannelWebhookMessageType = mongoose.model("ChannelWebhookMessageType", channelWebhookMessageTypeSchema);

export default ChannelWebhookMessageType;
