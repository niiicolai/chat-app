import crudService from '../../services/user_room_service.js';
import UserResourceController from './_user_resource_controller.js';

const controller = new UserResourceController({ crudService });

controller.index();
controller.template();
controller.show();
controller.destroy();

export default controller;
