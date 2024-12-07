import authMiddleware from '../middlewares/auth_middleware.js';
import csrfMiddleware from '../middlewares/csrf_middleware.js';
import originMiddleware from '../middlewares/origin_middleware.js';
import errorHandler from './_error_handler.js';
import express from 'express';

export default (crudService) => {
    const router = express.Router();
    const ctrl = { router };

    ctrl.findOne = () => {
        router.get('/room_invite_link/:uuid', [originMiddleware, authMiddleware], async (req, res) => {
            await errorHandler(res, async () => {
                const result = await crudService.findOne({ uuid: req.params.uuid, user: req.user });
                res.json(result);
            });
        });
    }

    ctrl.findAll = () => {
        router.get('/room_invite_links', [originMiddleware, authMiddleware], async (req, res) => {
            await errorHandler(res, async () => {
                const { page, limit } = req.query;
                const result = await crudService.findAll({ page, limit, user: req.user, room_uuid: req.query.room_uuid });
                res.json(result);
            });
        });
    }

    ctrl.join = () => {
        router.post('/room_invite_link/:uuid/join', [originMiddleware, csrfMiddleware, authMiddleware], async (req, res) => {
            await errorHandler(res, async () => {
                await crudService.join({ uuid: req.params.uuid, user: req.user });
                res.sendStatus(204);
            });
        });
    }

    ctrl.create = () => {
        router.post('/room_invite_link', [originMiddleware, csrfMiddleware, authMiddleware], async (req, res) => {
            await errorHandler(res, async () => {
                const result = await crudService.create({ body: req.body, user: req.user });
                res.json(result);
            });
        });
    }

    ctrl.update = () => {
        router.patch('/room_invite_link/:uuid', [originMiddleware, csrfMiddleware, authMiddleware], async (req, res) => {
            await errorHandler(res, async () => {
                const result = await crudService.update({ uuid: req.params.uuid, body: req.body, user: req.user });
                res.json(result);
            });
        });
    }

    ctrl.destroy = () => {
        router.delete('/room_invite_link/:uuid', [originMiddleware, csrfMiddleware, authMiddleware], async (req, res) => {
            await errorHandler(res, async () => {
                await crudService.destroy({ uuid: req.params.uuid, user: req.user });
                res.sendStatus(204);
            });
        });
    }

    return ctrl;
};
