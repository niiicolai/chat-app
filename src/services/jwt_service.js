import jwt from 'jsonwebtoken';

const SECRET = process.env.JWT_SECRET;
const EXPIRE = process.env.JWT_EXPIRE; // 7d

export default class JwtService {
    constructor() {
    }

    static sign(sub) {
        const iat = Math.floor(Date.now() / 1000);
        const exp = iat + (60 * 60 * 24 * 7); // 7 days
        const payload = {
            sub,
            iat,
            exp
        };
        return jwt.sign(payload, SECRET);
    }

    static verify(token) {
        return jwt.verify(token, SECRET);
    }
}
