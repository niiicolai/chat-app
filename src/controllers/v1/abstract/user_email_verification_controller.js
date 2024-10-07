import errorHandler from '../../_error_handler.js';
import express from 'express';
import authMiddleware from '../../../middlewares/auth_middleware.js';

export default (crudService) => {
    const router = express.Router();
    const ctrl = { router };

    ctrl.resend = () => {
        router.post('/user_email_verification/me/resend', [authMiddleware], async (req, res) => {
            await errorHandler(res, async () => {
                const { sub: user_uuid } = req.user;
                await crudService.resend({ user_uuid });
                res.json({ message: 'Email verification sent' });
            });
        });
    }

    ctrl.confirm = () => {
        router.get('/user_email_verification/:uuid/confirm', [], async (req, res) => {
            await errorHandler(res, async () => {
                const { uuid } = req.params;
                await crudService.confirm({ uuid });
                res.json({ message: 'Email verified! You can close this page now.' });
            });
        });
    }

    return ctrl;
};
