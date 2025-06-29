import dotenv from 'dotenv';
dotenv.config();

export const config = {
    MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/algorave',
    SECRET_KEY: process.env.SECRET_KEY || 'algorave_jwt_secret_key_2024_secure_and_random',
    PORT: process.env.PORT || 5000,
    NODE_ENV: process.env.NODE_ENV || 'development'
}; 