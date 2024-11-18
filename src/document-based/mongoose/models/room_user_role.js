import mongoose from "mongoose";

export const roomUserRoleSchema = new mongoose.Schema({
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

const roomUserRoleModel = mongoose.model("RoomUserRole", roomUserRoleSchema);

export default roomUserRoleModel;
