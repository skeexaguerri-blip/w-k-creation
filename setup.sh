#!/bin/bash

# 🚀 SCRIPT DE DÉPLOIEMENT - W&K Creation
# Automatise l'installation et le test en local

echo "=================================================="
echo "🚀 W&K Creation - Script Installation/Test"
echo "=================================================="
echo ""

# Étape 1 : Installer les dépendances
echo "📦 Installation des dépendances..."
npm install

if [ $? -eq 0 ]; then
    echo "✅ Dépendances installées"
else
    echo "❌ Erreur lors de l'installation"
    exit 1
fi

echo ""
echo "=================================================="
echo "⚙️  Configuration"
echo "=================================================="
echo ""

# Vérifier si .env existe
if [ ! -f .env ]; then
    echo "⚠️  Fichier .env non trouvé. Création..."
    cp .env.example .env
    echo "✅ Fichier .env créé. À personnaliser !"
else
    echo "✅ Fichier .env trouvé"
fi

echo ""
echo "=================================================="
echo "🧪 Tests de configuration"
echo "=================================================="
echo ""

# Vérifier Node.js
echo "✓ Vérification Node.js..."
node --version

# Vérifier npm
echo "✓ Vérification npm..."
npm --version

# Vérifier ports
echo "✓ Vérification port 3000..."
if netstat -an 2>/dev/null | grep -q ":3000 "; then
    echo "⚠️  Port 3000 déjà utilisé"
else
    echo "✅ Port 3000 disponible"
fi

echo ""
echo "=================================================="
echo "🎯 Prêt pour le démarrage !"
echo "=================================================="
echo ""
echo "Pour démarrer le serveur, exécutez :"
echo ""
echo "   npm start"
echo ""
echo "Puis ouvrez dans votre navigateur :"
echo ""
echo "   http://localhost:3000/index.html"
echo ""
echo "=================================================="
