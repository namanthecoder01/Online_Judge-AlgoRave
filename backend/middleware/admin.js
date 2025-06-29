import jwt from 'jsonwebtoken';
import User from '../model/User.js';
import { config } from '../config.js';

const adminMiddleware = async (req, res, next) => {
    try {
        const authHeader = req.header('Authorization');
        const token = authHeader?.replace('Bearer ', '');
        if (!token) {
            return res.status(401).json({ message: 'No token, authorization denied' });
        }
        const decoded = jwt.verify(token, config.SECRET_KEY);
        const user = await User.findById(decoded.id);
        if (!user || !user.isAdmin) {
            return res.status(403).json({ message: 'Access denied: Admins only' });
        }
        req.user = user;
        next();
    } catch (err) {
        console.error('Admin middleware error:', err);
        return res.status(401).json({ message: 'Token is not valid' });
    }
};

export default adminMiddleware; 