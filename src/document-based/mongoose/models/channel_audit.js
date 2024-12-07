import mongoose from "mongoose";

const channelAuditSchema = new mongoose.Schema({
    _id: mongoose.Schema.Types.UUID,
    body: { 
        type: mongoose.Schema.Types.String, 
        required: true 
    },
    channel: { 
        type: mongoose.Schema.Types.UUID, 
        ref: 'Channel', 
        required: true 
    },
    channel_audit_type: {
        type: mongoose.Schema.Types.String,
        required: true,
    },
}, {
    timestamps: {
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    },
    autoCreate: false
});

export default mongoose.model("ChannelAudit", channelAuditSchema);
