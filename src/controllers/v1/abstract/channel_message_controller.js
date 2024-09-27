import errorHandler from '../../_error_handler.js';
import express from 'express';
import authMiddleware from '../../../middlewares/auth_middleware.js';
import multer from 'multer';

export default (crudService) => {
    const uploadMiddleware = multer({ storage: multer.memoryStorage() }).single('file');
    const router = express.Router();
    const ctrl = { router };

    ctrl.findOne = () => {
        router.get('/channel_message/:channel_message_uuid', [authMiddleware], async (req, res) => {
            await errorHandler(res, async () => {
                const result = await crudService.findOne({ channel_message_uuid: req.params.channel_message_uuid, user: req.user });
                res.json(result);
            });
        });
    }

    ctrl.findAll = () => {
        router.get('/channel_messages', [authMiddleware], async (req, res) => {
            await errorHandler(res, async () => {
                const { page, limit } = req.query;
                const result = await crudService.findAll({ page, limit, user: req.user, channel_uuid: req.query.channel_uuid });
                res.json(result);
            });
        });
    }

    ctrl.create = () => {
        router.post('/channel_message', [authMiddleware, uploadMiddleware], async (req, res) => {
            await errorHandler(res, async () => {
                const result = await crudService.create({ body: req.body, file: req.file, user: req.user });
                res.json(result);
            });
        });
    }

    ctrl.update = () => {
        router.patch('/channel_message/:channel_message_uuid', [authMiddleware], async (req, res) => {
            await errorHandler(res, async () => {
                const result = await crudService.update({ channel_message_uuid: req.params.channel_message_uuid, body: req.body, user: req.user });
                res.json(result);
            });
        });
    }

    ctrl.destroy = () => {
        router.delete('/channel_message/:channel_message_uuid', [authMiddleware], async (req, res) => {
            await errorHandler(res, async () => {
                await crudService.destroy({ channel_message_uuid: req.params.channel_message_uuid, user: req.user });
                res.sendStatus(204);
            });
        });
    }

    return ctrl;
}