import originMiddleware from '../middlewares/origin_middleware.js';
import errorHandler from './_error_handler.js';
import express from 'express';

export default (crudService) => {
    const router = express.Router();
    const ctrl = { router };

    ctrl.findOne = () => {
        router.get('/channel_message_upload_type/:name', [originMiddleware], async (req, res) => {
            await errorHandler(res, async () => {
                const result = await crudService.findOne(req.params);
                res.json(result);
            });
        });
    }

    ctrl.findAll = () => {
        router.get('/channel_message_upload_types', [originMiddleware], async (req, res) => {
            await errorHandler(res, async () => {
                const { page, limit } = req.query;
                const result = await crudService.findAll({ page, limit });
                res.json(result);
            });
        });
    }

    return ctrl;
};
