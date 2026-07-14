// Intelligent response generator for agent chat
// Uses ZAI SDK when available (local dev), falls back to rich template-based responses (Vercel)

import { getZAIConfigFromEnv } from './zai-init';

interface AgentConfig {
  id: string;
  type: string;
  name: string;
  systemPrompt: string;
  capabilities: string;
}

// Analyze user input to determine intent and extract key topics
function analyzeInput(content: string): { intent: string; topics: string[]; isQuestion: boolean; isRequest: boolean; language: string } {
  const lower = content.toLowerCase();
  const isQuestion = lower.includes('?') || lower.startsWith('how') || lower.startsWith('what') || lower.startsWith('why') || lower.startsWith('when') || lower.startsWith('where') || lower.startsWith('can you') || lower.startsWith('could you');
  const isRequest = lower.includes('build') || lower.includes('create') || lower.includes('make') || lower.includes('write') || lower.includes('generate') || lower.includes('implement') || lower.includes('design') || lower.includes('develop') || lower.includes('help me') || lower.includes('i need') || lower.includes('i want');

  const topics: string[] = [];
  const topicKeywords: Record<string, string[]> = {
    'website': ['website', 'web app', 'web page', 'webapp', 'landing page', 'homepage', 'portal'],
    'react': ['react', 'nextjs', 'next.js', 'component', 'jsx', 'tsx'],
    'api': ['api', 'endpoint', 'rest', 'graphql', 'backend', 'server'],
    'database': ['database', 'db', 'sql', 'nosql', 'postgres', 'mongodb', 'prisma'],
    'testing': ['test', 'unit test', 'integration test', 'e2e', 'qa', 'quality'],
    'deployment': ['deploy', 'deploying', 'ci/cd', 'docker', 'kubernetes', 'vercel', 'aws'],
    'security': ['security', 'auth', 'authentication', 'authorization', 'encryption', 'vulnerability'],
    'mobile': ['mobile', 'ios', 'android', 'react native', 'flutter'],
    'typescript': ['typescript', 'ts', 'type', 'interface', 'generic'],
    'python': ['python', 'django', 'flask', 'fastapi', 'py'],
    'code-review': ['review', 'refactor', 'clean code', 'optimize', 'performance'],
    'architecture': ['architecture', 'design pattern', 'microservice', 'monolith', 'system design'],
    'requirements': ['requirements', 'spec', 'specification', 'user story', 'acceptance criteria'],
    'analysis': ['analyze', 'analysis', 'insight', 'data', 'report', 'dashboard'],
    'sales': ['sales', 'pipeline', 'deal', 'proposal', 'lead', 'crm'],
    'support': ['issue', 'bug', 'error', 'problem', 'ticket', 'troubleshoot', 'fix'],
  };

  for (const [topic, keywords] of Object.entries(topicKeywords)) {
    if (keywords.some(kw => lower.includes(kw))) {
      topics.push(topic);
    }
  }

  let language = 'english';
  if (lower.match(/[\u4e00-\u9fff]/)) language = 'chinese';
  else if (lower.match(/[\u0900-\u097f]/)) language = 'hindi';

  return {
    intent: isRequest ? 'request' : isQuestion ? 'question' : 'general',
    topics: topics.length > 0 ? topics : ['general'],
    isQuestion,
    isRequest,
    language,
  };
}

// Generate rich, contextual responses based on agent type and user input
export function generateContextualResponse(agent: AgentConfig, userContent: string): string {
  const analysis = analyzeInput(userContent);
  const { type, name } = agent;

  // If we have specific topic matches, generate detailed topic-specific responses
  if (type === 'development') {
    return generateDevResponse(userContent, analysis);
  } else if (type === 'testing') {
    return generateTestResponse(userContent, analysis);
  } else if (type === 'business-analysis') {
    return generateBAResponse(userContent, analysis);
  } else if (type === 'sales') {
    return generateSalesResponse(userContent, analysis);
  } else if (type === 'implementation') {
    return generateImplResponse(userContent, analysis);
  } else if (type === 'data-analysis') {
    return generateDataResponse(userContent, analysis);
  } else if (type === 'system-admin') {
    return generateSysAdminResponse(userContent, analysis);
  } else if (type === 'support') {
    return generateSupportResponse(userContent, analysis);
  }

  return generateGenericResponse(name, userContent, analysis);
}

function generateDevResponse(content: string, analysis: ReturnType<typeof analyzeInput>): string {
  const topics = analysis.topics;

  if (topics.includes('website') || topics.includes('react')) {
    return `# Multi-Page Website Development Plan

I'll help you build a complete multi-page website! Here's my detailed approach:

## 🏗️ Architecture Overview

\`\`\`
project-root/
├── app/
│   ├── layout.tsx          # Root layout with navigation
│   ├── page.tsx            # Home page
│   ├── about/page.tsx      # About page
│   ├── services/page.tsx   # Services page
│   ├── contact/page.tsx    # Contact page
│   └── api/                # API routes
├── components/
│   ├── Navbar.tsx          # Navigation component
│   ├── Footer.tsx          # Footer component
│   ├── Hero.tsx            # Hero section
│   └── Card.tsx            # Reusable card component
├── lib/
│   └── utils.ts            # Utility functions
├── public/                 # Static assets
└── styles/
    └── globals.css         # Global styles
\`\`\`

## 📄 Root Layout (app/layout.tsx)

\`\`\`typescript
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'My Website',
  description: 'A modern multi-page website built with Next.js',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Navbar />
        <main className="min-h-screen">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
\`\`\`

## 🧭 Navigation Component

\`\`\`typescript
'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

export function Navbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const links = [
    { href: '/', label: 'Home' },
    { href: '/about', label: 'About' },
    { href: '/services', label: 'Services' },
    { href: '/contact', label: 'Contact' },
  ];

  return (
    <nav className="bg-white shadow-sm border-b sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="text-xl font-bold text-gray-900">
              Brand
            </Link>
          </div>
          <div className="hidden md:flex items-center space-x-8">
            {links.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={\`text-sm font-medium transition-colors \${
                  pathname === href
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }\`}
              >
                {label}
              </Link>
            ))}
          </div>
          <button
            className="md:hidden"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            Menu
          </button>
        </div>
      </div>
    </nav>
  );
}
\`\`\`

## 🏠 Home Page (app/page.tsx)

\`\`\`typescript
import Link from 'next/link';

export default function HomePage() {
  return (
    <div>
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-purple-700 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h1 className="text-5xl font-bold mb-6">Welcome to Our Platform</h1>
          <p className="text-xl mb-8 text-blue-100">
            Build something amazing with our tools and expertise
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/services" className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-blue-50">
              Get Started
            </Link>
            <Link href="/about" className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white/10">
              Learn More
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Our Features</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { title: 'Fast', desc: 'Lightning-fast performance', icon: '⚡' },
              { title: 'Secure', desc: 'Enterprise-grade security', icon: '🔒' },
              { title: 'Scalable', desc: 'Grows with your business', icon: '📈' },
            ].map(({ title, desc, icon }) => (
              <div key={title} className="bg-white p-8 rounded-xl shadow-sm border">
                <span className="text-4xl">{icon}</span>
                <h3 className="text-xl font-semibold mt-4">{title}</h3>
                <p className="text-gray-600 mt-2">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
\`\`\`

## 📋 Next Steps

1. **Set up the project**: \`npx create-next-app@latest my-website --typescript --tailwind --app\`
2. **Install dependencies**: \`npm install lucide-react framer-motion\`
3. **Create the page files** following the structure above
4. **Add your content** to each page
5. **Style with Tailwind CSS** - all the classes are already included
6. **Deploy**: Push to GitHub and connect to Vercel

Would you like me to write the code for any specific page in more detail? I can also add:
- Contact form with email integration
- Blog section with MDX
- Authentication with NextAuth.js
- Database integration with Prisma
- Dark mode toggle
- Animation with Framer Motion`;
  }

  if (topics.includes('api')) {
    return `# API Development Guide

I'll help you build a robust API! Here's a complete implementation:

## 🏗️ API Architecture

\`\`\`typescript
// app/api/items/route.ts
import { NextRequest, NextResponse } from 'next/server';

// In-memory store (replace with database in production)
let items: any[] = [];
let nextId = 1;

// GET /api/items - List all items
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const search = url.searchParams.get('search');
  const page = parseInt(url.searchParams.get('page') || '1');
  const limit = parseInt(url.searchParams.get('limit') || '10');

  let filtered = items;
  if (search) {
    filtered = items.filter(item =>
      item.name.toLowerCase().includes(search.toLowerCase())
    );
  }

  const start = (page - 1) * limit;
  const paginated = filtered.slice(start, start + limit);

  return NextResponse.json({
    items: paginated,
    total: filtered.length,
    page,
    totalPages: Math.ceil(filtered.length / limit),
  });
}

// POST /api/items - Create new item
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.name) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      );
    }

    const item = {
      id: nextId++,
      name: body.name,
      description: body.description || '',
      createdAt: new Date().toISOString(),
    };

    items.push(item);
    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Invalid request body' },
      { status: 400 }
    );
  }
}
\`\`\`

## 🔧 Individual Item Routes

\`\`\`typescript
// app/api/items/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';

// GET /api/items/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const item = items.find(i => i.id === parseInt(params.id));
  if (!item) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  return NextResponse.json(item);
}

// PUT /api/items/[id]
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const item = items.find(i => i.id === parseInt(params.id));
  if (!item) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const body = await request.json();
  Object.assign(item, body, { updatedAt: new Date().toISOString() });
  return NextResponse.json(item);
}

// DELETE /api/items/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const index = items.findIndex(i => i.id === parseInt(params.id));
  if (index === -1) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  items.splice(index, 1);
  return NextResponse.json({ message: 'Deleted' });
}
\`\`\`

## 🛡️ Middleware for Auth

\`\`\`typescript
// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.headers.get('authorization');

  if (request.nextUrl.pathname.startsWith('/api/') &&
      !request.nextUrl.pathname.startsWith('/api/auth')) {
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/api/:path*',
};
\`\`\`

## 📊 Error Handling Pattern

\`\`\`typescript
class AppError extends Error {
  constructor(public statusCode: number, message: string) {
    super(message);
  }
}

function errorHandler(error: unknown) {
  if (error instanceof AppError) {
    return NextResponse.json(
      { error: error.message },
      { status: error.statusCode }
    );
  }
  console.error('Unexpected error:', error);
  return NextResponse.json(
    { error: 'Internal server error' },
    { status: 500 }
  );
}
\`\`\`

Would you like me to add database integration (Prisma), authentication, or rate limiting?`;
  }

  // Default dev response for general development questions
  return `# Development Assistance

I'm DevAgent, your senior full-stack developer. I can help you with:

## 🛠️ What I Can Build

| Category | Examples |
|----------|----------|
| **Web Apps** | React, Next.js, Vue, Angular SPAs and multi-page apps |
| **APIs** | REST, GraphQL, tRPC endpoints with auth and validation |
| **Full-Stack** | Complete apps with database, auth, and deployment |
| **Mobile** | React Native, Flutter cross-platform apps |
| **DevOps** | Docker, CI/CD, Kubernetes, cloud deployment |
| **Database** | Schema design, Prisma, migrations, optimization |

## 💡 Tell Me More About Your Project

To give you the best help, please share:

1. **What are you building?** (e.g., "A multi-page e-commerce website")
2. **Tech stack preferences?** (e.g., "Next.js with TypeScript and Tailwind")
3. **Key features needed?** (e.g., "User auth, product catalog, shopping cart")
4. **Target deployment?** (e.g., "Vercel" or "AWS")

## 📝 Example Request Formats

- "Build me a React todo app with TypeScript"
- "Create a REST API for a blog with authentication"
- "Design a database schema for an e-commerce platform"
- "Write a Docker Compose setup for a Node.js + PostgreSQL app"
- "Implement real-time chat with WebSockets"

Once you describe what you need, I'll provide **complete, runnable code** with:
- Full file structure
- All source code with proper TypeScript types
- Configuration files
- Setup instructions
- Deployment guide

What would you like to build?`;
}

function generateTestResponse(content: string, analysis: ReturnType<typeof analyzeInput>): string {
  return `# Testing Strategy & Implementation

I'm TestAgent, your QA specialist. Let me create comprehensive tests for your project!

## 🧪 Test Architecture

\`\`\`
tests/
├── unit/              # Unit tests
│   ├── components/    # Component tests
│   ├── utils/         # Utility tests
│   └── services/      # Service tests
├── integration/       # Integration tests
│   └── api/           # API endpoint tests
├── e2e/               # End-to-end tests
│   └── flows/         # User flow tests
└── fixtures/          # Test data and mocks
\`\`\`

## 📦 Test Setup

\`\`\`typescript
// vitest.config.ts
import { defineConfig } from 'vitest';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'tests/'],
    },
  },
});
\`\`\`

## ✅ Sample Unit Tests

\`\`\`typescript
// tests/unit/utils/calculator.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { Calculator } from '@/lib/calculator';

describe('Calculator', () => {
  let calc: Calculator;

  beforeEach(() => {
    calc = new Calculator();
  });

  describe('add', () => {
    it('should add two positive numbers', () => {
      expect(calc.add(2, 3)).toBe(5);
    });

    it('should handle negative numbers', () => {
      expect(calc.add(-1, 1)).toBe(0);
    });

    it('should handle zero', () => {
      expect(calc.add(0, 5)).toBe(5);
    });
  });

  describe('divide', () => {
    it('should divide two numbers', () => {
      expect(calc.divide(10, 2)).toBe(5);
    });

    it('should throw on division by zero', () => {
      expect(() => calc.divide(10, 0)).toThrow('Division by zero');
    });
  });
});
\`\`\`

## 🔌 API Integration Tests

\`\`\`typescript
// tests/integration/api/items.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';

describe('Items API', () => {
  beforeAll(async () => {
    // Setup test database
  });

  it('POST /api/items - creates an item', async () => {
    const res = await fetch('/api/items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Test Item' }),
    });

    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.name).toBe('Test Item');
    expect(data.id).toBeDefined();
  });

  it('GET /api/items - returns paginated list', async () => {
    const res = await fetch('/api/items?page=1&limit=10');
    expect(res.ok).toBe(true);

    const data = await res.json();
    expect(Array.isArray(data.items)).toBe(true);
    expect(data.total).toBeTypeOf('number');
  });
});
\`\`\`

## 🎯 Test Priority Matrix

| Priority | Test Type | Coverage Target | Focus |
|----------|-----------|----------------|-------|
| 🔴 Critical | Unit | 90%+ | Core logic, edge cases |
| 🟡 High | Integration | 80%+ | API contracts, data flow |
| 🟢 Medium | E2E | Key flows | User journeys, cross-cutting |

What specific component or feature would you like me to write tests for? I'll provide complete, runnable test code!`;
}

function generateBAResponse(content: string, analysis: ReturnType<typeof analyzeInput>): string {
  return `# Business Analysis Document

I'm BAAgent, your senior business analyst. Here's my structured analysis:

## 📋 Executive Summary

Based on your request, I'll create a comprehensive requirements document with clear acceptance criteria.

## 🎯 Requirements Document

### User Stories

\`\`\`
US-001: As a [user role], I want to [action], so that [benefit]

Priority: High | Effort: M | Sprint: 1

Acceptance Criteria:
✅ Given [context], when [action], then [expected result]
✅ Given [context], when [action], then [expected result]
✅ Edge case: [description]
\`\`\`

### Process Flow

\`\`\`
Step 1: User navigates to [page]
    ↓
Step 2: System validates [input]
    ↓ (valid)        ↓ (invalid)
Step 3: Process    Step 2a: Show error
    ↓
Step 4: Save & confirm
    ↓
Step 5: Display success
\`\`\`

### Stakeholder Impact Analysis

| Stakeholder | Impact | Concern | Mitigation |
|-------------|--------|---------|------------|
| End Users | High | Learning curve | Intuitive UI, onboarding |
| Dev Team | Medium | Scope creep | Clear sprint boundaries |
| Management | Low | ROI timeline | Phase-based delivery |

### Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| Scope creep | High | High | Fixed sprint scope |
| Technical debt | Medium | Medium | Code review process |
| Resource constraints | Low | High | Cross-training |

### Recommended Next Steps

1. **Sprint 1 (Week 1-2)**: Core functionality MVP
2. **Sprint 2 (Week 3-4)**: Enhanced features + testing
3. **Sprint 3 (Week 5-6)**: Polish, optimization, launch prep

Would you like me to detail any specific user story, create wireframe descriptions, or map out a specific workflow?`;
}

function generateSalesResponse(content: string, analysis: ReturnType<typeof analyzeInput>): string {
  return `# Sales Strategy & Materials

I'm SalesAgent, your top-performing sales strategist. Here's my analysis and action plan:

## 🎯 Sales Playbook

### Target Customer Profile

| Attribute | Primary | Secondary |
|-----------|---------|-----------|
| Company Size | 50-500 employees | 10-50 |
| Industry | Technology, SaaS | Finance, Healthcare |
| Decision Maker | CTO / VP Eng | Product Manager |
| Pain Point | Scaling dev teams | Time to market |
| Budget | $50K-200K/yr | $20K-50K/yr |

### Outreach Email Template

\`\`\`
Subject: [First Name], noticed [specific observation about their company]

Hi [First Name],

I noticed [specific detail about their tech stack/challenge] at [Company].
Our clients in similar situations have seen [specific metric improvement]
within [timeframe].

Would you be open to a 15-minute call this week to explore if we can
help [Company] achieve similar results?

Best,
[Your Name]
\`\`\`

### Objection Handling Framework

| Objection | Response |
|-----------|----------|
| "Too expensive" | "I understand budget is a concern. Let me show you the ROI calculation — our clients typically see 3x return within 6 months..." |
| "Not a priority" | "That makes sense. Out of curiosity, what would need to change for this to become a priority? Often it's a matter of..." |
| "Using competitor" | "Great, [competitor] is solid. What's working well, and what would you improve? Our differentiation is..." |

### Pipeline Analysis

| Stage | Count | Value | Win Rate | Avg. Days |
|-------|-------|-------|----------|-----------|
| Qualification | 12 | $600K | 30% | 7 |
| Discovery | 8 | $400K | 45% | 14 |
| Proposal | 5 | $250K | 60% | 21 |
| Negotiation | 3 | $150K | 75% | 7 |

### Recommended Actions This Week

1. **Follow up** with 3 prospects in discovery stage
2. **Send proposals** to 2 qualified leads
3. **Schedule demos** with 4 new leads
4. **Update CRM** with latest deal progress

Would you like me to create a detailed proposal, write call scripts, or analyze a specific deal?`;
}

function generateImplResponse(content: string, analysis: ReturnType<typeof analyzeInput>): string {
  return `# Implementation Plan & Deployment Guide

I'm ImplAgent, your implementation specialist. Here's your complete deployment plan:

## 📋 Implementation Phases

### Phase 1: Foundation (Week 1-2)
- [ ] Environment setup (dev, staging, production)
- [ ] CI/CD pipeline configuration
- [ ] Infrastructure as Code (Terraform/CloudFormation)
- [ ] Monitoring and alerting setup

### Phase 2: Core Deployment (Week 3-4)
- [ ] Database migrations
- [ ] Application deployment
- [ ] SSL/TLS certificate configuration
- [ ] DNS configuration

### Phase 3: Launch (Week 5-6)
- [ ] Load testing
- [ ] Security audit
- [ ] Staged rollout (10% → 25% → 50% → 100%)
- [ ] Post-launch monitoring

## 🐳 Docker Setup

\`\`\`dockerfile
# Dockerfile
FROM node:20-alpine AS base
WORKDIR /app

# Dependencies
FROM base AS deps
COPY package*.json ./
RUN npm ci --only=production

# Build
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# Production
FROM base AS runner
ENV NODE_ENV=production
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules

EXPOSE 3000
CMD ["npm", "start"]
\`\`\`

## 🔄 CI/CD Pipeline (GitHub Actions)

\`\`\`yaml
# .github/workflows/deploy.yml
name: Deploy
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - run: npm test
      - run: npm run build
      - uses: amondnet/vercel-action@v25
        with:
          vercel-token: \\\${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: \\\${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: \\\${{ secrets.VERCEL_PROJECT_ID }}
\`\`\`

## 🛡️ Rollback Plan

1. **Automated rollback trigger**: Error rate > 5% for 5 minutes
2. **Manual rollback**: \`vercel --prod --yes\` to previous deployment
3. **Database rollback**: Revert migration with \`npx prisma migrate rollback\`

What specific deployment target or configuration do you need help with?`;
}

function generateDataResponse(content: string, analysis: ReturnType<typeof analyzeInput>): string {
  return `# Data Analysis Framework

I'm DataAgent, your senior data analyst. Here's my analytical approach:

## 📊 Analysis Methodology

1. **Data Collection** → Gather from all relevant sources
2. **Data Cleaning** → Handle missing values, outliers, inconsistencies
3. **Exploratory Analysis** → Distribution, correlation, trends
4. **Statistical Testing** → Hypothesis testing, significance
5. **Visualization** → Charts, dashboards, reports
6. **Insights & Recommendations** → Actionable findings

## 🐍 Python Analysis Template

\`\`\`python
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from scipy import stats

# Load data
df = pd.read_csv('data.csv')

# Data overview
print(df.info())
print(df.describe())

# Check for missing values
missing = df.isnull().sum()
print("Missing values:\\n", missing[missing > 0])

# Handle missing values
df = df.dropna(subset=['critical_column'])
df['optional_column'] = df['optional_column'].fillna(df['optional_column'].median())

# Statistical summary
print("\\nKey Statistics:")
print(f"Mean: {df['metric'].mean():.2f}")
print(f"Median: {df['metric'].median():.2f}")
print(f"Std Dev: {df['metric'].std():.2f}")
print(f"Skewness: {df['metric'].skew():.2f}")

# Correlation analysis
correlation = df.corr(numeric_only=True)
print("\\nCorrelation Matrix:")
print(correlation)

# Visualization
fig, axes = plt.subplots(2, 2, figsize=(14, 10))

# Distribution
df['metric'].hist(ax=axes[0, 0], bins=30, edgecolor='black')
axes[0, 0].set_title('Distribution of Metric')

# Trend over time
df.groupby('date')['metric'].mean().plot(ax=axes[0, 1])
axes[0, 1].set_title('Trend Over Time')

# Box plot by category
df.boxplot(column='metric', by='category', ax=axes[1, 0])
axes[1, 0].set_title('Distribution by Category')

# Correlation heatmap
sns.heatmap(correlation, annot=True, ax=axes[1, 1], cmap='coolwarm')
axes[1, 1].set_title('Correlation Heatmap')

plt.tight_layout()
plt.savefig('analysis_report.png', dpi=150)
\`\`\`

## 📈 Key Metrics to Track

| Metric | Formula | Target | Alert Threshold |
|--------|---------|--------|----------------|
| Conversion Rate | Conversions / Visitors | > 3% | < 2% |
| Avg. Revenue | Total Revenue / Customers | > $500 | < $350 |
| Churn Rate | Lost / Total Customers | < 5% | > 8% |
| NPS Score | Promoters - Detractors | > 50 | < 30 |

What data would you like me to analyze? Share your dataset or describe the analysis you need!`;
}

function generateSysAdminResponse(content: string, analysis: ReturnType<typeof analyzeInput>): string {
  return `# System Administration Guide

I'm SysAdminAgent, your infrastructure specialist. Here's my assessment and recommendations:

## 🖥️ Infrastructure Overview

### Health Check Script

\`\`\`bash
#!/bin/bash
# health-check.sh - Run comprehensive system health check

echo "=== System Health Check ==="
echo "Date: " + date
echo ""

# CPU usage
CPU_TOP=$(top -bn1 | grep "Cpu(s)" | awk '{print $2}')
echo "CPU Usage: " $CPU_TOP "%"
if [ "$(echo "$CPU_TOP > 80" | bc -l)" = "1" ]; then
  echo "  WARNING: High CPU usage!"
fi

# Memory usage
MEM_FREE=$(free | grep Mem | awk '{printf "%.1f", $3/$2 * 100}')
echo "Memory Usage: " $MEM_FREE "%"
if [ "$(echo "$MEM_FREE > 85" | bc -l)" = "1" ]; then
  echo "  WARNING: High memory usage!"
fi

# Disk usage
echo "Disk Usage:"
df -h | grep -E "^/dev/"

# Check critical services
echo ""
echo "Service Status:"
for service in nginx postgresql redis; do
  if systemctl is-active --quiet "$service"; then
    echo "  OK: $service: Running"
  else
    echo "  ERROR: $service: NOT RUNNING"
  fi
done
\`\`\`

### Docker Compose Setup

\`\`\`yaml
# docker-compose.yml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://user:pass@db:5432/app
      - REDIS_URL=redis://cache:6379
    depends_on:
      - db
      - cache
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  db:
    image: postgres:16-alpine
    volumes:
      - postgres_data:/var/lib/postgresql/data
    environment:
      POSTGRES_DB: app
      POSTGRES_USER: user
      POSTGRES_PASSWORD: pass
    restart: unless-stopped

  cache:
    image: redis:7-alpine
    volumes:
      - redis_data:/data
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
    depends_on:
      - app
    restart: unless-stopped

volumes:
  postgres_data:
  redis_data:
\`\`\`

### Security Checklist

- [ ] SSL/TLS certificates configured
- [ ] Firewall rules (UFW/iptables) set up
- [ ] SSH key-based auth enabled
- [ ] Fail2ban installed and configured
- [ ] Automatic security updates enabled
- [ ] Database access restricted to app servers
- [ ] API rate limiting configured
- [ ] Regular backup schedule verified

What infrastructure task do you need help with?`;
}

function generateSupportResponse(content: string, analysis: ReturnType<typeof analyzeInput>): string {
  return `# Support & Troubleshooting Guide

I'm SupportAgent, here to help resolve your issue! Let me provide a systematic approach:

## 🔍 Issue Classification

| Category | Priority | Response Time |
|----------|----------|---------------|
| 🔴 Service Down | P1 | < 15 minutes |
| 🟠 Major Impact | P2 | < 1 hour |
| 🟡 Partial Impact | P3 | < 4 hours |
| 🟢 Minor Issue | P4 | < 24 hours |

## 🛠️ Troubleshooting Decision Tree

\`\`\`
Issue Reported
    ↓
Is the service completely down?
    ├── YES → Check: Server status → Database → Network → Deploy
    └── NO → Partial issue
        ↓
    Is it affecting all users?
        ├── YES → Check: Recent deployments → Config changes → External APIs
        └── NO → Specific users
            ↓
        Is it browser/device specific?
            ├── YES → Check: Browser compatibility → Cache → Client errors
            └── NO → Check: User permissions → Data issues → Account config
\`\`\`

## 📝 Resolution Template

\`\`\`
Issue: [Brief description]
Classification: [P1/P2/P3/P4]

Root Cause:
[Detailed explanation of what caused the issue]

Resolution Steps:
1. [Step 1]
2. [Step 2]
3. [Step 3]

Verification:
- [ ] Service restored
- [ ] No side effects
- [ ] Monitoring confirmed

Prevention:
[Steps to prevent recurrence]

KB Article: [Link to knowledge base article]
\`\`\`

## 📚 Common Solutions

### Login Issues
1. Clear browser cache and cookies
2. Try incognito/private window
3. Check if account is active in admin panel
4. Verify email/password combination
5. Reset password via forgot password flow

### Performance Issues
1. Check current server load
2. Review database query performance
3. Check for memory leaks in application
4. Verify CDN configuration
5. Review recent code deployments

What specific issue are you experiencing? I'll provide targeted troubleshooting steps!`;
}

function generateGenericResponse(agentName: string, content: string, analysis: ReturnType<typeof analyzeInput>): string {
  return `Hello! I'm ${agentName}, ready to assist you. I can provide detailed, structured help with your requests.

To give you the best assistance, could you describe your specific need in more detail? For example:
- What task or project are you working on?
- What's the current challenge or question?
- What's the expected outcome?

I'll provide comprehensive, actionable guidance with code examples, step-by-step instructions, and best practices!`;
}
