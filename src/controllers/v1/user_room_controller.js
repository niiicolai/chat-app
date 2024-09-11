import crudService from '../../services/user_room_service.js';
import UserResourceController from '../user_resource_controller.js';

const controller = new UserResourceController({ crudService });

controller.index();
controller.template();
controller.update();
controller.show();
controller.destroy();

export default controller;
