"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
exports.config = {
    PORT: process.env.PORT || '3001',
    DATABASE_URL: process.env.DATABASE_URL || '',
    JWT_SECRET: process.env.JWT_SECRET || 'default-secret',
    FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3000',
    AWS_BUCKET_NAME: process.env.AWS_BUCKET_NAME || '',
    AWS_REGION: process.env.AWS_REGION || 'eu-west-3',
};
