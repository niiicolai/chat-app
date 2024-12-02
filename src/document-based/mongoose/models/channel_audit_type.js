import mongoose from "mongoose";

const channelAuditTypeSchema = new mongoose.Schema({
    _id: mongoose.Schema.Types.String,
}, {
    timestamps: {
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    },
    autoCreate: false
});

const ChannelAuditType = mongoose.model("ChannelAuditType", channelAuditTypeSchema);

export default ChannelAuditType;
