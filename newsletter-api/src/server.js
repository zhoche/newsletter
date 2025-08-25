// src/server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const { verifySMTP } = require('./mailer'); // <-- importe ici

const app = express();
const PORT = process.env.PORT || 5050;

const { connectRedis } = require('./redis');

app.set('trust proxy', 1);

// Middlewares globaux
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(morgan('dev'));

// Static front
const FRONT_DIR  = process.env.FRONT_DIR || path.join(process.cwd(), '..', 'newsletter-front');
const PUBLIC_DIR = path.join(FRONT_DIR, 'public');
app.use(express.static(FRONT_DIR));  // newsletter.html, login.html, css/js
app.use(express.static(PUBLIC_DIR)); // /images, /fonts, etc.

// API publiques
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));
app.get('/newsletter', (_,res) => res.sendFile(path.join(FRONT_DIR, 'newsletter.html')));
app.get('/login',      (_,res) => res.sendFile(path.join(FRONT_DIR, 'login.html')));

// Routes métier
app.use('/api', require('./routes/subscribe'));
app.use('/', require('./routes/confirm'));   // /confirm?token=...
app.use('/', require('./routes/unsubscribe')); // /unsubscribe?token=...
app.use('/api', require('./routes/request-unsubscribe'));


// 404 puis handler d'erreurs
app.use((req, res) => res.status(404).json({ error: 'Not found' }));
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

// Vérifie la config SMTP au démarrage (log "SMTP ready" si OK)
verifySMTP();

// Init Redis
connectRedis();

app.listen(PORT, () => console.log(`[newsletter-api] http://localhost:${PORT}`));
