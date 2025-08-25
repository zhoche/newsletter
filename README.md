# Newsletter — Front + API

Petite application complète pour gérer l’inscription à une newsletter :
- **Front statique** (HTML/CSS/JS) avec pages `newsletter.html` et `login.html`.
- **API Node/Express** pour s’inscrire / confirmer / se désabonner.
- **SQLite** (better-sqlite3) pour stocker les abonnés.
- **Redis** (NoSQL) pour le **rate-limit** par IP et par email.
- **Nodemailer** (Mailtrap Sandbox) pour l’envoi des emails.
- **Tokens hashés (SHA-256)** en base (sécurité).


## 1 Prérequis
- **Node.js** ≥ 18
- **Redis** (local ou docker)
- Un compte **Mailtrap** (Sandbox) ou autre SMTP de test

### Installer / lancer Redis
brew install redis
brew services start redis
redis-cli ping


## 2 Configuration .env
PORT=5050
APP_URL=http://localhost:5050
FRONT_DIR=../newsletter-front

### SMTP (Mailtrap)
SMTP_HOST=sandbox.smtp.mailtrap.io
SMTP_PORT=2525
SMTP_USER=e8a75e5dc378e1
SMTP_PASS=8dd0fd591f47f4
MAIL_FROM="Willing <no-reply@willing.test>"

SHOW_CONFIRM_PREVIEW=0

### Emplacement DB
DATABASE_URL=./data/app.db

### Redis
REDIS_URL=redis://127.0.0.1:6379



## 3 Installation & démarrage
# backend
cd newsletter-api
npm i
npm run dev
➜ http://localhost:5050



## 4 Scripts utiles
npm run dev          # lance l’API (nodemon)
npm start            # node simple

# reset dev
rm -f newsletter-api/data/app.db
redis-cli FLUSHALL

# sauvegarde sqlite (exemple)
sqlite3 newsletter-api/data/app.db ".backup 'backups/app-$(date +%F).db'"
