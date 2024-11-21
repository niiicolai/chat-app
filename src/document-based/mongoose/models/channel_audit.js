import mongoose from "mongoose";

const channelAuditSchema = new mongoose.Schema({
    uuid: { 
        type: String, 
        required: true,
        unique: true 
    },
    body: { 
        type: String, 
        required: true 
    },
    channel: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Channel', 
        required: true 
    },
    channel_audit_type: {
        type: String,
        required: true,
    },
}, {
    timestamps: {
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    }
});

export default mongoose.model("ChannelAudit", channelAuditSchema);
