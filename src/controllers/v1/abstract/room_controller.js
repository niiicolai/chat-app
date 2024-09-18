import errorHandler from '../../_error_handler.js';
import express from 'express';
import authMiddleware from '../../../middlewares/auth_middleware.js';
import multer from 'multer';

export default (crudService) => {
    const uploadMiddleware = multer({ storage: multer.memoryStorage() }).single('file');
    const router = express.Router();
    const ctrl = { router };

    ctrl.findOne = () => {
        router.get('/room/:room_uuid', [authMiddleware], async (req, res) => {
            await errorHandler(res, async () => {
                const { room_uuid } = req.params;
                const { user } = req;
                const result = await crudService.findOne({ room_uuid, user });
                res.json(result);
            });
        });
    }

    ctrl.findAll = () => {
        router.get('/rooms', [authMiddleware], async (req, res) => {
            await errorHandler(res, async () => {
                const { user } = req;
                const { page, limit } = req.query;
                const result = await crudService.findAll({ page, limit, user });
                res.json(result);
            });
        });
    }

    ctrl.create = () => {
        router.post('/room', [authMiddleware, uploadMiddleware], async (req, res) => {
            await errorHandler(res, async () => {
                const result = await crudService.create({ body: req.body, user: req.user, file: req.file });
                res.json(result);
            });
        });
    }

    ctrl.update = () => {
        router.patch('/room/:room_uuid', [authMiddleware, uploadMiddleware], async (req, res) => {
            await errorHandler(res, async () => {
                const result = await crudService.update({ room_uuid: req.params.room_uuid, body: req.body, user: req.user, file: req.file });
                res.json(result);
            });
        });
    }

    ctrl.editSettings = () => {
        router.patch('/room/:room_uuid/settings', [authMiddleware], async (req, res) => {
            await errorHandler(res, async () => {
                await crudService.editSettings({ room_uuid: req.params.room_uuid, body: req.body, user: req.user });
                res.sendStatus(204);
            });
        });
    }

    ctrl.leave = () => {
        router.delete('/room/:room_uuid/leave', [authMiddleware], async (req, res) => {
            await errorHandler(res, async () => {
                await crudService.leave({ room_uuid: req.params.room_uuid, user: req.user });
                res.sendStatus(204);
            });
        });
    }

    ctrl.destroy = () => {
        router.delete('/room/:room_uuid', [authMiddleware], async (req, res) => {
            await errorHandler(res, async () => {
                await crudService.destroy({ room_uuid: req.params.room_uuid, user: req.user });
                res.sendStatus(204);
            });
        });
    }

    return ctrl;
}
