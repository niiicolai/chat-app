import mongoose from "mongoose";

export default new mongoose.Schema({
    uuid: { 
        type: String, 
        required: true 
    },
    file_days_to_live: { 
        type: Number, 
        required: true 
    },
    total_files_bytes_allowed: { 
        type: Number, 
        required: true 
    },
    single_file_bytes_allowed: { 
        type: Number, 
        required: true 
    },
}, {
    timestamps: {
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    }
});
