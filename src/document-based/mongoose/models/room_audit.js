import mongoose from "mongoose";

const roomAuditSchema = new mongoose.Schema({
    _id: mongoose.Schema.Types.UUID,
    body: { 
        type: String, 
        required: true 
    },
    room: { 
        type: mongoose.Schema.Types.UUID, 
        ref: 'Room', 
        required: false 
    },
    room_audit_type: {
        type: mongoose.Schema.Types.String,
        required: true,
    }
}, {
    timestamps: {
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    },
    autoCreate: false
});

const RoomAudit = mongoose.model("RoomAudit", roomAuditSchema);

export default RoomAudit;
