import BaseController from './base_controller.js';
import crudService from '../../services/user_service.js';

// Create a new controller
const controller = new BaseController({
    crudService,
    auth: {
        _index: true,
        _new: false,
        _create: false,
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

// Define custom routes
controller.defineCustomRoute('get', '/login', async (req, res) => {
    const data = req.body;
    const user = await crudService.login(data);
    res.json(user);
});

// Export the controller
export default controller;
