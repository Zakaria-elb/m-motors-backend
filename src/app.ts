import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from './config';
import path from 'path';
import multer from 'multer';
import appointmentRoutes from './routes/appointments';

// Import des routeurs
import authRoutes from './routes/auth';
import vehicleRoutes from './routes/vehicles';
import dossierRoutes from './routes/dossiers';
import documentRoutes from './routes/documents';
import adminRoutes from './routes/admin';

const app = express();


// MIDDLEWARES 

app.use(helmet());
const allowedOrigins = [
  config.FRONTEND_URL,
  config.FRONTEND_URL?.replace(/\/$/, ''), // sans slash final
  'http://localhost:3000',
].filter(Boolean);

const allowedOrigins = [
  config.FRONTEND_URL,
  config.FRONTEND_URL?.replace(/\/$/, ''),
  'http://localhost:3000',
  /^https:\/\/m-motors-frontend.*\.vercel\.app$/,
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.some(o => o instanceof RegExp ? o.test(origin) : o === origin)) {
      return callback(null, true);
    }
    console.warn(`CORS rejeté pour origin: ${origin}`);
    return callback(new Error('Not allowed by CORS'), false);
  },
  credentials: true,
}));


app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//  fichiers uploadés 
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));


// ROUTES

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/auth', authRoutes);
app.use('/vehicles', vehicleRoutes);
app.use('/dossiers', dossierRoutes);
app.use('/documents', documentRoutes);
app.use('/admin', adminRoutes);
app.use('/appointments', appointmentRoutes);
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));



// GESTION GLOBALE  ERREURS 

app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (err instanceof multer.MulterError) {
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


const PORT = config.PORT;


if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`🚀 Serveur M-Motors démarré sur http://localhost:${PORT}`);
  });
}

export default app;
