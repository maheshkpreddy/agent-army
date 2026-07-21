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
  } else if (type === 'frontend') {
    return generateFrontendResponse(userContent, analysis);
  } else if (type === 'backend') {
    return generateBackendResponse(userContent, analysis);
  } else if (type === 'mobile-dev') {
    return generateMobileResponse(userContent, analysis);
  } else if (type === 'testing') {
    return generateTestResponse(userContent, analysis);
  } else if (type === 'security-testing') {
    return generateSecurityResponse(userContent, analysis);
  } else if (type === 'performance') {
    return generatePerfResponse(userContent, analysis);
  } else if (type === 'business-analysis') {
    return generateBAResponse(userContent, analysis);
  } else if (type === 'sales') {
    return generateSalesResponse(userContent, analysis);
  } else if (type === 'product-management') {
    return generateProductResponse(userContent, analysis);
  } else if (type === 'marketing') {
    return generateMarketingResponse(userContent, analysis);
  } else if (type === 'data-analysis') {
    return generateDataResponse(userContent, analysis);
  } else if (type === 'ml-engineering') {
    return generateMLResponse(userContent, analysis);
  } else if (type === 'data-engineering') {
    return generateDataEngResponse(userContent, analysis);
  } else if (type === 'implementation') {
    return generateImplResponse(userContent, analysis);
  } else if (type === 'system-admin') {
    return generateSysAdminResponse(userContent, analysis);
  } else if (type === 'devops') {
    return generateDevOpsResponse(userContent, analysis);
  } else if (type === 'support') {
    return generateSupportResponse(userContent, analysis);
  } else if (type === 'ux-design') {
    return generateUXResponse(userContent, analysis);
  } else if (type === 'content-design') {
    return generateContentResponse(userContent, analysis);
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

// ===== NEW AGENT RESPONSE GENERATORS =====

function generateFrontendResponse(content: string, analysis: ReturnType<typeof analyzeInput>): string {
  return `# Frontend Engineering Solution

I'll help you build a polished, accessible, and performant frontend! Here's my approach:

## 🎨 Component Architecture

\`\`\`typescript
// Design system foundation
// components/ui/button.tsx
import { forwardRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        destructive: 'bg-red-500 text-white hover:bg-red-600',
        outline: 'border border-input bg-background hover:bg-accent',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 rounded-md px-3',
        lg: 'h-11 rounded-md px-8',
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  }
);

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(({ className, variant, size, ...props }, ref) => (
  <button className={buttonVariants({ variant, size, className })} ref={ref} {...props} />
));
Button.displayName = 'Button';
export { Button, buttonVariants };
\`\`\`

## ⚡ Performance Best Practices

1. **Code Splitting** — Use dynamic imports for route-based splitting
2. **Image Optimization** — Use Next.js Image component with proper sizing
3. **Font Loading** — Use next/font with display: swap
4. **Bundle Analysis** — Monitor bundle size with @next/bundle-analyzer

## ♿ Accessibility Checklist

- Semantic HTML elements (nav, main, article, aside)
- ARIA labels for interactive elements
- Keyboard navigation support (Tab, Enter, Escape)
- Color contrast ratio >= 4.5:1
- Focus indicators visible and clear

What specific frontend component or feature would you like me to build?`;
}

function generateBackendResponse(content: string, analysis: ReturnType<typeof analyzeInput>): string {
  return `# Backend Architecture Solution

I'll design a robust, scalable backend for you! Here's my approach:

## 🏗️ API Design

\`\`\`typescript
// api/items/route.ts — Next.js App Router API
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const ItemSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  status: z.enum(['active', 'archived']).default('active'),
});

// GET /api/items — List with pagination & filtering
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const page = Math.max(1, Number(searchParams.get('page') || 1));
  const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit') || 20)));
  const status = searchParams.get('status');

  // Query with pagination
  const items = await db.item.findMany({
    where: status ? { status } : undefined,
    skip: (page - 1) * limit,
    take: limit,
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({ items, page, limit });
}

// POST /api/items — Create with validation
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = ItemSchema.parse(body);
    const item = await db.item.create({ data });
    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Validation failed' }, { status: 400 });
  }
}
\`\`\`

## 🔒 Security Best Practices

1. **Input Validation** — Always validate with Zod/Joi before processing
2. **Rate Limiting** — Implement per-IP and per-user limits
3. **Authentication** — Use JWT with short expiry + refresh tokens
4. **SQL Injection** — Use parameterized queries (Prisma handles this)

What backend system or API would you like me to architect?`;
}

function generateMobileResponse(content: string, analysis: ReturnType<typeof analyzeInput>): string {
  return `# Mobile Development Solution

I'll help you build a cross-platform mobile app! Here's my approach:

## 📱 React Native Project Structure

\`\`\`typescript
// App.tsx — Navigation setup
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

const Tab = createBottomTabNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Tab.Navigator screenOptions={{ headerShown: false }}>
        <Tab.Screen name="Home" component={HomeScreen} />
        <Tab.Screen name="Search" component={SearchScreen} />
        <Tab.Screen name="Profile" component={ProfileScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
\`\`\`

## 🔄 Offline-First Architecture

1. **Local Storage** — Use AsyncStorage + SQLite for offline data
2. **Sync Strategy** — Background sync when network is available
3. **Conflict Resolution** — Last-write-wins or custom merge logic
4. **Optimistic Updates** — Update UI immediately, sync in background

## 📲 App Store Checklist

- App icons in all required sizes (1024x1024 for store)
- Splash screens for iOS and Android
- Privacy policy URL
- App description and screenshots
- TestFlight/Internal testing complete

What mobile feature or app would you like me to build?`;
}

function generateSecurityResponse(content: string, analysis: ReturnType<typeof analyzeInput>): string {
  return `# Security Assessment & Recommendations

I'll help you secure your application! Here's my comprehensive approach:

## 🔍 OWASP Top 10 Checklist

| Risk | Status | Mitigation |
|------|--------|------------|
| A01: Broken Access Control | ⚠️ Check | Implement RBAC with least-privilege principle |
| A02: Cryptographic Failures | ⚠️ Check | Use TLS 1.3, AES-256 for data at rest |
| A03: Injection | ⚠️ Check | Parameterized queries, input validation |
| A04: Insecure Design | ⚠️ Check | Threat modeling, secure architecture review |
| A05: Security Misconfiguration | ⚠️ Check | Automated security headers, disable debug modes |
| A06: Auth Failures | ⚠️ Check | MFA, account lockout, strong password policy |
| A07: XSS | ⚠️ Check | CSP headers, output encoding, sanitize inputs |
| A08: Software Integrity | ⚠️ Check | Verify dependencies, SCA scanning |
| A09: Logging Failures | ⚠️ Check | Centralized logging, anomaly detection |
| A10: SSRF | ⚠️ Check | Allowlist external requests, disable redirects |

## 🛡️ Security Headers

\`\`\`
Content-Security-Policy: default-src 'self'; script-src 'self' 'nonce-{random}'; style-src 'self' 'unsafe-inline'
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 0
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=()
\`\`\`

What security concern would you like me to assess?`;
}

function generatePerfResponse(content: string, analysis: ReturnType<typeof analyzeInput>): string {
  return `# Performance Engineering Analysis

I'll help you optimize your system's performance! Here's my methodology:

## ⚡ Performance Audit Framework

### 1. Core Web Vitals Targets
- **LCP** (Largest Contentful Paint) < 2.5s
- **FID** (First Input Delay) < 100ms
- **CLS** (Cumulative Layout Shift) < 0.1
- **INP** (Interaction to Next Paint) < 200ms

### 2. Load Testing Strategy

\`\`\`bash
# k6 load test example
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 20 },   // Ramp up
    { duration: '1m', target: 20 },     // Sustain
    { duration: '30s', target: 100 },   // Spike
    { duration: '1m', target: 100 },    // Sustain peak
    { duration: '30s', target: 0 },     // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'],  // 95% under 500ms
    http_req_failed: ['rate<0.01'],    // <1% failure rate
  },
};

export default function () {
  const res = http.get('https://your-api.com/endpoint');
  check(res, { 'status 200': (r) => r.status === 200 });
  sleep(1);
}
\`\`\`

### 3. Optimization Checklist
- [ ] Enable gzip/brotli compression
- [ ] Implement CDN for static assets
- [ ] Database query optimization (indexes, N+1)
- [ ] Redis caching for frequent queries
- [ ] Connection pooling for database
- [ ] Image optimization (WebP, lazy loading)

What performance issue are you experiencing? I'll provide targeted optimization steps!`;
}

function generateProductResponse(content: string, analysis: ReturnType<typeof analyzeInput>): string {
  return `# Product Strategy & Planning

I'll help you build a product roadmap that aligns user needs with business goals! Here's my framework:

## 🗺️ Product Roadmap Framework

### Vision & Goals
- **North Star Metric**: Define the single metric that best captures core product value
- **OKRs**: Set quarterly Objectives with measurable Key Results
- **User Personas**: Build empathy with detailed persona profiles

### Prioritization Matrix

| Feature | Impact | Effort | Score | Priority |
|---------|--------|--------|-------|----------|
| Core workflow | High | Medium | 9 | P0 |
| Onboarding flow | High | Low | 8 | P0 |
| Analytics dashboard | Medium | Medium | 6 | P1 |
| Social sharing | Low | Low | 4 | P2 |
| Advanced settings | Low | High | 2 | P3 |

### Sprint Planning Template
1. **P0** — Must-have for launch (blockers)
2. **P1** — Should-have for competitive parity
3. **P2** — Nice-to-have for differentiation
4. **P3** — Future considerations

## 📊 Key Metrics to Track

- **Acquisition**: Signup rate, activation rate
- **Engagement**: DAU/MAU, session duration, feature adoption
- **Retention**: D1/D7/D30 retention curves
- **Revenue**: MRR, ARPU, LTV
- **Referral**: NPS, viral coefficient

What product challenge would you like to work on?`;
}

function generateMarketingResponse(content: string, analysis: ReturnType<typeof analyzeInput>): string {
  return `# Marketing Strategy & Campaign Plan

I'll help you create a data-driven marketing strategy! Here's my approach:

## 📢 Multi-Channel Campaign Framework

### Channel Mix & Budget Allocation
- **SEO & Content** (30%) — Long-term organic growth engine
- **Paid Search** (25%) — High-intent capture
- **Social Media** (20%) — Brand awareness & engagement
- **Email Marketing** (15%) — Nurture & retention
- **Partnerships** (10%) — Co-marketing & amplification

### Content Strategy Pillars
1. **Educational** — How-to guides, tutorials, best practices
2. **Thought Leadership** — Industry insights, trend analysis
3. **Case Studies** — Customer success stories with metrics
4. **Product-Led** — Feature deep dives, release highlights

## 📈 Campaign Metrics Dashboard

| Metric | Target | Current | Status |
|--------|--------|---------|--------|
| Organic Traffic | +40% QoQ | +12% | 🟡 On Track |
| Conversion Rate | 3.5% | 2.8% | 🔴 Below |
| CAC | <$50 | $62 | 🔴 Above |
| Email Open Rate | 25% | 28% | 🟢 Above |
| Social Engagement | 5% | 4.2% | 🟡 On Track |

## 🎯 SEO Quick Wins
1. Fix technical SEO issues (broken links, sitemap, robots.txt)
2. Optimize meta titles & descriptions for CTR
3. Build topic clusters around pillar content
4. Implement schema markup for rich snippets

What marketing challenge would you like to tackle?`;
}

function generateMLResponse(content: string, analysis: ReturnType<typeof analyzeInput>): string {
  return `# Machine Learning Engineering Solution

I'll help you build production-grade ML systems! Here's my approach:

## 🤖 ML Pipeline Architecture

\`\`\`
Data Ingestion → Feature Engineering → Model Training → Evaluation → Deployment → Monitoring
      ↑                                                              ↓
      └──────────── Feedback Loop (retraining triggers) ─────────────┘
\`\`\`

### Model Development Workflow

\`\`\`python
# Experiment tracking with MLflow
import mlflow
from sklearn.ensemble import GradientBoostingClassifier
from sklearn.metrics import f1_score, precision_score, recall_score

mlflow.set_experiment("customer_churn_prediction")

with mlflow.start_run():
    # Log parameters
    mlflow.log_params({
        "n_estimators": 200,
        "max_depth": 8,
        "learning_rate": 0.05,
    })

    model = GradientBoostingClassifier(
        n_estimators=200, max_depth=8, learning_rate=0.05
    )
    model.fit(X_train, y_train)

    # Evaluate & log metrics
    y_pred = model.predict(X_test)
    mlflow.log_metrics({
        "f1_score": f1_score(y_test, y_pred),
        "precision": precision_score(y_test, y_pred),
        "recall": recall_score(y_test, y_pred),
    })

    mlflow.sklearn.log_model(model, "model")
\`\`\`

## 🔬 MLOps Checklist
- [ ] Feature store for consistent feature computation
- [ ] Model versioning and registry
- [ ] A/B testing framework for model comparison
- [ ] Data drift detection and alerting
- [ ] Automated retraining pipeline
- [ ] Model explainability (SHAP/LIME)

What ML problem would you like to solve?`;
}

function generateDataEngResponse(content: string, analysis: ReturnType<typeof analyzeInput>): string {
  return `# Data Engineering Solution

I'll help you build reliable, scalable data infrastructure! Here's my approach:

## 🔧 Data Pipeline Architecture

\`\`\`
Source Systems → Ingestion Layer → Processing → Storage → Serving Layer
  (APIs/DBs)    (Kafka/Airflow)   (Spark/dbt)  (S3/DW)   (API/BI)
\`\`\`

### Modern Data Stack

\`\`\`yaml
# docker-compose.yml for local data stack
services:
  # Data Warehouse
  postgres:
    image: postgres:16
    environment:
      POSTGRES_DB: analytics

  # Orchestration
  airflow:
    image: apache/airflow:2.8
    depends_on: [postgres]

  # Transformation
  dbt:
    build:
      context: ./dbt_project

  # Streaming
  kafka:
    image: confluentinc/cp-kafka:7.5

  # Monitoring
  grafana:
    image: grafana/grafana:10
\`\`\`

## 📊 Data Quality Framework

| Check | Type | Threshold | Action |
|-------|------|-----------|--------|
| Row count | Anomaly | ±20% from avg | Alert + Pause |
| Null rate | Threshold | <5% per column | Alert + Log |
| Freshness | SLA | <1hr lag | Page + Retry |
| Uniqueness | Constraint | 100% on PK | Block + Alert |

## 🔄 Pipeline Best Practices
1. **Idempotency** — Safe to re-run without side effects
2. **Observability** — Log every step with structured metadata
3. **Error Handling** — Dead letter queues, retry with backoff
4. **Schema Evolution** — Avro/Protobuf for backward compatibility

What data pipeline challenge would you like to solve?`;
}

function generateDevOpsResponse(content: string, analysis: ReturnType<typeof analyzeInput>): string {
  return `# DevOps & CI/CD Solution

I'll help you build fast, reliable delivery pipelines! Here's my approach:

## 🚀 CI/CD Pipeline with GitHub Actions

\`\`\`yaml
# .github/workflows/deploy.yml
name: Deploy Pipeline

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: npm ci
      - run: npm test
      - run: npm run lint

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: amondnet/vercel-action@v25
        with:
          vercel-token: \${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: \${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: \${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
\`\`\`

## 🐳 Docker & Kubernetes

\`\`\`dockerfile
# Multi-stage Docker build
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
EXPOSE 3000
CMD ["node", "server.js"]
\`\`\`

## 📋 Infrastructure Checklist
- [ ] Infrastructure as Code (Terraform/Pulumi)
- [ ] Secrets management (Vault/AWS Secrets Manager)
- [ ] Monitoring & alerting (Prometheus/Grafana)
- [ ] Log aggregation (ELK/Loki)
- [ ] Auto-scaling policies
- [ ] Disaster recovery plan
- [ ] Cost optimization review

What DevOps challenge would you like to solve?`;
}

function generateUXResponse(content: string, analysis: ReturnType<typeof analyzeInput>): string {
  return `# UX Design & Research Solution

I'll help you create intuitive, user-centered designs! Here's my approach:

## ✏️ Design Thinking Process

### 1. Empathize — User Research
- **Interviews**: 1-on-1 sessions with 5-8 target users
- **Surveys**: Quantitative validation with 100+ respondents
- **Analytics**: Behavioral data analysis (heatmaps, session recordings)
- **Personas**: Build empathy maps and user personas

### 2. Define — Problem Framing
\`\`\`
How might we help [persona] achieve [goal]
while dealing with [constraint]?
\`\`\`

### 3. Ideate — Solution Exploration
- Crazy 8s exercise for rapid concept generation
- "How Might We" statements for divergent thinking
- Prioritize ideas using Impact vs. Effort matrix

### 4. Prototype — Low to High Fidelity
- **Sketches** → Paper prototypes (5 min per concept)
- **Wireframes** → Low-fi in Figma (layout & hierarchy)
- **Interactive** → Clickable prototype (flow validation)
- **Visual** → High-fi with design system tokens

### 5. Test — Validate with Users
- Moderated usability testing (5 users find 85% of issues)
- A/B testing for data-driven design decisions
- Accessibility audit (WCAG 2.1 AA compliance)

## 🎨 Design System Tokens
\`\`\`css
:root {
  /* Spacing Scale */
  --space-1: 4px;  --space-2: 8px;  --space-3: 12px;
  --space-4: 16px; --space-6: 24px; --space-8: 32px;

  /* Typography */
  --font-heading: 'Inter', sans-serif;
  --font-body: 'Inter', sans-serif;
  --text-xs: 0.75rem;  --text-sm: 0.875rem;
  --text-base: 1rem;   --text-lg: 1.125rem;
}
\`\`\`

What UX challenge would you like to work on?`;
}

function generateContentResponse(content: string, analysis: ReturnType<typeof analyzeInput>): string {
  return `# Content Strategy & Design Solution

I'll help you create clear, user-friendly content! Here's my approach:

## 📝 Content Design Framework

### Voice & Tone Guidelines
- **Clear**: Simple language, no jargon (8th grade reading level)
- **Concise**: Every word earns its place
- **Helpful**: Anticipate user questions
- **Human**: Write like you speak, not like a robot

### UX Writing Principles

\`\`\`
❌ "Error 404: Resource not found"
✅ "We couldn't find that page. Try searching or go to the homepage."

❌ "Submit the form to proceed"
✅ "Continue" or "Save changes"

❌ "Your session has been terminated due to inactivity"
✅ "You've been signed out for security. Sign in again to continue."
\`\`\`

### Content Architecture

1. **Information Hierarchy**
   - Page title → Key message → Supporting details → Related content
   - One idea per paragraph (3-5 sentences max)
   - Front-load important information (inverted pyramid)

2. **Navigation & Wayfinding**
   - Clear labels (not clever ones)
   - Breadcrumbs for deep hierarchies
   - Consistent terminology across all pages

3. **Microcopy Guide**
   - Buttons: Action verbs (Save, Delete, Continue)
   - Errors: Explain what happened + how to fix it
   - Empty states: Guide users to their first action
   - Success: Confirm what happened + next steps

## 📋 Content Audit Template

| Page | Purpose | Reading Level | Word Count | Action Needed |
|------|---------|--------------|------------|---------------|
| Home | Convert visitors | 8th grade | <300 | Simplify hero copy |
| Pricing | Enable decision | 6th grade | <500 | Add comparison table |
| Docs | Enable self-service | 10th grade | Varies | Add code examples |

What content challenge would you like to tackle?`;
}
