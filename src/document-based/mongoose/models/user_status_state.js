import mongoose from "mongoose";

export const userStatusStateSchema = new mongoose.Schema({
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

const userStatusStateModel = mongoose.model("UserStatusState", userStatusStateSchema);

export default userStatusStateModel;
