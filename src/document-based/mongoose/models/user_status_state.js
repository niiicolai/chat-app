import mongoose from "mongoose";

const userStatusStateSchema = new mongoose.Schema({
    _id: mongoose.Schema.Types.String,
}, {
    timestamps: {
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    },
    autoCreate: false
});

const userStatusStateModel = mongoose.model("UserStatusState", userStatusStateSchema);

export default userStatusStateModel;
