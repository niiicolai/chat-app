import mongoose from "mongoose";

export const channelMessageUploadTypeSchema = new mongoose.Schema({
    name: { type: String, required: true },
}, {
    timestamps: {
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    }
});

const ChannelMessageUploadType = mongoose.model("ChannelMessageUploadType", channelMessageUploadTypeSchema);

export default ChannelMessageUploadType;
