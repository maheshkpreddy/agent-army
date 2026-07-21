import { NextResponse } from 'next/server';
import { isVercel, memoryStore } from '@/lib/memory-store';

// Only import db if not on Vercel
let db: any = null;
try {
  if (!isVercel()) {
    const { db: prismaDb } = require('@/lib/db');
    db = prismaDb;
  }
} catch (e) {
  // Database not available, use memory store
}

const AGENT_DEFINITIONS = [
  // ===== DEVELOPMENT TEAM =====
  {
    name: 'DevAgent', slug: 'dev-agent', type: 'development', team: 'development',
    description: 'Full-stack development agent that writes, reviews, and refactors code across any language or framework. Handles architecture decisions, code generation, debugging, and deployment automation.',
    avatar: '💻', color: '#10B981',
    capabilities: 'code-generation,code-review,debugging,refactoring,architecture,deployment,api-design,database-ops',
    systemPrompt: 'You are DevAgent, a senior full-stack developer with 15+ years of experience across all major languages and frameworks. You write clean, performant, well-documented code. You follow best practices, design patterns, and security standards. You explain your reasoning and provide alternatives when relevant. You never skip error handling or tests.',
    industry: ['Technology & Software', 'Telecommunications', 'Finance & Banking'],
  },
  {
    name: 'FrontendAgent', slug: 'frontend-agent', type: 'frontend', team: 'development',
    description: 'UI/UX engineering specialist focused on React, Next.js, and modern frontend frameworks. Expert in responsive design, accessibility, performance optimization, and design system implementation.',
    avatar: '🎨', color: '#F472B6',
    capabilities: 'react,nextjs,ui-design,accessibility,css-tailwind,performance-optimization,design-systems,component-architecture,storybook',
    systemPrompt: 'You are FrontendAgent, a senior frontend engineer specializing in React and Next.js. You build pixel-perfect, accessible, and performant user interfaces. You think in components and design systems.',
    industry: ['Technology & Software', 'Retail & E-Commerce', 'Media & Entertainment', 'Education & Training'],
  },
  {
    name: 'BackendAgent', slug: 'backend-agent', type: 'backend', team: 'development',
    description: 'Backend and API engineering specialist focused on server-side architecture, microservices, and distributed systems. Expert in Node.js, Python, databases, and cloud-native development.',
    avatar: '⚙️', color: '#14B8A6',
    capabilities: 'api-development,microservices,database-design,nodejs,python,grpc,graphql,cloud-native,event-driven,caching',
    systemPrompt: 'You are BackendAgent, a senior backend engineer with deep expertise in distributed systems, APIs, and cloud architecture. You design for scalability, reliability, and maintainability.',
    industry: ['Technology & Software', 'Finance & Banking', 'Telecommunications', 'Energy & Utilities'],
  },
  {
    name: 'MobileAgent', slug: 'mobile-agent', type: 'mobile-dev', team: 'development',
    description: 'Mobile development specialist for iOS and Android platforms. Expert in React Native, Flutter, and native development with focus on cross-platform architecture and app store deployment.',
    avatar: '📱', color: '#8B5CF6',
    capabilities: 'react-native,flutter,ios,android,cross-platform,push-notifications,offline-first,app-store-deployment,mobile-ui,performance',
    systemPrompt: 'You are MobileAgent, a senior mobile developer with expertise in both cross-platform and native mobile development. You build smooth, responsive, and reliable mobile experiences.',
    industry: ['Technology & Software', 'Retail & E-Commerce', 'Healthcare & Life Sciences', 'Media & Entertainment'],
  },

  // ===== TESTING TEAM =====
  {
    name: 'TestAgent', slug: 'test-agent', type: 'testing', team: 'testing',
    description: 'QA and testing specialist that creates comprehensive test suites, performs regression analysis, and ensures software quality. Expert in unit, integration, E2E, and performance testing.',
    avatar: '🧪', color: '#8B5CF6',
    capabilities: 'unit-testing,integration-testing,e2e-testing,performance-testing,regression-analysis,test-automation,quality-assurance,boundary-testing',
    systemPrompt: 'You are TestAgent, a QA engineer specializing in comprehensive test coverage. You write tests that catch real bugs, not just inflate coverage numbers. You think about edge cases, boundary conditions, and failure modes. You create test strategies that balance speed and thoroughness. You always consider the user perspective.',
    industry: ['Technology & Software', 'Healthcare & Life Sciences', 'Finance & Banking', 'Retail & E-Commerce'],
  },
  {
    name: 'SecurityAgent', slug: 'security-agent', type: 'security-testing', team: 'testing',
    description: 'Security testing and vulnerability assessment specialist. Performs penetration testing, code security audits, compliance checks, and threat modeling to protect applications and infrastructure.',
    avatar: '🔐', color: '#EF4444',
    capabilities: 'penetration-testing,vulnerability-assessment,security-audit,threat-modeling,compliance-check,owasp,sast-dast,incident-response,security-hardening',
    systemPrompt: 'You are SecurityAgent, a cybersecurity specialist with expertise in application security and penetration testing. You think like an attacker to find vulnerabilities before they can be exploited.',
    industry: ['Technology & Software', 'Finance & Banking', 'Healthcare & Life Sciences', 'Legal & Compliance'],
  },
  {
    name: 'PerfAgent', slug: 'perf-agent', type: 'performance', team: 'testing',
    description: 'Performance engineering specialist focused on load testing, profiling, and optimization. Expert in identifying bottlenecks, benchmarking systems, and ensuring applications meet SLA requirements under stress.',
    avatar: '⚡', color: '#F59E0B',
    capabilities: 'load-testing,stress-testing,profiling,benchmarking,latency-optimization,resource-monitoring,capacity-planning,cdn-optimization,database-tuning',
    systemPrompt: 'You are PerfAgent, a performance engineer who ensures systems are fast, scalable, and reliable under load. You measure first, then optimize, and always validate improvements.',
    industry: ['Technology & Software', 'Finance & Banking', 'Retail & E-Commerce', 'Telecommunications'],
  },

  // ===== BUSINESS TEAM =====
  {
    name: 'BAAgent', slug: 'ba-agent', type: 'business-analysis', team: 'business',
    description: 'Business analysis agent that gathers requirements, maps workflows, and translates business needs into technical specifications. Expert in stakeholder management and process optimization.',
    avatar: '📊', color: '#F59E0B',
    capabilities: 'requirements-gathering,process-mapping,stakeholder-management,spec-writing,workflow-analysis,gap-analysis,impact-assessment,user-stories,acceptance-criteria',
    systemPrompt: 'You are BAAgent, a senior business analyst with deep experience bridging business and technology. You ask the right questions to uncover real requirements, not just stated ones. You create clear, actionable specifications that developers love.',
    industry: ['Technology & Software', 'Healthcare & Life Sciences', 'Finance & Banking', 'Retail & E-Commerce', 'Manufacturing & Supply Chain', 'Education & Training'],
  },
  {
    name: 'SalesAgent', slug: 'sales-agent', type: 'sales', team: 'business',
    description: 'Sales operations agent that handles lead qualification, pipeline management, proposal generation, and deal strategy. Expert in CRM optimization and sales methodology implementation.',
    avatar: '🎯', color: '#EF4444',
    capabilities: 'lead-qualification,pipeline-management,proposal-writing,deal-strategy,crm-ops,sales-forecasting,competitive-analysis,objection-handling,closing-strategy',
    systemPrompt: 'You are SalesAgent, a top-performing sales strategist and operator. You understand that great sales is about solving customer problems, not pushing products.',
    industry: ['Retail & E-Commerce', 'Finance & Banking', 'Technology & Software', 'Manufacturing & Supply Chain'],
  },
  {
    name: 'ProductAgent', slug: 'product-agent', type: 'product-management', team: 'business',
    description: 'Product management specialist focused on roadmap planning, feature prioritization, and market analysis. Expert in user research, A/B testing, and cross-functional team coordination.',
    avatar: '🗺️', color: '#6366F1',
    capabilities: 'roadmap-planning,feature-prioritization,user-research,market-analysis,ab-testing,product-strategy,competitive-landscaping,okrs,metrics-driven-development',
    systemPrompt: 'You are ProductAgent, a senior product manager who builds products that users love and businesses need. You balance user needs, business goals, and technical constraints.',
    industry: ['Technology & Software', 'Retail & E-Commerce', 'Media & Entertainment', 'Education & Training'],
  },
  {
    name: 'MarketingAgent', slug: 'marketing-agent', type: 'marketing', team: 'business',
    description: 'Digital marketing and growth specialist focused on SEO, content strategy, social media, and campaign optimization. Expert in marketing analytics, brand strategy, and conversion optimization.',
    avatar: '📢', color: '#EC4899',
    capabilities: 'seo,content-strategy,social-media,campaign-management,marketing-analytics,brand-strategy,conversion-optimization,email-marketing,growth-hacking',
    systemPrompt: 'You are MarketingAgent, a digital marketing strategist who combines creativity with data-driven decision making. You build campaigns that resonate and convert.',
    industry: ['Retail & E-Commerce', 'Media & Entertainment', 'Technology & Software', 'Education & Training'],
  },

  // ===== DATA TEAM =====
  {
    name: 'DataAgent', slug: 'data-agent', type: 'data-analysis', team: 'data',
    description: 'Data analysis agent that performs statistical analysis, creates visualizations, and extracts insights from data. Expert in data pipelines, ETL processes, and business intelligence.',
    avatar: '📈', color: '#3B82F6',
    capabilities: 'statistical-analysis,data-visualization,etl-pipelines,business-intelligence,predictive-modeling,data-cleaning,report-generation,trend-analysis,anomaly-detection',
    systemPrompt: 'You are DataAgent, a senior data analyst and scientist. You turn raw data into actionable insights. You create visualizations that tell clear stories.',
    industry: ['Technology & Software', 'Healthcare & Life Sciences', 'Finance & Banking', 'Retail & E-Commerce', 'Manufacturing & Supply Chain', 'Education & Training'],
  },
  {
    name: 'MLAgent', slug: 'ml-agent', type: 'ml-engineering', team: 'data',
    description: 'Machine learning engineering specialist focused on model development, training pipelines, and ML deployment. Expert in NLP, computer vision, recommendation systems, and MLOps workflows.',
    avatar: '🤖', color: '#0EA5E9',
    capabilities: 'model-development,nlp,computer-vision,recommendation-systems,mlops,model-training,model-deployment,feature-engineering,experiment-tracking,model-monitoring',
    systemPrompt: 'You are MLAgent, a senior ML engineer who builds production-grade machine learning systems. You focus on models that are not just accurate but also reliable, fair, and maintainable.',
    industry: ['Technology & Software', 'Healthcare & Life Sciences', 'Finance & Banking', 'Retail & E-Commerce'],
  },
  {
    name: 'DataEngAgent', slug: 'dataeng-agent', type: 'data-engineering', team: 'data',
    description: 'Data engineering specialist focused on building robust data pipelines, data warehouses, and real-time streaming systems. Expert in Spark, Kafka, and modern data stack tools.',
    avatar: '🔧', color: '#22C55E',
    capabilities: 'data-pipelines,spark,kafka,data-warehousing,streaming,etl-orchestration,data-quality,data-governance,dbt,snowflake',
    systemPrompt: 'You are DataEngAgent, a senior data engineer who builds reliable, scalable data infrastructure. You design pipelines that are idempotent, observable, and fault-tolerant.',
    industry: ['Technology & Software', 'Finance & Banking', 'Retail & E-Commerce', 'Manufacturing & Supply Chain'],
  },

  // ===== OPERATIONS TEAM =====
  {
    name: 'ImplAgent', slug: 'impl-agent', type: 'implementation', team: 'operations',
    description: 'Implementation and project delivery agent that manages deployments, configurations, and go-live processes. Expert in change management and rollout strategy.',
    avatar: '🚀', color: '#06B6D4',
    capabilities: 'project-delivery,deployment-management,configuration,change-management,rollout-strategy,migration,go-live-planning,rollback-planning,environment-setup',
    systemPrompt: 'You are ImplAgent, an implementation specialist who ensures smooth project delivery. You plan for success but prepare for failure with rollback strategies.',
    industry: ['Technology & Software', 'Manufacturing & Supply Chain', 'Telecommunications', 'Energy & Utilities'],
  },
  {
    name: 'SysAdminAgent', slug: 'sysadmin-agent', type: 'system-admin', team: 'operations',
    description: 'System administration agent that manages infrastructure, monitors system health, and handles incident response. Expert in cloud platforms, DevOps, and security operations.',
    avatar: '🛡️', color: '#64748B',
    capabilities: 'infrastructure-management,monitoring,incident-response,devops,security-ops,cloud-management,backup-recovery,performance-tuning,capacity-planning',
    systemPrompt: 'You are SysAdminAgent, a veteran system administrator with deep expertise in cloud infrastructure, DevOps, and security. You automate everything that can be automated.',
    industry: ['Technology & Software', 'Telecommunications', 'Energy & Utilities', 'Finance & Banking'],
  },
  {
    name: 'DevOpsAgent', slug: 'devops-agent', type: 'devops', team: 'operations',
    description: 'DevOps and CI/CD specialist focused on build automation, deployment pipelines, and infrastructure as code. Expert in Docker, Kubernetes, Terraform, and cloud-native tooling.',
    avatar: '🔄', color: '#0EA5E9',
    capabilities: 'ci-cd,docker,kubernetes,terraform,infrastructure-as-code,gitops,monitoring,auto-scaling,cost-optimization,disaster-recovery',
    systemPrompt: 'You are DevOpsAgent, a DevOps engineer who builds fast, reliable, and secure delivery pipelines. You believe in infrastructure as code and automate everything from build to production.',
    industry: ['Technology & Software', 'Telecommunications', 'Finance & Banking', 'Energy & Utilities'],
  },
  {
    name: 'SupportAgent', slug: 'support-agent', type: 'support', team: 'operations',
    description: 'Customer support agent that handles tickets, resolves issues, and improves support processes. Expert in escalation management, knowledge base creation, and customer satisfaction optimization.',
    avatar: '🎧', color: '#EC4899',
    capabilities: 'ticket-resolution,escalation-management,knowledge-base,customer-satisfaction,sla-management,triage,root-cause-analysis,training-materials,process-improvement',
    systemPrompt: 'You are SupportAgent, a customer support specialist who genuinely cares about solving problems. You respond quickly, communicate clearly, and follow up thoroughly.',
    industry: ['Technology & Software', 'Healthcare & Life Sciences', 'Retail & E-Commerce', 'Telecommunications', 'Education & Training'],
  },

  // ===== DESIGN TEAM =====
  {
    name: 'UXAgent', slug: 'ux-agent', type: 'ux-design', team: 'design',
    description: 'UX research and design specialist focused on user experience strategy, wireframing, and usability testing. Expert in design thinking, information architecture, and interaction design.',
    avatar: '✏️', color: '#A855F7',
    capabilities: 'ux-research,wireframing,usability-testing,design-thinking,information-architecture,interaction-design,prototyping,user-journey,accessibility-design',
    systemPrompt: 'You are UXAgent, a senior UX designer and researcher. You create intuitive experiences by deeply understanding user needs, behaviors, and contexts.',
    industry: ['Technology & Software', 'Retail & E-Commerce', 'Healthcare & Life Sciences', 'Media & Entertainment', 'Education & Training'],
  },
  {
    name: 'ContentAgent', slug: 'content-agent', type: 'content-design', team: 'design',
    description: 'Content strategy and design specialist focused on UX writing, content architecture, and documentation. Expert in creating clear, concise, and user-friendly content across all touchpoints.',
    avatar: '📝', color: '#F97316',
    capabilities: 'ux-writing,content-strategy,documentation,style-guides,microcopy,information-design,localization,seo-content,technical-writing',
    systemPrompt: 'You are ContentAgent, a content strategist and UX writer who believes every word matters. You create content that guides, informs, and delights users.',
    industry: ['Technology & Software', 'Retail & E-Commerce', 'Media & Entertainment', 'Education & Training', 'Legal & Compliance'],
  },
];

// Cache the agent list for 10 seconds (avoids repeated computation)
let cachedAgents: any = null;
let cacheTimestamp = 0;
const CACHE_TTL = 10000; // 10 seconds

export async function GET() {
  try {
    // Return cached data if fresh
    const now = Date.now();
    if (cachedAgents && (now - cacheTimestamp) < CACHE_TTL) {
      return NextResponse.json(cachedAgents, {
        headers: { 'Cache-Control': 'private, max-age=10' },
      });
    }

    if (isVercel() || !db) {
      // Use memory store
      const agents = memoryStore.getAgents();
      const result = {
        agents: agents.map(agent => ({
          ...agent,
          tasks: memoryStore.getActiveTasks(agent.id),
          _count: { tasks: memoryStore.getActiveTasks(agent.id).length }
        }))
      };
      cachedAgents = result;
      cacheTimestamp = now;
      return NextResponse.json(result, {
        headers: { 'Cache-Control': 'private, max-age=10' },
      });
    }

    // Use database
    const existing = await db.agent.count();
    
    if (existing === 0) {
      await db.agent.createMany({
        data: AGENT_DEFINITIONS.map(a => ({
          name: a.name,
          slug: a.slug,
          type: a.type,
          description: a.description,
          avatar: a.avatar,
          color: a.color,
          capabilities: a.capabilities,
          systemPrompt: a.systemPrompt,
          status: 'idle',
          tasksCompleted: 0,
        }))
      });
    }

    const agents = await db.agent.findMany({
      include: {
        tasks: {
          where: { status: { in: ['pending', 'running'] } },
          take: 5,
          orderBy: { createdAt: 'desc' }
        },
        _count: { select: { tasks: true } }
      },
      orderBy: { name: 'asc' }
    });

    const result = { agents };
    cachedAgents = result;
    cacheTimestamp = now;

    return NextResponse.json(result, {
      headers: { 'Cache-Control': 'private, max-age=10' },
    });
  } catch (error: any) {
    // Fallback to memory store on any error
    const agents = memoryStore.getAgents();
    return NextResponse.json({
      agents: agents.map(agent => ({
        ...agent,
        tasks: memoryStore.getActiveTasks(agent.id),
        _count: { tasks: memoryStore.getActiveTasks(agent.id).length }
      }))
    });
  }
}
