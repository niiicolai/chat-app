import crudService from '../../services/room_invite_link_service.js';
import joinRoomService from '../../services/join_room_service.js';
import UserResourceController from './_user_resource_controller.js';

const controller = new UserResourceController({ crudService });

controller.index();
controller.template();
controller.create();
controller.show();
controller.update();
controller.destroy();

controller.defineCustomRoute('post', 'join_link/:uuid', async (req, res) => {
    const result = await joinRoomService.joinLink({
        uuid: req.params.uuid,
        user: req.user,
    });
    res.json(result);
}, true);

export default controller;
