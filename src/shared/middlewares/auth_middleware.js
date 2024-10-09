import JwtService from '../services/jwt_service.js';

export default (req, res, next) => {
    const headers = req.headers;
    if (!headers) return res.status(401).json({message: 'Unauthorized'});

    const user = JwtService.getUserFromToken(headers);
    if (!user) return res.status(401).json({message: 'Unauthorized'});
    req.user = user;
    
    next();
}
