import errorHandler from '../../_error_handler.js';
import express from 'express';
import authMiddleware from '../../../middlewares/auth_middleware.js';

export default (crudService) => {
    const router = express.Router();
    const ctrl = { router };

    ctrl.resend = () => {
        router.post('/user_email_verification/me/resend', [authMiddleware], async (req, res) => {
            await errorHandler(res, async () => {
                await crudService.resend({ user: req.user });
                res.sendStatus(204);
            });
        });
    }

    ctrl.confirm = () => {
        router.patch('/user_email_verification/:uuid/confirm', [authMiddleware], async (req, res) => {
            await errorHandler(res, async () => {
                await crudService.confirm({ user: req.user, uuid: req.params.uuid });
                res.sendStatus(204);
            });
        });
    }

    return ctrl;
};
