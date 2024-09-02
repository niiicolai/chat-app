import BaseController from './base_controller.js';
import crudService from '../../services/upload_type_service.js';

// Create a new controller
const controller = new BaseController({
    crudService,
    auth: {
        _index: false,
        _show: false,
    }
});

// Define the routes for the controller
controller._index();
controller._show();

// Export the controller
export default controller;
