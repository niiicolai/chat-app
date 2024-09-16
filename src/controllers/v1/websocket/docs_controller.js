import errorHandler from '../../_error_handler.js';
import express from 'express';
import html from './docs_html.js';

const router = express.Router();

router.get('/websocket/api-docs', async (req, res) => {
    await errorHandler(res, async () => {
        res.send(html);
    });
});

export default router;
