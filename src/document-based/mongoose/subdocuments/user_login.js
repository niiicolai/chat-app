import mongoose from "mongoose";

export default new mongoose.Schema({
    _id: mongoose.Schema.Types.UUID,
    password: { 
        type: mongoose.Schema.Types.String, 
        required: false 
    },
    third_party_id: { 
        type: mongoose.Schema.Types.String, 
        required: false 
    },
    user_login_type: {
        type: mongoose.Schema.Types.String, 
        ref: 'UserLoginType',
        required: true 
    },
}, {
    timestamps: {
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    }
});
