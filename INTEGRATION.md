<!-- 
  INTÉGRATION FÉDAPAY - Guide Complet
  Fichier d'aide pour intégrer tous les éléments
-->

# 🔧 INTÉGRATION FEDAPAY - Guide Technique

## 📋 Table des matières

1. [Architecture](#architecture)
2. [Flux de paiement](#flux-de-paiement)
3. [Configuration](#configuration)
4. [API Endpoints](#api-endpoints)
5. [Webhooks](#webhooks)
6. [Codes d'erreur](#codes-derreur)
7. [Sécurité](#sécurité)
8. [FAQ](#faq)

---

## 🏗️ Architecture

```
┌─────────────────────┐
│   Frontend (HTML)   │
│  index.html         │
│  paiement.html      │
│  confirmation.html  │
│  historique.html    │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Backend (Node.js)  │
│  server.js          │
│  Express + CORS     │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Services           │
│  ├─ Supabase (DB)   │
│  ├─ FedaPay (Pay)   │
│  └─ Webhooks        │
└─────────────────────┘
```

---

## 💳 Flux de paiement

### **Étape 1 : Inscription**
```
User → index.html 
→ Remplit formulaire 
→ Click "Créer mon compte"
→ Validation côté client
→ Création client dans Supabase (statut: "en_attente")
→ Stockage données dans sessionStorage
→ Redirection vers paiement.html
```

**Code** (index.html) :
```javascript
const clientData = {
  email: email,
  prenom: prenom,
  plan: plan,
  amount: parseFloat(document.querySelector('input[name="plan"]:checked').dataset.price)
};
sessionStorage.setItem('clientData', JSON.stringify(clientData));
window.location.href = 'paiement.html';
```

### **Étape 2 : Initialisation du paiement**
```
User → paiement.html
→ Récupère données sessionStorage
→ Affiche résumé (plan, montant, email)
→ Click "Payer avec FedaPay"
→ Appel API backend: POST /api/create-transaction
→ Backend retourne objet transaction
→ Frontend ouvre modal FedaPay
```

**Code** (server.js) :
```javascript
app.post('/api/create-transaction', async (req, res) => {
  const { email, amount, plan, prenom } = req.body;
  const transaction = {
    id: 'txn_' + Date.now(),
    reference: 'ref_' + Math.random().toString(36).substr(2, 9),
    amount: amount,
    currency: 'XOF'
  };
  res.json({ success: true, transaction });
});
```

### **Étape 3 : Paiement FedaPay**
```
Modal FedaPay s'ouvre
→ User entre numéro: 9999 (test)
→ User entre OTP: 1234 (test)
→ FedaPay traite paiement
→ Événement "success" ou "error"
```

**Code** (paiement.html) :
```javascript
FedaPay.ui.modal.open({
  transaction: transaction,
  onClose: function() { /* Annulé */ },
});

transaction.on('success', function() {
  handlePaymentSuccess(transaction.id);
});
```

### **Étape 4 : Confirmation Webhook**
```
Frontend → Backend: POST /webhook/fedapay
Payload: {
  event: "transaction.success",
  data: { id, reference, amount, customer }
}
→ Backend appelle Supabase
→ Update clients SET statut="actif" WHERE email=...
→ Backend retourne { success: true }
```

**Code** (server.js) :
```javascript
app.post('/webhook/fedapay', async (req, res) => {
  const { event, data } = req.body;
  
  if (event === 'transaction.success') {
    await db.from('clients').update({
      statut: 'actif',
      transaction_id: data.id,
      amount_paid: data.amount,
      payment_date: new Date().toISOString()
    }).eq('email', data.customer.email);
    
    return res.json({ success: true });
  }
});
```

### **Étape 5 : Confirmation utilisateur**
```
Frontend reçoit réponse webhook
→ Affiche message succès
→ Nettoie sessionStorage
→ Redirection vers confirmation.html
→ Message final + Checklist
```

---

## ⚙️ Configuration

### **Fichier .env**

```env
# Server
PORT=3000
NODE_ENV=development

# Supabase
SUPABASE_URL=https://upaewkcazpvidzlwfttj.supabase.co
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3M...

# FedaPay (Mode Test)
FEDAPAY_PUBLIC_KEY=pk_test_abcd1234efgh5678
FEDAPAY_SECRET_KEY=sk_test_VhPQHXuoWcLNZWKhZJMSBNPa

# Webhooks
WEBHOOK_SECRET=your_webhook_secret_key_here

# API
API_BASE_URL=http://localhost:3000
```

### **Supabase - Table clients**

```sql
CREATE TABLE clients (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  email VARCHAR(255) UNIQUE NOT NULL,
  prenom VARCHAR(100),
  nom VARCHAR(100),
  password VARCHAR(255),
  whatsapp VARCHAR(20),
  activite VARCHAR(100),
  description TEXT,
  plan VARCHAR(50),
  statut VARCHAR(50) DEFAULT 'en_attente',
  transaction_id VARCHAR(100),
  amount_paid NUMERIC(10, 2),
  payment_date TIMESTAMP,
  payment_status VARCHAR(50),
  payment_method VARCHAR(50),
  date_inscription TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Index pour recherches rapides
CREATE INDEX idx_clients_email ON clients(email);
CREATE INDEX idx_clients_statut ON clients(statut);
CREATE INDEX idx_clients_transaction_id ON clients(transaction_id);
```

---

## 🔌 API Endpoints

### **1. POST /api/create-transaction**

Crée une transaction FedaPay

**Request** :
```json
{
  "email": "user@example.com",
  "amount": 15000,
  "plan": "starter",
  "prenom": "Jean"
}
```

**Response** :
```json
{
  "success": true,
  "transaction": {
    "id": "txn_1234567890",
    "reference": "ref_abcd1234",
    "amount": 15000,
    "currency": "XOF",
    "description": "Abonnement starter - W&K Creation",
    "customer": {
      "email": "user@example.com",
      "firstname": "Jean"
    },
    "status": "pending"
  }
}
```

### **2. POST /webhook/fedapay**

Reçoit les confirmations FedaPay

**Request** :
```json
{
  "event": "transaction.success",
  "data": {
    "id": "txn_1234567890",
    "reference": "ref_abcd1234",
    "amount": 15000,
    "customer": {
      "email": "user@example.com"
    }
  }
}
```

**Response** :
```json
{
  "success": true,
  "message": "Payment confirmed"
}
```

### **3. GET /api/paiements/:email**

Récupère l'historique de paiement

**Request** :
```
GET /api/paiements/user@example.com
```

**Response** :
```json
{
  "success": true,
  "payment": {
    "transaction_id": "txn_1234567890",
    "amount_paid": 15000,
    "payment_date": "2025-06-08T14:30:00Z",
    "payment_status": "confirmed",
    "plan": "starter",
    "statut": "actif"
  }
}
```

### **4. POST /api/test-webhook**

Teste le webhook (développement uniquement)

**Request** :
```
POST /api/test-webhook
```

**Response** :
```json
{
  "success": true,
  "result": { "success": true, "message": "Payment confirmed" }
}
```

---

## 🔔 Webhooks

### **Configuration en Production**

1. **Dashboard FedaPay** → Settings → Webhooks
2. **Ajouter URL** : `https://votre-domaine.com/webhook/fedapay`
3. **Événements à cocher** :
   - ✅ `transaction.success`
   - ✅ `transaction.failed`
   - ✅ `transaction.error`
   - ✅ `transaction.pending`

### **Événements FedaPay**

| Événement | Statut Client | Action |
|-----------|---------------|--------|
| `transaction.success` | `actif` | ✅ Paiement confirmé |
| `transaction.pending` | `en_attente` | ⏱️ Attendre confirmation |
| `transaction.failed` | `paiement_échoué` | ❌ Paiement refusé |
| `transaction.error` | `paiement_échoué` | ❌ Erreur paiement |

### **Payload Webhook**

```javascript
// FedaPay envoie :
{
  "event": "transaction.success",
  "data": {
    "id": "txn_1234567890",
    "reference": "ref_abcd1234",
    "amount": 15000,
    "currency": {
      "iso": "XOF"
    },
    "status": "approved",
    "reason": null,
    "customer": {
      "id": 12345,
      "email": "user@example.com",
      "firstname": "Jean",
      "lastname": "Dupont",
      "phone": "+22507XXXXXXXX"
    },
    "approvals": [],
    "created_at": "2025-06-08T14:30:00Z",
    "updated_at": "2025-06-08T14:35:00Z"
  }
}
```

---

## ⚠️ Codes d'erreur

### **Frontend**

| Code | Message | Solution |
|------|---------|----------|
| 400 | Champs requis manquants | Remplir tous les champs |
| 401 | CGV non acceptées | Cocher les conditions |
| 409 | Email déjà utilisé | Utiliser autre email |
| 500 | Erreur serveur | Contacter support |

### **Backend**

| Code | Cause | Action |
|------|-------|--------|
| 401 | Signature webhook invalide | Vérifier clé secrète |
| 404 | Client introuvable | Vérifier email |
| 500 | Erreur Supabase | Vérifier connexion DB |

### **FedaPay**

| Code | Cause | Action |
|------|-------|--------|
| 1001 | Montant invalide | Montant > 0 |
| 1002 | Devise non supportée | Utiliser XOF |
| 1003 | Devise non supportée | Utiliser XOF |
| 9000 | Paiement annulé | User a annulé |
| 9001 | Erreur traitement | Réessayer |

---

## 🔐 Sécurité

### **À FAIRE AVANT PRODUCTION**

1. **Vérification signatures webhook**
```javascript
function verifyFedaPaySignature(req) {
  const signature = req.headers['x-fedapay-signature'];
  const payload = JSON.stringify(req.body);
  const hash = crypto
    .createHmac('sha256', FEDAPAY_SECRET)
    .update(payload)
    .digest('hex');
  return hash === signature;
}
```

2. **Hashage mots de passe Supabase**
```javascript
// AVANT insertion :
const hashedPassword = await bcrypt.hash(password, 10);
```

3. **Rate limiting**
```javascript
const rateLimit = require('express-rate-limit');
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});
app.use(limiter);
```

4. **HTTPS obligatoire**
```javascript
if (NODE_ENV === 'production' && !req.secure) {
  return res.redirect('https://' + req.headers.host + req.url);
}
```

5. **CORS restrictif**
```javascript
app.use(cors({
  origin: ['https://votre-domaine.com'],
  credentials: true
}));
```

---

## ❓ FAQ

### **Q : Comment tester localement sans domaine ?**
R : Utiliser `http://localhost:3000` en développement. Pour webhooks réels, utiliser service comme ngrok.

### **Q : Mon paiement n'a pas marqué le compte comme actif**
R : Vérifier que le webhook est reçu. Utiliser `/api/test-webhook` pour forcer la confirmation.

### **Q : Comment refund un paiement ?**
R : Aller dans dashboard FedaPay, trouver transaction, cliquer "Refund". Puis mettre à jour Supabase manuellement.

### **Q : Les statuts possibles sont ?**
R : `en_attente` (défaut), `actif` (payé), `paiement_échoué` (refusé), `suspendu` (retard)

### **Q : Comment changer la devise (XOF → EUR) ?**
R : Modifier dans `paiement.html` ligne 141 et vérifier support FedaPay pour devise.

### **Q : Peut-on avoir plusieurs paiements par client ?**
R : Oui, stocker dans table `transactions` séparée et boucle de renouvellement.

---

**Documentation complète FedaPay** : https://docs.fedapay.com
**Documentation Supabase** : https://supabase.com/docs
**Documentation Express.js** : https://expressjs.com

Dernière mise à jour : Juin 2025
