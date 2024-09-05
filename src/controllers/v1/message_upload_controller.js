import UserResourceController from './_user_resource_controller.js';
import crudService from '../../services/message_upload_service.js';

const controller = new UserResourceController({ crudService });

controller.index();
controller.template();
controller.show();

export default controller;
