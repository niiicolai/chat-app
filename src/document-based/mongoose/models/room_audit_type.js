import mongoose from "mongoose";

const roomAuditTypeSchema = new mongoose.Schema({
    _id: mongoose.Schema.Types.String,
}, {
    timestamps: {
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    },
    autoCreate: false
});

const roomAuditTypeModel = mongoose.model("RoomAuditType", roomAuditTypeSchema);

export default roomAuditTypeModel;
