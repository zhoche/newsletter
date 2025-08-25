// mailer.js
const nodemailer = require('nodemailer');

const host = process.env.SMTP_HOST;
const port = Number(process.env.SMTP_PORT || 587);
const user = process.env.SMTP_USER;
const pass = process.env.SMTP_PASS;
const from = process.env.MAIL_FROM || 'Willing <no-reply@willing.test>';

const transporter = nodemailer.createTransport({
  host,
  port,
  secure: false, // Mailtrap: false (STARTTLS sur 2525)
  auth: { user, pass },
  logger: true,
  debug: true,
  // tls: { rejectUnauthorized: false } // décommente si environnement local très strict
});

console.log('[MAILER] Host:', host, 'Port:', port);
console.log('[MAILER] User prefix:', String(user || '').slice(0, 3) + '***');

async function verifySMTP() {
  try {
    await transporter.verify();
    console.log('[MAILER] SMTP ready');
  } catch (err) {
    console.error('[MAILER] SMTP verify failed:', err.message);
  }
}

/**
 * Envoi l'email de confirmation
 * @param {string} to               destinataire
 * @param {string} token            token de confirmation
 * @param {object} [opts]
 * @param {boolean} [opts.includeUnsub=false] inclure un lien de désabonnement
 * @param {string|null} [opts.unsubToken=null] token de désabonnement (si différent)
 */
async function sendConfirmEmail(to, token, opts = {}) {
  const { includeUnsub = false, unsubToken = null } = opts;
  const base = process.env.APP_URL || 'http://localhost:5050';
  const confirmUrl = `${base}/confirm?token=${token}`;
  const unsubUrl = includeUnsub
    ? `${base}/unsubscribe?token=${unsubToken || token}`
    : null;

  const html = `
    <p>Bonjour,</p>
    <p>Merci pour votre inscription.</p>
    <p><a href="${confirmUrl}">👉 Confirmer mon inscription</a></p>
    <p style="color:#6b7280;font-size:12px">Si le lien ne fonctionne pas : ${confirmUrl}</p>
    ${
      includeUnsub
        ? `<p style="color:#9CA3AF">Vous ne souhaitez plus recevoir nos messages ?
             <a href="${unsubUrl}">Cliquez ici pour vous désabonner</a>.
           </p>`
        : ''
    }
  `;

  return transporter.sendMail({
    from,
    to,
    subject: 'Confirmez votre inscription',
    text: `Bonjour,\n\nMerci pour votre inscription.\nConfirmez ici : ${confirmUrl}\n`,
    html
  });
}

async function sendUnsubscribeEmail(to, token) {
  const base = process.env.APP_URL || 'http://localhost:5050';
  const url = `${base}/unsubscribe?token=${token}`;
  return transporter.sendMail({
    from,
    to,
    subject: 'Lien de désabonnement',
    text: `Pour vous désabonner : ${url}`,
    html: `<p>Pour vous désabonner, cliquez ici :
             <a href="${url}">Se désabonner</a></p>
           <p style="color:#9CA3AF;font-size:12px">${url}</p>`
  });
}

module.exports = { transporter, verifySMTP, sendConfirmEmail, sendUnsubscribeEmail };
