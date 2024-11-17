import mongoose from "mongoose";

export const channelWebhookSchema = new mongoose.Schema({
    uuid: { 
        type: String, 
        required: true 
    },
    name: { 
        type: String, 
        required: true 
    },
    description: { 
        type: String, 
        required: true 
    },
    room_file: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'RoomFile', 
        required: false 
    },
}, {
    timestamps: {
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    }
});

const ChannelWebhook = mongoose.model("ChannelWebhook", channelWebhookSchema);

export default ChannelWebhook;
