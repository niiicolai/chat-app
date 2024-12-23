import authMiddleware from '../middlewares/auth_middleware.js';
import csrfMiddleware from '../middlewares/csrf_middleware.js';
import originMiddleware from '../middlewares/origin_middleware.js';
import errorHandler from './_error_handler.js';
import express from 'express';

export default (crudService) => {
    const router = express.Router();
    const ctrl = { router };

    ctrl.resend = () => {
        router.post('/user_email_verification/me/resend', [originMiddleware, csrfMiddleware, authMiddleware], async (req, res) => {
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
