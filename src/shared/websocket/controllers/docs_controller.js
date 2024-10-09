import errorHandler from '../../controllers/_error_handler.js';
import html from './docs_html.js';
import express from 'express';

const router = express.Router();

router.get('/websocket/api-docs', async (req, res) => {
    await errorHandler(res, async () => {
        res.send(html);
    });
});

export default router;
