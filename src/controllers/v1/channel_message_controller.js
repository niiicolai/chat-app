import crudService from '../../services/channel_message_service.js';
import UserResourceController from './_user_resource_controller.js';

const controller = new UserResourceController({ crudService });

export default controller;
