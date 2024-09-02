import BaseController from './base_controller.js';
import crudService from '../../services/message_upload_service.js';
import multer from 'multer';

// memory storage
const upload = multer({
    storage: multer.memoryStorage()
});

// Create a new controller
const controller = new BaseController({
    crudService,
    auth: {
        _index: true,
        _new: false,
        _create: true,
        _show: true,
        _update: true,
        _destroy: true
    }
});

// Define the routes for the controller
controller._index();
controller._new();
controller._create([upload.single('file')]);
controller._show();
controller._update([upload.single('file')]);
controller._destroy();

// Export the controller
export default controller;
