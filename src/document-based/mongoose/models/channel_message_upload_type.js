import mongoose from "mongoose";

const channelMessageUploadTypeSchema = new mongoose.Schema({
    _id: mongoose.Schema.Types.String,
}, {
    timestamps: {
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    }
});

const ChannelMessageUploadType = mongoose.model("ChannelMessageUploadType", channelMessageUploadTypeSchema);

export default ChannelMessageUploadType;
