import JwtService from '../services/jwt_service.js';

export default (req, res, next) => {
    const token = req.headers.authorization;
    if (!token) return res.status(401).json({message: 'Unauthorized'});

    if (!token.startsWith('Bearer ')) return res.status(401).json({message: 'Unauthorized'});
    token = token.slice(7, token.length);

    if (!JwtService.verify(token)) return res.status(401).json({message: 'Unauthorized'});

    next();
}
