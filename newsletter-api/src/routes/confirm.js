const express = require('express');
const crypto = require('crypto');
const hashToken = require('../utils/hashToken');
const { getByConfirmToken, confirmByToken, setUnsubscribeTokenById } = require('../db');

const router = express.Router();

router.get('/confirm', (req, res) => {
  try {
    const tokenPlain = String(req.query.token || '');
    if (!tokenPlain) return res.redirect('/newsletter.html?confirm=invalid');

    const tokenHash = hashToken(tokenPlain);

    // on accepte soit le hash stocké, soit un stockage "clair" existant
    const sub = getByConfirmToken(tokenHash) || getByConfirmToken(tokenPlain);
    if (!sub) return res.redirect('/newsletter.html?confirm=invalid');

    const matching = (sub.confirm_token === tokenHash) ? tokenHash : tokenPlain;

    const { changes } = confirmByToken(matching);
    if (changes === 0) return res.redirect('/newsletter.html?confirm=expired');

    // Génère un token d’unsubscribe dédié : stocke le HASH, garde le CLAIR pour l’URL
    const unsubPlain = crypto.randomBytes(32).toString('hex');
    const unsubHash  = hashToken(unsubPlain);
    setUnsubscribeTokenById(sub.id, unsubHash);

    // Redirige vers la page avec le token d’unsubscribe en clair (ut=) pour one‑click
    // Encode toujours la valeur au cas où.
    return res.redirect(`/newsletter.html?confirm=ok&ut=${encodeURIComponent(unsubPlain)}`);
  } catch (err) {
    console.error('[CONFIRM]', err);
    return res.redirect('/newsletter.html?confirm=error');
  }
});

module.exports = router;
