const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const postRoutes = require('./routes/post.routes');
const eventRoutes = require('./routes/event.routes');
const adminRoutes = require('./routes/admin.routes');
const serviceRoutes = require('./routes/services.routes');
const businessRoutes = require('./routes/business.routes');
const projectRoutes = require('./routes/projects.routes');
const donationRoutes = require('./routes/donation.routes');
const newsletterRoutes = require('./routes/newsletter.routes');
const notificationRoutes = require('./routes/notification.routes');
const mediaRoutes = require('./routes/media.routes');
const announcementRoutes = require('./routes/announcement.routes');
const securityRoutes = require('./routes/security.routes');
const securityConfigRoutes = require('./routes/securityConfig.routes');
const paymentsConfigRoutes = require('./routes/paymentsConfig.routes');
const projectsConfigRoutes = require('./routes/projectsConfig.routes');
const forumRoutes = require('./routes/forum.routes');
const usefulContactRoutes = require('./routes/usefulContact.routes');
const cityRoutes = require('./routes/city.routes');
const contactRoutes = require('./routes/contact.routes');

const app = express();

// Middleware
const parseCorsOrigins = () => {
  const raw = process.env.CORS_ORIGINS;
  if (typeof raw === 'string' && raw.trim()) {
    return raw.split(',').map((s) => s.trim()).filter(Boolean);
  }
  return [
    'https://quartier-b3o.pages.dev',
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://localhost:5173',
    'http://127.0.0.1:5173'
  ];
};

const allowedOrigins = parseCorsOrigins();

const isOriginAllowed = (origin) => {
  if (!origin) return true;
  if (allowedOrigins.includes(origin)) return true;

  try {
    const o = new URL(origin);
    return allowedOrigins.some((entry) => {
      if (!entry) return false;
      if (entry.startsWith('*.')) {
        const suffix = entry.slice(1);
        return o.hostname.endsWith(suffix);
      }
      return false;
    });
  } catch (e) {
    return false;
  }
};

const corsOptions = {
  origin: (origin, callback) => {
    if (isOriginAllowed(origin)) return callback(null, true);
    return callback(new Error('Not allowed by CORS'));
  },
  methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Range', 'X-Payments-Config-Token'],
  exposedHeaders: ['Content-Length', 'Content-Range', 'Accept-Ranges']
};

app.use(helmet({
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: false
}));
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Fichiers statiques (public et uploads)
app.use(express.static(path.join(__dirname, '..', 'public')));

const getUploadDir = () => {
  const fromEnv = process.env.UPLOAD_DIR;
  if (typeof fromEnv === 'string' && fromEnv.trim()) {
    return path.resolve(fromEnv.trim());
  }
  return path.join(__dirname, '..', 'public', 'uploads');
};

app.use('/uploads', express.static(getUploadDir(), {
  setHeaders: (res) => {
    // Aide la lecture vidéo cross-origin et la navigation par plages (Range)
    res.setHeader('Accept-Ranges', 'bytes');
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  }
}));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/business', businessRoutes);
// IMPORTANT: mount config before generic /api/projects to avoid /:id catching 'config'
app.use('/api/projects/config', projectsConfigRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/donations', donationRoutes);
app.use('/api/newsletter', newsletterRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/media', mediaRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/security', securityRoutes);
app.use('/api/security/config', securityConfigRoutes);
app.use('/api/payments/config', paymentsConfigRoutes);
app.use('/api/forum', forumRoutes);
app.use('/api/useful-contacts', usefulContactRoutes);
app.use('/api/city', cityRoutes);

// Gestion des erreurs
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Une erreur est survenue!' });
});

module.exports = app;
