import crudService from '../../services/channel_webhook_service.js';
import UserResourceController from '../user_resource_controller.js';

const controller = new UserResourceController({ crudService });

controller.index();
controller.template();
controller.create();
controller.show();
controller.update();
controller.destroy();

controller.defineCustomRoute('post', 'channel_webhook/:uuid', async (req, res) => {
    const event = await crudService.event({
        pk: req.params.uuid,
        body: req.body
    });
    res.json(event);
}, false);

export default controller;
