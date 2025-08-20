const form = document.getElementById('login-form');
const email = document.getElementById('email');
const password = document.getElementById('password');
const feedback = document.getElementById('form-feedback');
const submitBtn = document.getElementById('submitBtn');

function setFeedback(msg, type='success'){
  feedback.textContent = msg;
  feedback.className = `feedback ${type}`;
}

function isValidEmail(value){
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

form?.addEventListener('submit', async (e) => {
  e.preventDefault();
  setFeedback('');

  const vEmail = email.value.trim();
  const vPass = password.value;

  if(!vEmail){
    setFeedback('Veuillez saisir votre email.', 'error');
    email.focus();
    return;
  }
  if(!isValidEmail(vEmail)){
    setFeedback('Format d’email invalide.', 'error');
    email.focus();
    return;
  }
  if(!vPass || vPass.length < 6){
    setFeedback('Le mot de passe doit contenir au moins 6 caractères.', 'error');
    password.focus();
    return;
  }

  submitBtn.disabled = true;

  try{
    // TODO: remplace par ton endpoint réel d’API quand il sera prêt
    // Exemple: const res = await fetch('http://localhost:3000/login', { ... })
    await new Promise(r => setTimeout(r, 500)); // simulate
    setFeedback('Connexion réussie (simulation).', 'success');
  }catch(err){
    console.error(err);
    setFeedback('Erreur de connexion. Réessayez.', 'error');
  }finally{
    submitBtn.disabled = false;
  }
});
