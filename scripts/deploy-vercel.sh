#!/bin/bash
# MARQ AI Agent TRIBE - Vercel Deployment Script
# 
# Prerequisites:
# 1. Install Vercel CLI: npm i -g vercel
# 2. Login to Vercel: vercel login
# 3. Run this script: bash scripts/deploy-vercel.sh

set -e

echo "🚀 Deploying MARQ AI Agent TRIBE to Vercel..."
echo ""

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI not found. Install it with: npm i -g vercel"
    exit 1
fi

# Check if logged in
if ! vercel whoami &> /dev/null; then
    echo "❌ Not logged in to Vercel. Run: vercel login"
    exit 1
fi

echo "✅ Vercel CLI ready"
echo ""

# Deploy to production
echo "📦 Deploying to production..."
vercel deploy --prod --yes

echo ""
echo "✅ MARQ AI Agent TRIBE deployed successfully!"
echo ""
echo "⚠️  Important: Set these environment variables in Vercel Dashboard:"
echo "   NEXTAUTH_SECRET=marq-ai-agent-tribe-secret-key-2024"
echo "   NEXTAUTH_URL=https://your-app.vercel.app"
echo "   DATABASE_URL=file:./db/custom.db"
echo ""
echo "🔑 Default Login Credentials:"
echo "   Admin:     admin@marq.ai / MARQ@admin2024"
echo "   Manager:   manager@marq.ai / MARQ@manager2024"
echo "   Developer: developer@marq.ai / MARQ@dev2024"
echo "   Analyst:   analyst@marq.ai / MARQ@analyst2024"
echo "   Operator:  operator@marq.ai / MARQ@operator2024"
echo "   Viewer:    viewer@marq.ai / MARQ@viewer2024"
