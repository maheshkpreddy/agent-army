#!/bin/bash
# Agent Army - Deploy to GitHub and Vercel
# Run this script to deploy your Agent Army application

set -e

echo "🚀 Agent Army Deployment Script"
echo "================================"
echo ""

# Step 1: GitHub Setup
echo "📦 Step 1: Setting up GitHub repository..."
echo ""

if ! git remote | grep -q origin; then
    echo "No GitHub remote configured."
    echo ""
    echo "To set up GitHub, you need a Personal Access Token (PAT)."
    echo "Create one at: https://github.com/settings/tokens"
    echo ""
    read -p "Enter your GitHub username: " GH_USER
    read -p "Enter your GitHub PAT: " GH_TOKEN
    read -p "Enter repository name (default: agent-army): " REPO_NAME
    REPO_NAME=${REPO_NAME:-agent-army}
    
    # Create repo via API
    echo "Creating GitHub repository..."
    curl -s -X POST -H "Authorization: token $GH_TOKEN" \
        -H "Accept: application/vnd.github.v3+json" \
        https://api.github.com/user/repos \
        -d "{\"name\":\"$REPO_NAME\",\"description\":\"Agent Army - 8 Specialized AI Agents for Your Workforce\",\"private\":false}" || true
    
    # Set remote
    git remote add origin https://$GH_USER:$GH_TOKEN@github.com/$GH_USER/$REPO_NAME.git 2>/dev/null || \
    git remote set-url origin https://$GH_USER:$GH_TOKEN@github.com/$GH_USER/$REPO_NAME.git
    
    echo "✅ GitHub repository created: https://github.com/$GH_USER/$REPO_NAME"
else
    echo "✅ GitHub remote already configured"
fi

# Step 2: Push to GitHub
echo ""
echo "📤 Step 2: Pushing to GitHub..."
git push -u origin main || git push -u origin master
echo "✅ Pushed to GitHub"

# Step 3: Vercel Deploy
echo ""
echo "🌐 Step 3: Deploying to Vercel..."
echo ""
echo "Option A: Deploy via Vercel CLI"
echo "  vercel login"
echo "  vercel --prod"
echo ""
echo "Option B: Deploy via GitHub integration"
echo "  1. Go to https://vercel.com/new"
echo "  2. Import your GitHub repository"
echo "  3. Configure environment variables if needed"
echo "  4. Deploy!"
echo ""
echo "🎉 Agent Army deployment complete!"
echo "   Your agents are ready to work for you!"
