import errorHandler from '../../_error_handler.js';
import express from 'express';
import multer from 'multer';
import authMiddleware from '../../../middlewares/auth_middleware.js';

export default (crudService) => {
    const uploadMiddleware = multer({ storage: multer.memoryStorage() }).single('file');
    const router = express.Router();
    const ctrl = { router };

    ctrl.findOne = () => {
        router.get('/channel_webhook/:channel_webhook_uuid', [authMiddleware], async (req, res) => {
            await errorHandler(res, async () => {
                const result = await crudService.findOne({ channel_webhook_uuid: req.params.channel_webhook_uuid, user: req.user });
                res.json(result);
            });
        });
    }

    ctrl.findAll = () => {
        router.get('/channel_webhooks', [authMiddleware], async (req, res) => {
            await errorHandler(res, async () => {
                const { page, limit } = req.query;
                const result = await crudService.findAll({ page, limit, user: req.user, room_uuid: req.query.room_uuid });
                res.json(result);
            });
        });
    }

    ctrl.message = () => {
        router.post('/channel_webhook/:channel_webhook_uuid', async (req, res) => {
            await errorHandler(res, async () => {
                await crudService.message({ channel_webhook_uuid: req.params.channel_webhook_uuid, body: req.body });
                res.sendStatus(204);
            });
        });
    }

    ctrl.create = () => {
        router.post('/channel_webhook', [authMiddleware, uploadMiddleware], async (req, res) => {
            await errorHandler(res, async () => {
                const result = await crudService.create({ body: req.body, user: req.user, file: req.file });
                res.json(result);
            });
        });
    }

    ctrl.update = () => {
        router.patch('/channel_webhook/:channel_webhook_uuid', [authMiddleware, uploadMiddleware], async (req, res) => {
            await errorHandler(res, async () => {
                const result = await crudService.update({ body: req.body, channel_webhook_uuid: req.params.channel_webhook_uuid, user: req.user, file: req.file });
                res.json(result);
            });
        });
    }

    ctrl.destroy = () => {
        router.delete('/channel_webhook/:channel_webhook_uuid', [authMiddleware], async (req, res) => {
            await errorHandler(res, async () => {
                await crudService.destroy({ channel_webhook_uuid: req.params.channel_webhook_uuid, user: req.user });
                res.sendStatus(204);
            });
        });
    }

    return ctrl;
};
