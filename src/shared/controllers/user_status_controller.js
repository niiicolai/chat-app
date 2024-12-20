import authMiddleware from '../middlewares/auth_middleware.js';
import originMiddleware from '../middlewares/origin_middleware.js';
import errorHandler from './_error_handler.js';
import express from 'express';

export default (crudService) => {
    const router = express.Router();
    const ctrl = { router };

    ctrl.findOne = () => {
        router.get('/user_status/me', [originMiddleware, authMiddleware], async (req, res) => {
            await errorHandler(res, async () => {
                const result = await crudService.findOne({ user_uuid: req.user.sub });
                res.json(result);
            });
        });
    }

    ctrl.update = () => {
        router.patch('/user_status/me', [originMiddleware, authMiddleware], async (req, res) => {
            await errorHandler(res, async () => {
                const result = await crudService.update({ body: req.body, user_uuid: req.user.sub });
                res.json(result);
            });
        });
    }

    return ctrl;
};
