import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from './config';
import path from 'path';

// Import des routeurs (on les créera juste après)
import authRoutes from './routes/auth';
import vehicleRoutes from './routes/vehicles';
import dossierRoutes from './routes/dossiers';
import documentRoutes from './routes/documents';
import adminRoutes from './routes/admin';

const app = express();

// ============================================
// MIDDLEWARES (traitement des requêtes)
// ============================================

// Helmet : ajoute des headers de sécurité (X-Content-Type-Options, etc.)
app.use(helmet());

// CORS : autorise le frontend à nous parler (sinon le navigateur bloque)
app.use(cors({
  origin: config.FRONTEND_URL,
  credentials: true,
}));

// express.json() : permet de lire le body JSON des requêtes POST/PATCH
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ============================================
// ROUTES (les endpoints de l'API)
// ============================================

// Health check : pour vérifier que le serveur répond
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
// Servir les fichiers uploadés (images véhicules, documents...)
app.use('/uploads', (req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  next();
}, express.static(path.join(__dirname, '../uploads')));


app.use('/auth', authRoutes);        // POST /auth/login, /auth/register
app.use('/vehicles', vehicleRoutes); // GET /vehicles, POST /vehicles, etc.
app.use('/dossiers', dossierRoutes); // GET /dossiers/mine, POST /dossiers
app.use('/documents', documentRoutes); // POST /documents (upload)
app.use('/admin', adminRoutes);      // GET /admin/dossiers, PATCH /admin/dossiers/:id/status

// ============================================
// DÉMARRAGE DU SERVEUR
// ============================================

const PORT = config.PORT;
app.listen(PORT, () => {
  console.log(`🚀 Serveur M-Motors démarré sur http://localhost:${PORT}`);
});
