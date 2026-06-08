# 🚀 W&K Creation - Guide de Test Local

## 📋 Architecture

```
index.html (Inscription)
    ↓
paiement.html (Choix paiement FedaPay)
    ↓
Server.js (Webhooks & API)
    ↓
Supabase (Base de données)
    ↓
confirmation.html (Message final)
```

---

## 🛠️ Installation & Démarrage

### **1️⃣ Installer les dépendances**

```bash
cd "c:\Users\Zenn\Documents\agence saas"
npm install
```

### **2️⃣ Configurer les variables d'environnement**

Éditer `.env` et vérifier :
```
PORT=3000
SUPABASE_URL=votre_url
SUPABASE_KEY=votre_clé
FEDAPAY_SECRET_KEY=sk_test_VhPQHXuoWcLNZWKhZJMSBNPa
```

### **3️⃣ Démarrer le serveur**

```bash
npm start
# Ou avec nodemon (rechargement automatique)
npm run dev
```

Output attendu :
```
🚀 Serveur démarré sur http://localhost:3000
📨 Webhook FedaPay: POST http://localhost:3000/webhook/fedapay
💳 Créer transaction: POST http://localhost:3000/api/create-transaction
📊 Historique: GET http://localhost:3000/api/paiements/:email
🧪 Test webhook: POST http://localhost:3000/api/test-webhook
```

---

## 🧪 Tests

### **Test 1 : Flux complet d'inscription**

1. Ouvrir `http://localhost:3000/index.html`
2. Remplir le formulaire d'inscription
3. Sélectionner un plan (Starter/Pro/Business)
4. Cocher CGV
5. Cliquer "Créer mon compte"
6. ✅ Devrait rediriger vers `paiement.html`

### **Test 2 : Page de paiement**

1. Sur `paiement.html` :
   - Vérifier que le plan et montant s'affichent
   - Vérifier que l'email est correct
   - Cliquer "Payer avec FedaPay"
2. En mode test FedaPay, utiliser numéros test :
   - **Téléphone** : 9999
   - **Code OTP** : 1234
3. ✅ Paiement devrait être confirmé

### **Test 3 : Webhook FedaPay**

```bash
# Depuis PowerShell/Terminal
curl -X POST http://localhost:3000/api/test-webhook

# Ou utiliser Postman :
POST http://localhost:3000/api/test-webhook
Headers: Content-Type: application/json
```

Vérifier dans la console :
```
🧪 Envoi du webhook de test...
✅ Paiement confirmé: ref_xxx - 15000 XOF
```

### **Test 4 : Historique des paiements**

1. Ouvrir `http://localhost:3000/historique.html`
2. Entrer l'email du client inscrit
3. Cliquer "Rechercher"
4. ✅ Affiche le paiement et le statut

### **Test 5 : Vérifier la mise à jour Supabase**

```sql
-- Dans Supabase SQL Editor
SELECT email, plan, statut, transaction_id, amount_paid, payment_date 
FROM clients 
WHERE email = 'test@example.com';

-- Devrait afficher :
-- statut: "actif" (après paiement)
-- transaction_id: "fedapay_xxxxx"
-- amount_paid: 15000
-- payment_date: 2025-06-08T14:30:00
```

---

## 📊 Schéma Supabase

Assurez-vous que votre table `clients` possède ces colonnes :

```sql
CREATE TABLE clients (
  id SERIAL PRIMARY KEY,
  email VARCHAR UNIQUE NOT NULL,
  prenom VARCHAR,
  nom VARCHAR,
  password VARCHAR,
  whatsapp VARCHAR,
  activite VARCHAR,
  description TEXT,
  plan VARCHAR,
  statut VARCHAR DEFAULT 'en_attente',
  transaction_id VARCHAR,
  amount_paid NUMERIC,
  payment_date TIMESTAMP,
  payment_status VARCHAR DEFAULT 'pending',
  payment_method VARCHAR,
  date_inscription TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## 🔌 Configuration FedaPay Webhooks

**En production**, configurer les webhooks FedaPay :

1. Aller sur https://dashboard.fedapay.com
2. Settings → Webhooks
3. Ajouter URL : `https://votre-domaine.com/webhook/fedapay`
4. Événements à cocher :
   - ✅ `transaction.success`
   - ✅ `transaction.failed`
   - ✅ `transaction.error`

---

## 🔐 Sécurité

### **À faire avant production**

1. ✅ Vérifier signatures FedaPay dans `server.js` (ligne ~50)
2. ✅ Passer les clés en variables d'environnement (`.env`)
3. ✅ Activer HTTPS
4. ✅ Ajouter rate limiting
5. ✅ Hasher les mots de passe dans Supabase
6. ✅ Ajouter authentification pour historique paiements

---

## 🐛 Dépannage

### **"Cannot GET /index.html"**
→ Vérifier que vous êtes sur `http://localhost:3000` pas `file://`

### **"CORS error"**
→ Vérifier que CORS est activé dans `server.js` (middleware CORS)

### **"Database error"**
→ Vérifier les clés Supabase dans `.env`

### **FedaPay modal ne s'ouvre pas**
→ Vérifier la clé API FedaPay dans `paiement.html` ligne ~110

### **Webhook ne reçoit pas les confirmations**
→ En mode test, utiliser `/api/test-webhook`
→ En production, configurer dans dashboard FedaPay

---

## 📁 Structure du projet

```
agence-saas/
├── index.html              (Page d'inscription)
├── paiement.html           (Page de paiement FedaPay)
├── confirmation.html       (Page de succès)
├── historique.html         (Historique des paiements)
├── server.js               (Backend Node.js)
├── package.json            (Dépendances)
├── .env                    (Variables d'environnement)
└── README.md               (Ce fichier)
```

---

## 🚀 Déploiement

### **Heroku**
```bash
git push heroku main
heroku config:set SUPABASE_URL=xxx FEDAPAY_SECRET_KEY=xxx
```

### **Vercel**
Utiliser serverless functions avec `/api` (nécessite refactoring)

### **Netlify**
Utiliser netlify-lambda ou netlify-functions

---

## 📞 Support

Pour les questions sur **FedaPay** : https://docs.fedapay.com
Pour les questions sur **Supabase** : https://supabase.com/docs

---

**Dernière mise à jour** : Juin 2025
