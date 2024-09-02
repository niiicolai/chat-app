import BaseController from './base_controller.js';
import crudService from '../../services/room_invite_link_service.js';

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
controller._create();
controller._show();
controller._update();
controller._destroy();

// Export the controller
export default controller;
