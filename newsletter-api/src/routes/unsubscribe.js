const express = require('express');
const hashToken = require('../utils/hashToken');                          // <--- ajout
const { getByUnsubscribeToken, unsubscribeByToken } = require('../db');

const router = express.Router();

router.get('/unsubscribe', (req, res) => {
  const tokenPlain = String(req.query.token || '');
  if (!tokenPlain) return res.redirect('/newsletter.html?unsub=invalid');

  const tokenHash = hashToken(tokenPlain);

  const sub = getByUnsubscribeToken(tokenHash) || getByUnsubscribeToken(tokenPlain);
  if (!sub) return res.redirect('/newsletter.html?unsub=invalid');

  const matching = (sub.unsubscribe_token === tokenHash) ? tokenHash : tokenPlain;
  const { changes } = unsubscribeByToken(matching);
  if (changes === 0) return res.redirect('/newsletter.html?unsub=expired');

  return res.redirect('/newsletter.html?unsub=ok');
});

module.exports = router;
