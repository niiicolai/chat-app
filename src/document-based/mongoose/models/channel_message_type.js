import mongoose from "mongoose";

export const channelMessageTypeSchema = new mongoose.Schema({
    name: { type: String, required: true },
}, {
    timestamps: {
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    }
});

const ChannelMessageType = mongoose.model("ChannelMessageType", channelMessageTypeSchema);

export default ChannelMessageType;
