import authMiddleware from '../../../middlewares/auth_middleware.js';
import errorHandler from '../../_error_handler.js';
import express from 'express';

export default (crudService) => {
    const router = express.Router();
    const ctrl = { router };

    ctrl.findOne = () => {
        router.get(`/channel_audit/:channel_audit_uuid`, [authMiddleware], async (req, res) => {
            await errorHandler(res, async () => {
                const result = await crudService.findOne({ channel_audit_uuid: req.params.channel_audit_uuid, user: req.user });
                res.json(result);
            });
        });
    }

    ctrl.findAll = () => {
         router.get(`/channel_audits`, [authMiddleware], async (req, res) => {
            await errorHandler(res, async () => {
                const { page, limit } = req.query;
                const result = await crudService.findAll({ page, limit, user: req.user, channel_uuid: req.query.channel_uuid });
                res.json(result);
            });
        });
    }

    return ctrl;
};
