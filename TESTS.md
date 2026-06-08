# 🧪 TESTS - W&K Creation

## 📊 Résumé des tests

| Test | Commande | Résultat attendu |
|------|----------|------------------|
| **1** | Test serveur | ✅ Serveur démarre sur port 3000 |
| **2** | Test inscription | ✅ Redirection vers paiement.html |
| **3** | Test paiement | ✅ Modal FedaPay s'ouvre |
| **4** | Test webhook | ✅ Paiement confirmé dans Supabase |
| **5** | Test historique | ✅ Affiche les paiements |

---

## 🚀 Étape 1 : Démarrer le serveur

```bash
cd "c:\Users\Zenn\Documents\agence saas"
npm install  # Si pas déjà fait
npm start
```

✅ Vous devriez voir :
```
🚀 Serveur démarré sur http://localhost:3000
📨 Webhook FedaPay: POST http://localhost:3000/webhook/fedapay
💳 Créer transaction: POST http://localhost:3000/api/create-transaction
📊 Historique: GET http://localhost:3000/api/paiements/:email
🧪 Test webhook: POST http://localhost:3000/api/test-webhook
```

---

## 🧪 Étape 2 : Test complet du flux

### **Test 2.1 : Inscription (index.html)**

1. Ouvrir : `http://localhost:3000/index.html`
2. Remplir le formulaire :
   ```
   Prénom : Jean
   Nom : Dupont
   Email : jean@example.com
   WhatsApp : +225 07 00 00 00 00
   Mot de passe : SecurePass123!
   Activité : Mode & Vêtements
   Description : Je vends des vêtements
   ```
3. Cocher "J'accepte les CGV"
4. Cliquer "Créer mon compte"

✅ **Résultat** : Redirection vers `paiement.html`

### **Test 2.2 : Page de paiement**

1. Sur `paiement.html` :
   - ✅ Plan affiché : "Starter"
   - ✅ Montant : "15 000 FCFA"
   - ✅ Email : "jean@example.com"

2. Cliquer "Payer avec FedaPay"
3. Modal FedaPay s'ouvre
4. Entrer numéro test FedaPay : `9999`
5. Entrer code OTP : `1234`

✅ **Résultat** : Redirection vers `confirmation.html`

---

## 🔧 Étape 3 : Test Webhook

### **Via Terminal PowerShell**

```powershell
# Tester le webhook
$body = @{
    event = "transaction.success"
    data = @{
        id = "txn_12345"
        reference = "ref_12345"
        amount = 15000
        customer = @{
            email = "jean@example.com"
        }
    }
} | ConvertTo-Json

Invoke-WebRequest -Uri "http://localhost:3000/webhook/fedapay" `
  -Method POST `
  -Headers @{"Content-Type"="application/json"} `
  -Body $body
```

### **Via cURL**

```bash
curl -X POST http://localhost:3000/webhook/fedapay \
  -H "Content-Type: application/json" \
  -d '{
    "event": "transaction.success",
    "data": {
      "id": "txn_12345",
      "reference": "ref_12345",
      "amount": 15000,
      "customer": {
        "email": "jean@example.com"
      }
    }
  }'
```

### **Via Postman**

1. Ouvrir Postman
2. Créer nouvelle requête POST
3. URL : `http://localhost:3000/webhook/fedapay`
4. Body (JSON) :
```json
{
  "event": "transaction.success",
  "data": {
    "id": "txn_12345",
    "reference": "ref_12345",
    "amount": 15000,
    "customer": {
      "email": "jean@example.com"
    }
  }
}
```

✅ **Résultat attendu** :
```
🔔 Webhook FedaPay reçu: {...}
✅ Paiement confirmé: ref_12345 - 15000 XOF
```

---

## 📊 Étape 4 : Vérifier Supabase

### **Vérifier l'insertion du client**

```sql
SELECT * FROM clients WHERE email = 'jean@example.com';
```

Devrait afficher :
| Colonne | Valeur |
|---------|--------|
| statut | `en_attente` (avant paiement) |
| plan | `starter` |
| amount_paid | NULL |
| transaction_id | NULL |

### **Après paiement (webhook)**

```sql
SELECT * FROM clients WHERE email = 'jean@example.com';
```

Devrait afficher :
| Colonne | Valeur |
|---------|--------|
| statut | `actif` ✅ |
| plan | `starter` |
| amount_paid | `15000` |
| transaction_id | `txn_12345` |
| payment_date | `2025-06-08T14:30:00` |
| payment_status | `confirmed` |

---

## 🔍 Étape 5 : Test Historique Paiements

1. Ouvrir : `http://localhost:3000/historique.html`
2. Entrer email : `jean@example.com`
3. Cliquer "Rechercher"

✅ **Résultat** : Affiche le paiement avec :
- Plan : Starter
- Montant : 15 000 FCFA
- Date : [Date du paiement]
- Statut : ✓ Actif
- ID Transaction : txn_12345

---

## 🚨 Dépannage

### **Erreur : "Cannot GET /index.html"**
```
❌ Vous accédez via file:// au lieu de http://
✅ Utiliser : http://localhost:3000/index.html
```

### **Erreur : "CORS policy"**
```
❌ Les requêtes frontend → backend sont bloquées
✅ Vérifier que CORS est activé dans server.js
✅ Vérifier que API_BASE_URL est correct
```

### **Erreur : "Database connection failed"**
```
❌ Les clés Supabase sont invalides
✅ Vérifier dans .env :
   - SUPABASE_URL
   - SUPABASE_KEY
✅ Tester la connexion directement
```

### **Erreur : "FedaPay modal not opening"**
```
❌ La clé publique FedaPay n'est pas valide
✅ Vérifier dans paiement.html ligne ~110 :
   FedaPay.setApiKey('pk_test_...')
```

### **Webhook ne reçoit pas les confirmations**
```
❌ FedaPay envoie vers une URL externe
✅ En développement local, utiliser :
   POST http://localhost:3000/api/test-webhook
✅ En production, configurer dans dashboard FedaPay
```

---

## 📈 Étape 6 : Test de charge (optionnel)

```bash
# Avec Apache Bench (AB)
ab -n 100 -c 10 http://localhost:3000/index.html

# Avec Artillery
npm install -g artillery
artillery quick --count 100 --num 10 http://localhost:3000/index.html
```

---

## ✅ Checklist finale

- [ ] Serveur démarre sans erreur
- [ ] Inscription crée un client avec statut "en_attente"
- [ ] Redirection vers paiement.html fonctionne
- [ ] Modal FedaPay s'affiche
- [ ] Webhook confirme le paiement
- [ ] Statut passe à "actif" dans Supabase
- [ ] Page confirmation s'affiche
- [ ] Historique affiche les paiements
- [ ] Les 3 plans fonctionnent (Starter, Pro, Business)
- [ ] Messages d'erreur s'affichent correctement

---

## 🎯 Cas d'usage avancés

### **Tester les erreurs**

1. Email déjà utilisé :
   - Créer 2 comptes avec le même email
   - ❌ Devrait afficher : "Email déjà utilisé"

2. Champs requis manquants :
   - Ne pas remplir un champ
   - ❌ Devrait afficher : "Champs obligatoires"

3. Mot de passe trop court :
   - Entrer mot de passe avec < 8 caractères
   - ❌ Devrait afficher : "Minimum 8 caractères"

4. CGV non acceptées :
   - Essayer soumettre sans cocher CGV
   - ❌ Devrait afficher : "Accepter les conditions"

---

**Dernière mise à jour** : Juin 2025
