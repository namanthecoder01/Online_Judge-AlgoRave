import jwt from 'jsonwebtoken';
import { config } from '../config.js';

const authMiddleware = (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ success: false, message: "Authentication required" });
        }
        const decoded = jwt.verify(token, config.SECRET_KEY);
        req.user = { id: decoded.id, email: decoded.email };
        next();
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ success: false, message: "Invalid token" });
        }
        return res.status(500).json({ success: false, message: "Authentication error" });
    }
};

export default authMiddleware; 