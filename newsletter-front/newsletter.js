const banner = document.getElementById('nl-banner');
const unsubLink = document.getElementById('unsubLink');

function show(msg, type = 'success') {
  if (!banner) return;
  banner.className = `nl-banner ${type}`;
  banner.textContent = msg;
}

const q = new URLSearchParams(location.search);
const ut = q.get('ut');      // token clair pour one‑click unsubscribe
const unsub = q.get('unsub'); // feedback après redirection

// 1) Active le one‑click si on a le token
if (ut && unsubLink) {
  unsubLink.href = `/unsubscribe?token=${encodeURIComponent(ut)}`;
  unsubLink.rel = 'nofollow';
}

// 2) Affiche UNIQUEMENT les messages liés au désabonnement
if (unsub === 'ok') {
  show('Vous êtes bien désabonné(e).');
} else if (unsub === 'invalid') {
  show('Lien de désabonnement invalide ou expiré.', 'error');
} else if (unsub === 'expired') {
  show('Ce lien de désabonnement a déjà été utilisé.', 'error');
} else if (unsub === 'error') {
  show('Une erreur est survenue. Merci de réessayer.', 'error');
} else {
  banner?.classList.add('hidden'); // rien à afficher sinon (pas de message de confirmation)
}
