import authMiddleware from '../middlewares/auth_middleware.js';
import csrfMiddleware from '../middlewares/csrf_middleware.js';
import originMiddleware from '../middlewares/origin_middleware.js';
import CsrfService from '../services/csrf_service.js';
import errorHandler from './_error_handler.js';
import express from 'express';
import multer from 'multer';

export default (crudService) => {
    const uploadMiddleware = multer({ storage: multer.memoryStorage() }).single('file');
    const router = express.Router();
    const ctrl = { router };

    ctrl.getUserLogins = () => {
        router.get('/user/me/logins', [originMiddleware, authMiddleware], async (req, res) => {
            await errorHandler(res, async () => {
                const result = await crudService.getUserLogins({ uuid: req.user.sub });
                res.json(result);
            });
        });
    }

    ctrl.findOne = () => {
        router.get('/user/me', [originMiddleware, authMiddleware], async (req, res) => {
            await errorHandler(res, async () => {
                const result = await crudService.findOne({ uuid: req.user.sub });
                res.json({...result, csrf: CsrfService.create()});
            });
        });
    }

    ctrl.create = () => {
        router.post('/user', [originMiddleware, uploadMiddleware], async (req, res) => {
            await errorHandler(res, async () => {
                const result = await crudService.create({ body: req.body, file: req.file });
                res.json(result);
            });
        });
    }

    ctrl.login = () => {
        router.post('/user/login', [originMiddleware], async (req, res) => {
            await errorHandler(res, async () => {
                const result = await crudService.login({ body: req.body });
                res.json(result);
            });
        });
    }

    ctrl.update = () => {
        router.patch('/user/me', [originMiddleware, csrfMiddleware, uploadMiddleware, authMiddleware], async (req, res) => {
            await errorHandler(res, async () => {
                const result = await crudService.update({ body: req.body, file: req.file, uuid: req.user.sub });
                res.json(result);
            });
        });
    }

    ctrl.destroy = () => {
        router.delete('/user/me', [originMiddleware, csrfMiddleware, authMiddleware], async (req, res) => {
            await errorHandler(res, async () => {
                await crudService.destroy({ uuid: req.user.sub });
                res.sendStatus(204);
            });
        });
    }

    ctrl.destroyAvatar = () => {
        router.delete('/user/me/avatar', [originMiddleware, csrfMiddleware, authMiddleware], async (req, res) => {
            await errorHandler(res, async () => {
                await crudService.destroyAvatar({ uuid: req.user.sub });
                res.sendStatus(204);
            });
        });
    }

    ctrl.destroyUserLogins = () => {
        router.delete('/user/me/login/:uuid', [originMiddleware, csrfMiddleware, authMiddleware], async (req, res) => {
            await errorHandler(res, async () => {
                await crudService.destroyUserLogins({ uuid: req.user.sub, login_uuid: req.params.uuid });
                res.sendStatus(204);
            });
        });
    }

    return ctrl;
};
