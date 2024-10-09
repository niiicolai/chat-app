
export default (req, res, next) => {
    if (process.env.DEBUG === 'true') 
        console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} 
    - body: ${JSON.stringify(req.body)} 
    - params: ${JSON.stringify(req.params)} 
    - query: ${JSON.stringify(req.query)} 
    - file: ${req.file ? req.file.originalname : 'null'}
    - headers: ${JSON.stringify(req.headers)} 
    - ip: ${req.ip}
    `);
    next();
}
