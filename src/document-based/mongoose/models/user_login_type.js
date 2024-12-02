import mongoose from "mongoose";

const userLoginTypeSchema = new mongoose.Schema({
    _id: mongoose.Schema.Types.String,
}, {
    timestamps: {
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    },
    autoCreate: false
});

const userLoginTypeModel = mongoose.model("UserLoginType", userLoginTypeSchema);

export default userLoginTypeModel;
