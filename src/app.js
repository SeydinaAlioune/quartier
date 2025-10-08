const express = require('express');
const cors = require('cors');
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
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Fichiers statiques (public et uploads)
app.use(express.static(path.join(__dirname, '..', 'public')));
app.use('/uploads', express.static(path.join(__dirname, '..', 'public', 'uploads')));

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
