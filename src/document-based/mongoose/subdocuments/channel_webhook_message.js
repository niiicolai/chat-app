import mongoose from "mongoose";

export default new mongoose.Schema({
    _id: mongoose.Schema.Types.UUID,
    body: { 
        type: mongoose.Schema.Types.String, 
        required: true 
    },
    channel_webhook: { 
        type: mongoose.Schema.Types.UUID, 
        ref: 'ChannelWebhook', 
        required: true 
    },
    channel_webhook_message_type: {
        type: mongoose.Schema.Types.String, 
        ref: 'ChannelWebhookMessageType',
        required: true
    },
}, {
    timestamps: {
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    }
});
