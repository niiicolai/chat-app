import crudService from '../../services/room_setting_service.js';
import UserResourceController from './_user_resource_controller.js';

const controller = new UserResourceController({ crudService });

controller.index();
controller.template();
controller.show();
controller.update();

export default controller;
