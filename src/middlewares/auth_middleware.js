import JwtService from '../services/jwt_service.js';

export default (req, res, next) => {
    let token = req.headers.authorization;
    if (!token) return res.status(401).json({message: 'Unauthorized'});

    if (!token.startsWith('Bearer ')) return res.status(401).json({message: 'Unauthorized'});
    token = token.slice(7, token.length);

    const user = JwtService.verify(token);
    if (!user) return res.status(401).json({message: 'Unauthorized'});
    req.user = user;
    
    next();
}
