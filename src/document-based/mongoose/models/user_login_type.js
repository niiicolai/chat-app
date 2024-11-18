import mongoose from "mongoose";

export const userLoginTypeSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true
    }
}, {
    timestamps: {
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    }
});

const userLoginTypeModel = mongoose.model("UserLoginType", userLoginTypeSchema);

export default userLoginTypeModel;
