import mongoose from "mongoose";

const roomAuditSchema = new mongoose.Schema({
    uuid: { 
        type: String, 
        required: true,
        unique: true 
    },
    body: { 
        type: String, 
        required: true 
    },
    room: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Room', 
        required: false 
    },
    room_audit_type: {
        type: String,
        required: true,
    }
}, {
    timestamps: {
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    }
});

const RoomAudit = mongoose.model("RoomAudit", roomAuditSchema);

export default RoomAudit;
