import CsrfService from "../services/csrf_service.js";

const WEBSITE_HOST = process.env.WEBSITE_HOST;
if (!WEBSITE_HOST) console.error('WEBSITE_HOST is not set in .env file');
const HOST_URL = new URL(WEBSITE_HOST);
const HOST = HOST_URL.host;

export default (req, res, next) => {
    // If the request is coming from the website host, allow it.
    if (req.headers.host === HOST) {
        return next();
    }

    const token = req.headers['x-csrf-token'];

    if (!token) {
        return res.status(403).send('Access denied');
    }

    if (!CsrfService.isValid(token)) {
        return res.status(403).send('Access denied');
    }

    next();
}
