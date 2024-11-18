import mongoose from "mongoose";

export const channelTypeSchema = new mongoose.Schema({
    name: { 
        type: String, 
        required: true 
    },
}, {
    timestamps: {
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    }
});

const channelTypeModel = mongoose.model("ChannelType", channelTypeSchema);

export default channelTypeModel;
