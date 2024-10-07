import errorHandler from '../../_error_handler.js';
import express from 'express';
import authMiddleware from '../../../middlewares/auth_middleware.js';
import multer from 'multer';

export default (crudService) => {
    const uploadMiddleware = multer({ storage: multer.memoryStorage() }).single('file');
    const router = express.Router();
    const ctrl = { router };

    ctrl.findOne = () => {
        router.get(`/channel/:uuid`, [authMiddleware], async (req, res) => {
            await errorHandler(res, async () => {
                const result = await crudService.findOne({ uuid: req.params.uuid, user: req.user });
                res.json(result);
            });
        });
    }

    ctrl.findAll = () => {
        router.get('/channels', [authMiddleware], async (req, res) => {
            await errorHandler(res, async () => {
                const { page, limit } = req.query;
                const result = await crudService.findAll({ page, limit, user: req.user, room_uuid: req.query.room_uuid });
                res.json(result);
            });
        });
    }

    ctrl.create = () => {
        router.post('/channel', [authMiddleware, uploadMiddleware], async (req, res) => {
            await errorHandler(res, async () => {
                const result = await crudService.create({ body: req.body, file: req.file, user: req.user });
                res.json(result);
            });
        });
    }

    ctrl.update = () => {
        router.patch('/channel/:uuid', [authMiddleware, uploadMiddleware], async (req, res) => {
            await errorHandler(res, async () => {
                const result = await crudService.update({ uuid: req.params.uuid, file: req.file, body: req.body, user: req.user });
                res.json(result);
            });
        });
    }

    ctrl.destroy = () => {
        router.delete('/channel/:uuid', [authMiddleware], async (req, res) => {
            await errorHandler(res, async () => {
                await crudService.destroy({ uuid: req.params.uuid, user: req.user });
                res.sendStatus(204);
            });
        });
    }

    return ctrl;
}
