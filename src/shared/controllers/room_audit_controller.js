import authMiddleware from '../middlewares/auth_middleware.js';
import originMiddleware from '../middlewares/origin_middleware.js';
import errorHandler from './_error_handler.js';
import express from 'express';

export default (crudService) => {
    const router = express.Router();
    const ctrl = { router };

    ctrl.findOne = () => {
        router.get('/room_audit/:uuid', [originMiddleware, authMiddleware], async (req, res) => {
            await errorHandler(res, async () => {
                const result = await crudService.findOne({ uuid: req.params.uuid, user: req.user });
                res.json(result);
            });
        });
    }

    ctrl.findAll = () => {
        router.get('/room_audits', [originMiddleware, authMiddleware], async (req, res) => {
            await errorHandler(res, async () => {
                const { page, limit } = req.query;
                const result = await crudService.findAll({ page, limit, user: req.user, room_uuid: req.query.room_uuid });
                res.json(result);
            });
        });
    }

    return ctrl;
};
