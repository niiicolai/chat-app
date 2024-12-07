
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS?.split(',');
if (!ALLOWED_ORIGINS) console.error('ALLOWED_ORIGINS is not set in .env file');

const WEBSITE_HOST = process.env.WEBSITE_HOST;
if (!WEBSITE_HOST) console.error('WEBSITE_HOST is not set in .env file');
const HOST_URL = new URL(WEBSITE_HOST);
const HOST = HOST_URL.host;

export default (req, res, next) => {
    const origin = req.headers.host;
    const referer = req.headers.referer;

    if (origin) {
        if (origin === HOST) return next();
        if (ALLOWED_ORIGINS.includes(origin)) return next();
    }
    
    if (referer) {
        const refererUrl = new URL(referer);
        const refererHost = refererUrl.origin;

        if (refererHost === HOST) return next();
        if (ALLOWED_ORIGINS.includes(refererHost)) return next();
    }
    
    res.status(403).send('Access denied');
}
