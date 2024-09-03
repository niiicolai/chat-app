import crudService from '../../services/room_invite_link_service.js';
import UserResourceController from './_user_resource_controller.js';

const controller = new UserResourceController({ crudService });

controller.defineCustomRoute('post', 'join_link/:uuid', async (req, res) => {
    const result = await crudService.joinLink({
        uuid: req.params.uuid,
        user: req.user,
    });
    res.json(result);
}, true);

export default controller;
