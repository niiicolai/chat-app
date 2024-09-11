import crudService from '../../services/channel_service.js';
import UserResourceController from '../user_resource_controller.js';

const controller = new UserResourceController({ crudService });

controller.index();
controller.template();
controller.create();
controller.show();
controller.update();
controller.destroy();

export default controller;
