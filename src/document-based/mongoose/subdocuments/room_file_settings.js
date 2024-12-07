import mongoose from "mongoose";

export default new mongoose.Schema({
    _id: mongoose.Schema.Types.UUID,
    file_days_to_live: { 
        type: mongoose.Schema.Types.Number, 
        required: true 
    },
    total_files_bytes_allowed: { 
        type: mongoose.Schema.Types.Number, 
        required: true 
    },
    single_file_bytes_allowed: { 
        type: mongoose.Schema.Types.Number, 
        required: true 
    },
}, {
    timestamps: {
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    }
});
