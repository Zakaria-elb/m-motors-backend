"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticateToken = authenticateToken;
exports.requireRole = requireRole;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const config_1 = require("../config");
// Middleware 1 : vérifie le token JWT
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // "Bearer TOKEN" → on garde TOKEN
    if (!token) {
        return res.status(401).json({ message: 'Token manquant' });
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, config_1.config.JWT_SECRET);
        req.user = {
            id: decoded.userId,
            email: decoded.email,
            role: decoded.role,
        };
        next(); // Tout est bon, on passe à la suite (la route)
    }
    catch (err) {
        return res.status(403).json({ message: 'Token invalide' });
    }
}
// Middleware 2 : vérifie le rôle (ex: ADMIN uniquement)
function requireRole(role) {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ message: 'Non authentifié' });
        }
        if (req.user.role !== role) {
            return res.status(403).json({ message: 'Accès refusé' });
        }
        next();
    };
}
