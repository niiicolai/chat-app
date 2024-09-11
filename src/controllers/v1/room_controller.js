import crudService from '../../services/room_service.js';
import UserFileResourceController from '../user_file_resource_controller.js';

const controller = new UserFileResourceController({ crudService });

controller.index();
controller.template();
controller.create();
controller.show();
controller.update();
controller.destroy();

export default controller;
