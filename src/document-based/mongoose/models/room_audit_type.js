import mongoose from "mongoose";

export const roomAuditTypeSchema = new mongoose.Schema({
    name: { 
        type: String, 
        required: true,
        index: true
    },
}, {
    timestamps: {
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    }
});

const roomAuditTypeModel = mongoose.model("RoomAuditType", roomAuditTypeSchema);

export default roomAuditTypeModel;
