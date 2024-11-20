import mongoose from "mongoose";

export default new mongoose.Schema({
    uuid: { 
        type: String, 
        required: true,
        index: true 
    },
    expires_at: { 
        type: Date, 
        required: false 
    },
}, {
    timestamps: {
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    }
});
