# 🚀 Agent Army - Deployment Guide

## Quick Deploy to Vercel

### Option 1: Vercel CLI (Recommended)
```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy to production
vercel --prod
```

### Option 2: GitHub + Vercel Integration
1. Push to GitHub:
```bash
# Create a GitHub repo at https://github.com/new
# Then:
git remote add origin https://github.com/YOUR_USERNAME/agent-army.git
git push -u origin main
```

2. Import on Vercel:
   - Go to https://vercel.com/new
   - Import your GitHub repository
   - Deploy!

## Environment Variables
- `DATABASE_URL`: SQLite database path (default: `file:/home/z/my-project/db/custom.db`)

## Your 8 AI Agents
| Agent | Type | Specialty |
|-------|------|-----------|
| DevAgent | Development | Code generation, review, debugging |
| TestAgent | Testing | QA, test suites, regression |
| BAAgent | Business Analysis | Requirements, specs, process mapping |
| SalesAgent | Sales | Pipeline, proposals, CRM |
| ImplAgent | Implementation | Deployment, rollout, migration |
| DataAgent | Data Analysis | Statistics, visualization, ETL |
| SysAdminAgent | System Admin | Infrastructure, monitoring, security |
| SupportAgent | Support | Tickets, escalation, knowledge base |
