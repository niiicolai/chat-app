import mongoose from "mongoose";

export default new mongoose.Schema({
    uuid: { 
        type: String, 
        required: true 
    },
    is_verified: { 
        type: Boolean, 
        required: true 
    },
}, {
    timestamps: {
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    }
});
