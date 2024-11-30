import authMiddleware from '../middlewares/auth_middleware.js';
import csrfMiddleware from '../middlewares/csrf_middleware.js';
import originMiddleware from '../middlewares/origin_middleware.js';
import errorHandler from './_error_handler.js';
import express from 'express';
import multer from 'multer';

export default (crudService) => {
    const uploadMiddleware = multer({ storage: multer.memoryStorage() }).single('file');
    const router = express.Router();
    const ctrl = { router };

    ctrl.findOne = () => {
        router.get('/channel_webhook/:uuid', [originMiddleware, authMiddleware], async (req, res) => {
            await errorHandler(res, async () => {
                const result = await crudService.findOne({ uuid: req.params.uuid, user: req.user });
                res.json(result);
            });
        });
    }

    ctrl.findAll = () => {
        router.get('/channel_webhooks', [originMiddleware, authMiddleware], async (req, res) => {
            await errorHandler(res, async () => {
                const { page, limit } = req.query;
                const result = await crudService.findAll({ page, limit, user: req.user, room_uuid: req.query.room_uuid });
                res.json(result);
            });
        });
    }

    ctrl.message = () => {
        router.post('/channel_webhook/:uuid', async (req, res) => {
            await errorHandler(res, async () => {
                await crudService.message({ uuid: req.params.uuid, body: req.body });
                res.sendStatus(204);
            });
        });
    }

    ctrl.create = () => {
        router.post('/channel_webhook', [originMiddleware, csrfMiddleware, authMiddleware, uploadMiddleware], async (req, res) => {
            await errorHandler(res, async () => {
                const result = await crudService.create({ body: req.body, user: req.user, file: req.file });
                res.json(result);
            });
        });
    }

    ctrl.update = () => {
        router.patch('/channel_webhook/:uuid', [originMiddleware, csrfMiddleware, authMiddleware, uploadMiddleware], async (req, res) => {
            await errorHandler(res, async () => {
                const result = await crudService.update({ body: req.body, uuid: req.params.uuid, user: req.user, file: req.file });
                res.json(result);
            });
        });
    }

    ctrl.destroy = () => {
        router.delete('/channel_webhook/:uuid', [originMiddleware, csrfMiddleware, authMiddleware], async (req, res) => {
            await errorHandler(res, async () => {
                await crudService.destroy({ uuid: req.params.uuid, user: req.user });
                res.sendStatus(204);
            });
        });
    }

    return ctrl;
};
