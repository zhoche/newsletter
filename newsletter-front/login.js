// login.js — inscription newsletter
console.log('[newsletter] ready');

const form = document.getElementById('subscribe-form');
const emailEl = document.getElementById('email');
const firstEl = document.getElementById('firstname');
const lastEl  = document.getElementById('lastname');
const companyEl = document.getElementById('company');
const feedback = document.getElementById('form-feedback');
const submitBtn = document.getElementById('submitBtn');

function show(msg, type = 'info') {
  if (!feedback) return alert(msg);
  feedback.textContent = msg;
  feedback.className = `feedback ${type}`;
}

function isValidEmail(v) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

form?.addEventListener('submit', async (e) => {
  e.preventDefault();
  show(''); // clear

  const email = (emailEl?.value || '').trim();
  const firstName = (firstEl?.value || '').trim();
  const lastName  = (lastEl?.value  || '').trim();
  const company   = (companyEl?.value || '').trim();

  if (!email) {
    show('Veuillez saisir votre email.', 'error');
    emailEl?.focus();
    return;
  }
  if (!isValidEmail(email)) {
    show('Format d’email invalide.', 'error');
    emailEl?.focus();
    return;
  }

  submitBtn && (submitBtn.disabled = true);
  show('Envoi en cours…', 'info');

  try {
    const res = await fetch('/api/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      // adapte la casse des clés à ton backend (ici: email, firstName, lastName)
      body: JSON.stringify({ email, firstName, lastName, company })
    });

    const json = await res.json().catch(() => ({}));

    if (res.status === 200 || res.status === 202) {
      show(json.message || 'Inscription enregistrée. Vérifiez votre boîte mail.', 'success');
      form.reset();

      // utile en dev si l’email n’est pas réellement envoyé
      if (json.confirmPreview) {
        const br = document.createElement('br');
        const a = document.createElement('a');
        a.href = json.confirmPreview;
        a.target = '_blank';
        a.rel = 'noopener';
        a.textContent = 'Tester le lien de confirmation';
        feedback.appendChild(br);
        feedback.appendChild(a);
      }
    } else if (res.status === 409) {
      show('Cette adresse est déjà inscrite.', 'warn');
    } else if (res.status === 429) {
      const retry = res.headers.get('Retry-After');
      show(`Trop de tentatives. Réessayez${retry ? ` dans ${retry}s` : ''}.`, 'warn');
    } else if (res.status === 400) {
      show(json.error || 'Email invalide.', 'error');
    } else {
      show('Erreur serveur. Réessayez plus tard.', 'error');
    }
  } catch (err) {
    console.error(err);
    show('Impossible de contacter le serveur.', 'error');
  } finally {
    submitBtn && (submitBtn.disabled = false);
  }
});
