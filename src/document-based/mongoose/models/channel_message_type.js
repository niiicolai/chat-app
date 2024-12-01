import mongoose from "mongoose";

const channelMessageTypeSchema = new mongoose.Schema({
    _id: mongoose.Schema.Types.String,
}, {
    timestamps: {
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    }
});

const ChannelMessageType = mongoose.model("ChannelMessageType", channelMessageTypeSchema);

export default ChannelMessageType;
