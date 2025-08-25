// api/subscribe.js
const express = require('express');
const crypto = require('crypto');
const hashToken = require('../utils/hashToken');

const { getByEmail, insertPending } = require('../db');
const { sendConfirmEmail } = require('../mailer');
const rateLimitRedis = require('../middlewares/rateLimitRedis');

const router = express.Router();
const SHOW_PREVIEW = process.env.SHOW_CONFIRM_PREVIEW === '1';
const APP_URL = process.env.APP_URL || 'http://localhost:5050';

async function subscribeHandler(req, res) {
  const { email, firstName, lastName } = req.body || {};
  const isEmail = typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  if (!isEmail) return res.status(400).json({ error: 'Email invalide' });

  // ⚠️ si getByEmail est async, pense à await
  const existing = await getByEmail(email);
  if (existing && existing.status === 'confirmed') {
    return res.status(409).json({ error: 'Déjà inscrit' });
  }

  const tokenPlain = crypto.randomBytes(32).toString('hex');
  const tokenHash  = hashToken(tokenPlain);

  try {
    await insertPending({
      email, firstName, lastName,
      token: tokenHash,
      consentIp: req.ip,
      userAgent: req.headers['user-agent'],
    });

    // Mode "preview forcée" pour le dev : on ne tente même pas l’envoi
    if (SHOW_PREVIEW) {
      return res.status(202).json({
        ok: true,
        message: 'Inscription enregistrée. (Dev) Échec de l’envoi de l’email, utilisez le lien ci-dessous.',
        confirmPreview: `${APP_URL}/confirm?token=${tokenPlain}`
      });
    }

    let mailSent = true;
    try {
      await sendConfirmEmail(email, tokenPlain); // envoi réel
    } catch (mailErr) {
      mailSent = false;
      console.error('[MAILER] sendConfirmEmail failed:', mailErr);
    }

    if (mailSent) {
      // ✅ pas de lien de preview si l’email a été accepté par le SMTP
      return res.status(202).json({
        ok: true,
        message: 'Inscription enregistrée. Un email de confirmation vous a été envoyé.'
      });
    } else {
      // ⛑️ fallback : on donne le lien seulement en cas d’échec SMTP
      return res.status(202).json({
        ok: true,
        message: 'Inscription enregistrée. (Email non envoyé) — utilisez le lien de confirmation ci-dessous.',
        confirmPreview: `${APP_URL}/confirm?token=${tokenPlain}`
      });
    }

  } catch (e) {
    if (e.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return res.status(200).json({ ok: true, message: 'Demande déjà enregistrée. Vérifiez votre boîte mail.' });
    }
    console.error('[SUBSCRIBE] error:', e);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
}

router.post(
  '/subscribe',
  rateLimitRedis({ windowSec: 10 * 60, max: 5 }),
  rateLimitRedis({
    windowSec: 60 * 60, max: 3, prefix: 'rl-email',
    key: (req) => {
      const e = (req.body?.email || '').toLowerCase().trim();
      return e ? `subscribe:${e}` : `subscribe:ip:${req.ip}`;
    }
  }),
  subscribeHandler
);

module.exports = router;
