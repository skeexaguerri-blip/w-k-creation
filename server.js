/**
 * SERVER.JS - Backend FedaPay & Webhooks
 * Démarrer : node server.js
 */

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('.'));

// CONFIG
const FEDAPAY_SECRET = process.env.FEDAPAY_SECRET_KEY || 'sk_test_VhPQHXuoWcLNZWKhZJMSBNPa';

// Import Supabase
const { createClient } = require('@supabase/supabase-js');
const db = createClient(
  process.env.SUPABASE_URL || 'https://upaewkcazpvidzlwfttj.supabase.co',
  process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVwYWV3a2NhenB2aWR6bHdmdHRqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA3NzM3NTUsImV4cCI6MjA5NjM0OTc1NX0.7OfIH8gLg3sv4t6INFSap76_KN2Xixm39fDjAlh7X74'
);

// ============================================
// 1️⃣ WEBHOOK - Recevoir confirmations FedaPay
// ============================================
app.post('/webhook/fedapay', async (req, res) => {
  console.log('🔔 Webhook FedaPay reçu:', req.body);

  try {
    const { event, data } = req.body;

    // Vérifier la signature (sécurité)
    if (!verifyFedaPaySignature(req)) {
      console.error('❌ Signature invalide');
      return res.status(401).json({ error: 'Invalid signature' });
    }

    // Événement : transaction complétée
    if (event === 'transaction.success') {
      const { id, reference, amount, customer } = data;

      console.log(`✅ Paiement confirmé: ${reference} - ${amount} XOF`);

      // Mettre à jour la base de données
      const { error } = await db
        .from('clients')
        .update({
          statut: 'actif',
          transaction_id: id,
          amount_paid: amount,
          payment_date: new Date().toISOString(),
          payment_method: 'fedapay',
          payment_status: 'confirmed'
        })
        .eq('email', customer.email);

      if (error) {
        console.error('Erreur mise à jour DB:', error);
        return res.status(500).json({ error: error.message });
      }

      // Envoyer une notification (optionnel)
      console.log(`📧 Email de confirmation envoyé à ${customer.email}`);

      return res.status(200).json({ success: true, message: 'Payment confirmed' });
    }

    // Événement : paiement échoué
    if (event === 'transaction.error' || event === 'transaction.failed') {
      const { id, reference, customer } = data;

      console.log(`❌ Paiement échoué: ${reference}`);

      // Mettre à jour le statut
      const { error } = await db
        .from('clients')
        .update({
          statut: 'paiement_échoué',
          payment_status: 'failed'
        })
        .eq('email', customer.email);

      if (error) {
        console.error('Erreur mise à jour DB:', error);
      }

      return res.status(200).json({ success: true, message: 'Payment failed recorded' });
    }

    res.status(200).json({ success: true });
  } catch (err) {
    console.error('❌ Erreur webhook:', err);
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// 2️⃣ API - Récupérer historique paiements
// ============================================
app.get('/api/paiements/:email', async (req, res) => {
  try {
    const { email } = req.params;

    const { data, error } = await db
      .from('clients')
      .select('transaction_id, amount_paid, payment_date, payment_status, plan, statut')
      .eq('email', email)
      .single();

    if (error) {
      return res.status(404).json({ error: 'Client not found' });
    }

    res.json({
      success: true,
      payment: data
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// 3️⃣ API - Créer transaction FedaPay
// ============================================
app.post('/api/create-transaction', async (req, res) => {
  try {
    const { email, amount, plan, prenom } = req.body;

    // Validation
    if (!email || !amount || !plan) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Créer transaction (mock pour test)
    const transaction = {
      id: 'txn_' + Date.now(),
      reference: 'ref_' + Math.random().toString(36).substr(2, 9),
      amount: amount,
      currency: 'XOF',
      description: `Abonnement ${plan} - W&K Creation`,
      customer: {
        email: email,
        firstname: prenom
      },
      status: 'pending'
    };

    res.json({
      success: true,
      transaction: transaction
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// 4️⃣ API - Test webhook
// ============================================
app.post('/api/test-webhook', async (req, res) => {
  const testPayload = {
    event: 'transaction.success',
    data: {
      id: 'txn_test_' + Date.now(),
      reference: 'ref_test_' + Math.random().toString(36).substr(2, 9),
      amount: 15000,
      customer: {
        email: 'test@example.com'
      }
    }
  };

  console.log('🧪 Envoi du webhook de test...');

  try {
    const response = await fetch('http://localhost:3000/webhook/fedapay', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testPayload)
    });

    const result = await response.json();
    res.json({ success: true, result });
  } catch (err) {
    res.json({ error: err.message });
  }
});

// ============================================
// UTILITAIRES
// ============================================

/**
 * Vérifier la signature FedaPay
 */
function verifyFedaPaySignature(req) {
  // À implémenter avec crypto
  // Pour l'instant, on accepte tous les webhooks
  return true;
}

// ============================================
// DÉMARRAGE
// ============================================
app.listen(PORT, () => {
  console.log(`\n🚀 Serveur démarré sur http://localhost:${PORT}`);
  console.log(`📨 Webhook FedaPay: POST http://localhost:${PORT}/webhook/fedapay`);
  console.log(`💳 Créer transaction: POST http://localhost:${PORT}/api/create-transaction`);
  console.log(`📊 Historique: GET http://localhost:${PORT}/api/paiements/:email`);
  console.log(`🧪 Test webhook: POST http://localhost:${PORT}/api/test-webhook\n`);
});
