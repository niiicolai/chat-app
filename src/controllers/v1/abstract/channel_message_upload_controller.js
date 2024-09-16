import authMiddleware from '../../../middlewares/auth_middleware.js';
import errorHandler from '../../_error_handler.js';
import express from 'express';

export default (crudService) => {
    const router = express.Router();
    const ctrl = { router };

    ctrl.findOne = () => {
        router.get('/channel_message_upload/:channel_message_upload_uuid', [authMiddleware], async (req, res) => {
            await errorHandler(res, async () => {
                const result = await crudService.findOne({ channel_message_upload_uuid: req.params.channel_message_upload_uuid, user: req.user });
                res.json(result);
            });
        });
    }

    ctrl.findAll = () => {
        router.get('/channel_message_uploads', [authMiddleware], async (req, res) => {
            await errorHandler(res, async () => {
                const { page, limit } = req.query;
                const result = await crudService.findAll({ page, limit, user: req.user, channel_message_uuid: req.query.channel_message_uuid });
                res.json(result);
            });
        });
    }

    ctrl.destroy = () => {
        router.delete('/channel_message_upload/:channel_message_upload_uuid', [authMiddleware], async (req, res) => {
            await errorHandler(res, async () => {
                await crudService.delete({ channel_message_upload_uuid: req.params.channel_message_upload_uuid, user: req.user });
                res.sendStatus(204);
            });
        });
    }

    return ctrl;
};
