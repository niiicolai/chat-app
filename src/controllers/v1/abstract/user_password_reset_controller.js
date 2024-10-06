import errorHandler from '../../_error_handler.js';
import express from 'express';

export default (crudService) => {
    const router = express.Router();
    const ctrl = { router };

    ctrl.create = () => {
        router.post('/user_password_reset', async (req, res) => {
            await errorHandler(res, async () => {
                const result = await crudService.create({ body: req.body });
                res.json(result);
            });
        });
    }

    ctrl.resetPassword = () => {
        router.patch('/user_password_reset/:uuid/reset_password', async (req, res) => {
            await errorHandler(res, async () => {
                const result = await crudService.resetPassword({ body: req.body });
                res.json(result);
            });
        });
    }

    return ctrl;
};
