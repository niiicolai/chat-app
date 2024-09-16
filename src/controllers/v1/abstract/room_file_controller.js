import authMiddleware from '../../../middlewares/auth_middleware.js';
import errorHandler from '../../_error_handler.js';
import express from 'express';

export default (crudService) => {
    const router = express.Router();
    const ctrl = { router };

    ctrl.findOne = () => {
        router.get('/room_file/:room_file_uuid', [authMiddleware], async (req, res) => {
            await errorHandler(res, async () => {
                const result = await crudService.findOne({ room_file_uuid: req.params.room_file_uuid, user: req.user });
                res.json(result);
            });
        });
    }

    ctrl.findAll = () => {
        router.get('/room_files', [authMiddleware], async (req, res) => {
            await errorHandler(res, async () => {
                const { page, limit } = req.query;
                const result = await crudService.findAll({ page, limit, user: req.user, room_uuid: req.query.room_uuid });
                res.json(result);
            });
        });
    }

    ctrl.destroy = () => {
        router.delete('/room_file/:room_file_uuid', [authMiddleware], async (req, res) => {
            await errorHandler(res, async () => {
                await crudService.delete({ room_file_uuid: req.params.room_file_uuid, user: req.user });
                res.sendStatus(204);
            });
        });
    }

    return ctrl;
};
