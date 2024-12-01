import mongoose from "mongoose";

import RoomAudit from "./room_audit.js";
import { v4 as uuidv4 } from 'uuid';

const roomFileSchema = new mongoose.Schema({
    _id: mongoose.Schema.Types.UUID,
    src: { 
        type: mongoose.Schema.Types.String, 
        required: true 
    },
    size: { 
        type: mongoose.Schema.Types.Number, 
        required: true 
    },
    room: { 
        type: mongoose.Schema.Types.UUID, 
        ref: 'Room', 
        required: true 
    },
    room_file_type: { 
        type: mongoose.Schema.Types.String, 
        ref: 'RoomFileType',
        required: true 
    },
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
