"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const config_1 = require("./config");
const path_1 = __importDefault(require("path"));
const multer_1 = __importDefault(require("multer"));
const appointments_1 = __importDefault(require("./routes/appointments"));
// Import des routeurs
const auth_1 = __importDefault(require("./routes/auth"));
const vehicles_1 = __importDefault(require("./routes/vehicles"));
const dossiers_1 = __importDefault(require("./routes/dossiers"));
const documents_1 = __importDefault(require("./routes/documents"));
const admin_1 = __importDefault(require("./routes/admin"));
const app = (0, express_1.default)();

// MIDDLEWARES 

app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({
    origin: config_1.config.FRONTEND_URL,
    credentials: true,
}));
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));

app.use('/uploads', express_1.default.static(path_1.default.join(__dirname, '../uploads')));

// ROUTES

app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
app.use('/auth', auth_1.default);
app.use('/vehicles', vehicles_1.default);
app.use('/dossiers', dossiers_1.default);
app.use('/documents', documents_1.default);
app.use('/admin', admin_1.default);
app.use('/appointments', appointments_1.default);

// GESTION GLOBALE DES ERREURS 


app.use((err, req, res, next) => {
    if (err instanceof multer_1.default.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ message: 'Fichier trop volumineux (max 10 Mo)' });
        }
        return res.status(400).json({ message: err.message });
    }
    if (err) {
        console.error('❌ ERREUR GLOBALE:', err);
        return res.status(500).json({ message: err.message || 'Erreur serveur' });
    }
    next();
});

// DÉMARRAGE

const PORT = config_1.config.PORT;
app.listen(PORT, () => {
    console.log(`🚀 Serveur M-Motors démarré sur http://localhost:${PORT}`);
});
