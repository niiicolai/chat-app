import UserResourceController from '../user_resource_controller.js';
import crudService from '../../services/message_upload_service.js';

const controller = new UserResourceController({ crudService });

controller.index();
controller.template();
controller.show();
controller.destroy();

controller.defineCustomRoute('get', 'bytes_used/:room_uuid', async (req, res) => {
    const room_uuid = req.params.room_uuid;
    const user = req.user;
    const bytes_used = await crudService.sumByRoomUuid({ room_uuid, field: 'size', user });
    res.json({ bytes_used });
}, true);

export default controller;
