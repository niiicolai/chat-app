import mongoose from "mongoose";

import { roomFileTypeSchema as room_file_type } from "./room_file_type.js";
import RoomAudit from "./room_audit.js";
import { v4 as uuidv4 } from 'uuid';

const roomFileSchema = new mongoose.Schema({
    uuid: { 
        type: String, 
        required: true,
        unique: true 
    },
    src: { 
        type: String, 
        required: true 
    },
    size: { 
        type: Number, 
        required: true 
    },
    room: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Room', 
        required: true 
    },
    room_file_type,
}, {
    timestamps: {
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    }
});

roomFileSchema.post('save', async (doc) => {
    const isNew = doc.created_at === doc.updated_at;
    await RoomAudit.create({
        uuid: uuidv4(),
        body: doc,
        room: doc.room,
        room_audit_type: (isNew ? 'FILE_CREATED' : 'FILE_EDITED'),
    });
});

roomFileSchema.post('remove', async (doc) => {
    await RoomAudit.create({
        uuid: uuidv4(),
        body: doc,
        room: doc.room,
        room_audit_type: 'FILE_DELETED',
    });
});

export default mongoose.model("RoomFile", roomFileSchema);
