const express = require('express');
const crypto = require('crypto');
const hashToken = require('../utils/hashToken');                       // <--- ajout
const { getByEmail, setUnsubscribeTokenById } = require('../db');
const { sendUnsubscribeEmail } = require('../mailer');

const router = express.Router();

router.post('/request-unsubscribe', async (req, res) => {
  const { email } = req.body || {};
  const isEmail = typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  if (!isEmail) return res.status(400).json({ error: 'Email invalide' });

  const sub = getByEmail(email);

  // Réponse neutre
  if (!sub || sub.status !== 'confirmed') {
    return res.status(202).json({ ok: true, message: 'Si un compte existe, un lien vous a été envoyé.' });
  }

  // Nouveau token : on stocke le hash et on envoie le clair
  const unsubPlain = crypto.randomBytes(32).toString('hex');
  const unsubHash  = hashToken(unsubPlain);
  setUnsubscribeTokenById(sub.id, unsubHash);

  try {
    await sendUnsubscribeEmail(email, unsubPlain);
  } catch (e) {
    console.error('[UNSUB-REQUEST] send mail failed:', e);
  }

  return res.status(202).json({ ok: true, message: 'Si un compte existe, un lien vous a été envoyé.' });
});

module.exports = router;
