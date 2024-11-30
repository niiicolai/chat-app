import originMiddleware from '../middlewares/origin_middleware.js';
import errorHandler from './_error_handler.js';
import express from 'express';

export default (crudService) => {
    const router = express.Router();
    const ctrl = { router };

    ctrl.findOne = () => {
        router.get('/room_category/:name', [originMiddleware], async (req, res) => {
            await errorHandler(res, async () => {
                const result = await crudService.findOne(req.params);
                res.json(result);
            });
        });
    }

    ctrl.findAll = () => {
        router.get('/room_categories', [originMiddleware], async (req, res) => {
            await errorHandler(res, async () => {
                const result = await crudService.findAll(req.query);
                res.json(result);
            });
        });
    }

    return ctrl;
};
