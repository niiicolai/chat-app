import mongoose from "mongoose";

export const channelAuditTypeSchema = new mongoose.Schema({
    name: { 
        type: String, 
        required: true,
        unique: true
    },
}, {
    timestamps: {
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    }
});

const ChannelAuditType = mongoose.model("ChannelAuditType", channelAuditTypeSchema);

export default ChannelAuditType;
