import mongoose from "mongoose";

export default new mongoose.Schema({
    uuid: { 
        type: String, 
        required: true 
    },
    max_users: { 
        type: Number, 
        required: true 
    },
}, {
    timestamps: {
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    }
});
