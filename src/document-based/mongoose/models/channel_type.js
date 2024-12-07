import mongoose from "mongoose";

const channelTypeSchema = new mongoose.Schema({
    _id: mongoose.Schema.Types.String,
}, {
    timestamps: {
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    },
    autoCreate: false
});

const channelTypeModel = mongoose.model("ChannelType", channelTypeSchema);

export default channelTypeModel;
