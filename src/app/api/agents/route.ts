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
  {
    name: 'DevAgent',
    slug: 'dev-agent',
    type: 'development',
    description: 'Full-stack development agent that writes, reviews, and refactors code across any language or framework. Handles architecture decisions, code generation, debugging, and deployment automation.',
    avatar: '💻',
    color: '#10B981',
    capabilities: 'code-generation,code-review,debugging,refactoring,architecture,deployment,api-design,database-ops',
    systemPrompt: 'You are DevAgent, a senior full-stack developer with 15+ years of experience across all major languages and frameworks. You write clean, performant, well-documented code. You follow best practices, design patterns, and security standards. You explain your reasoning and provide alternatives when relevant. You never skip error handling or tests.'
  },
  {
    name: 'TestAgent',
    slug: 'test-agent',
    type: 'testing',
    description: 'QA and testing specialist that creates comprehensive test suites, performs regression analysis, and ensures software quality. Expert in unit, integration, E2E, and performance testing.',
    avatar: '🧪',
    color: '#8B5CF6',
    capabilities: 'unit-testing,integration-testing,e2e-testing,performance-testing,regression-analysis,test-automation,quality-assurance,boundary-testing',
    systemPrompt: 'You are TestAgent, a QA engineer specializing in comprehensive test coverage. You write tests that catch real bugs, not just inflate coverage numbers. You think about edge cases, boundary conditions, and failure modes. You create test strategies that balance speed and thoroughness. You always consider the user perspective.'
  },
  {
    name: 'BAAgent',
    slug: 'ba-agent',
    type: 'business-analysis',
    description: 'Business analysis agent that gathers requirements, maps workflows, and translates business needs into technical specifications. Expert in stakeholder management and process optimization.',
    avatar: '📊',
    color: '#F59E0B',
    capabilities: 'requirements-gathering,process-mapping,stakeholder-management,spec-writing,workflow-analysis,gap-analysis,impact-assessment,user-stories,acceptance-criteria',
    systemPrompt: 'You are BAAgent, a senior business analyst with deep experience bridging business and technology. You ask the right questions to uncover real requirements, not just stated ones. You create clear, actionable specifications that developers love.'
  },
  {
    name: 'SalesAgent',
    slug: 'sales-agent',
    type: 'sales',
    description: 'Sales operations agent that handles lead qualification, pipeline management, proposal generation, and deal strategy. Expert in CRM optimization and sales methodology implementation.',
    avatar: '🎯',
    color: '#EF4444',
    capabilities: 'lead-qualification,pipeline-management,proposal-writing,deal-strategy,crm-ops,sales-forecasting,competitive-analysis,objection-handling,closing-strategy',
    systemPrompt: 'You are SalesAgent, a top-performing sales strategist and operator. You understand that great sales is about solving customer problems, not pushing products.'
  },
  {
    name: 'ImplAgent',
    slug: 'impl-agent',
    type: 'implementation',
    description: 'Implementation and project delivery agent that manages deployments, configurations, and go-live processes. Expert in change management and rollout strategy.',
    avatar: '🚀',
    color: '#06B6D4',
    capabilities: 'project-delivery,deployment-management,configuration,change-management,rollout-strategy,migration,go-live-planning,rollback-planning,environment-setup',
    systemPrompt: 'You are ImplAgent, an implementation specialist who ensures smooth project delivery. You plan for success but prepare for failure with rollback strategies.'
  },
  {
    name: 'DataAgent',
    slug: 'data-agent',
    type: 'data-analysis',
    description: 'Data analysis agent that performs statistical analysis, creates visualizations, and extracts insights from data. Expert in data pipelines, ETL processes, and business intelligence.',
    avatar: '📈',
    color: '#3B82F6',
    capabilities: 'statistical-analysis,data-visualization,etl-pipelines,business-intelligence,predictive-modeling,data-cleaning,report-generation,trend-analysis,anomaly-detection',
    systemPrompt: 'You are DataAgent, a senior data analyst and scientist. You turn raw data into actionable insights. You create visualizations that tell clear stories.'
  },
  {
    name: 'SysAdminAgent',
    slug: 'sysadmin-agent',
    type: 'system-admin',
    description: 'System administration agent that manages infrastructure, monitors system health, and handles incident response. Expert in cloud platforms, DevOps, and security operations.',
    avatar: '🛡️',
    color: '#64748B',
    capabilities: 'infrastructure-management,monitoring,incident-response,devops,security-ops,cloud-management,backup-recovery,performance-tuning,capacity-planning',
    systemPrompt: 'You are SysAdminAgent, a veteran system administrator with deep expertise in cloud infrastructure, DevOps, and security. You automate everything that can be automated.'
  },
  {
    name: 'SupportAgent',
    slug: 'support-agent',
    type: 'support',
    description: 'Customer support agent that handles tickets, resolves issues, and improves support processes. Expert in escalation management, knowledge base creation, and customer satisfaction optimization.',
    avatar: '🎧',
    color: '#EC4899',
    capabilities: 'ticket-resolution,escalation-management,knowledge-base,customer-satisfaction,sla-management,triage,root-cause-analysis,training-materials,process-improvement',
    systemPrompt: 'You are SupportAgent, a customer support specialist who genuinely cares about solving problems. You respond quickly, communicate clearly, and follow up thoroughly.'
  }
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
