import mongoose from "mongoose";

const roomUserRoleSchema = new mongoose.Schema({
    _id: mongoose.Schema.Types.String,
}, {
    timestamps: {
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    },
    autoCreate: false
});

const roomUserRoleModel = mongoose.model("RoomUserRole", roomUserRoleSchema);

export default roomUserRoleModel;
