import authMiddleware from '../middlewares/auth_middleware.js';
import errorHandler from './_error_handler.js';
import express from 'express';

export default (crudService) => {
    const router = express.Router();
    const ctrl = { router };

    ctrl.findOne = () => {
        router.get('/room_user/:uuid', [authMiddleware], async (req, res) => {
            await errorHandler(res, async () => {
                const result = await crudService.findOne({ uuid: req.params.uuid, user: req.user });
                res.json(result);
            });
        });
    }

    ctrl.findAuthenticatedUser = () => {
        router.get('/room_user/me/:room_uuid', [authMiddleware], async (req, res) => {
            await errorHandler(res, async () => {
                const result = await crudService.findAuthenticatedUser({ room_uuid: req.params.room_uuid, user: req.user });
                res.json(result);
            });
        });
    }

    ctrl.findAll = () => {
        router.get('/room_users', [authMiddleware], async (req, res) => {
            await errorHandler(res, async () => {
                const { page, limit } = req.query;
                const result = await crudService.findAll({ page, limit, user: req.user, room_uuid: req.query.room_uuid });
                res.json(result);
            });
        });
    }

    ctrl.update = () => {
        router.patch('/room_user/:uuid', [authMiddleware], async (req, res) => {
            await errorHandler(res, async () => {
                await crudService.update({ uuid: req.params.uuid, body: req.body, user: req.user });
                res.sendStatus(204);
            });
        });
    }

    ctrl.destroy = () => {
        router.delete('/room_user/:uuid', [authMiddleware], async (req, res) => {
            await errorHandler(res, async () => {
                await crudService.destroy({ uuid: req.params.uuid, user: req.user });
                res.sendStatus(204);
            });
        });
    }

    return ctrl;
};
