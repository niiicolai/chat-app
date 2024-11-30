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
        router.get('/room/:uuid', [originMiddleware, authMiddleware], async (req, res) => {
            await errorHandler(res, async () => {
                const { uuid } = req.params;
                const { user } = req;
                const result = await crudService.findOne({ uuid, user });
                res.json(result);
            });
        });
    }

    ctrl.findAll = () => {
        router.get('/rooms', [originMiddleware, authMiddleware], async (req, res) => {
            await errorHandler(res, async () => {
                const { user } = req;
                const { page, limit } = req.query;
                const result = await crudService.findAll({ page, limit, user });
                res.json(result);
            });
        });
    }

    ctrl.create = () => {
        router.post('/room', [originMiddleware, csrfMiddleware, authMiddleware, uploadMiddleware], async (req, res) => {
            await errorHandler(res, async () => {
                const result = await crudService.create({ body: req.body, user: req.user, file: req.file });
                res.json(result);
            });
        });
    }

    ctrl.update = () => {
        router.patch('/room/:uuid', [originMiddleware, csrfMiddleware, authMiddleware, uploadMiddleware], async (req, res) => {
            await errorHandler(res, async () => {
                const result = await crudService.update({ uuid: req.params.uuid, body: req.body, user: req.user, file: req.file });
                res.json(result);
            });
        });
    }

    ctrl.editSettings = () => {
        router.patch('/room/:uuid/settings', [originMiddleware, csrfMiddleware, authMiddleware], async (req, res) => {
            await errorHandler(res, async () => {
                await crudService.editSettings({ uuid: req.params.uuid, body: req.body, user: req.user });
                res.sendStatus(204);
            });
        });
    }

    ctrl.leave = () => {
        router.delete('/room/:uuid/leave', [originMiddleware, csrfMiddleware, authMiddleware], async (req, res) => {
            await errorHandler(res, async () => {
                await crudService.leave({ uuid: req.params.uuid, user: req.user });
                res.sendStatus(204);
            });
        });
    }

    ctrl.destroy = () => {
        router.delete('/room/:uuid', [originMiddleware, csrfMiddleware, authMiddleware], async (req, res) => {
            await errorHandler(res, async () => {
                await crudService.destroy({ uuid: req.params.uuid, user: req.user });
                res.sendStatus(204);
            });
        });
    }

    return ctrl;
}
