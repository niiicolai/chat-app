import mongoose from "mongoose";

export default new mongoose.Schema({
    uuid: { 
        type: String, 
        required: true 
    },
    rules_text: { 
        type: String, 
        required: true 
    },
}, {
    timestamps: {
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    }
});
