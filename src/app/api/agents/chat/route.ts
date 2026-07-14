import { NextRequest, NextResponse } from 'next/server';
import { isVercel, memoryStore } from '@/lib/memory-store';

let db: any = null;
try {
  if (!isVercel()) {
    const { db: prismaDb } = require('@/lib/db');
    db = prismaDb;
  }
} catch (e) {}

const RESPONSES: Record<string, string[]> = {
  'development': [
    "I've analyzed the codebase and identified the key areas that need attention. Let me break this down into actionable steps with proper architecture considerations.",
    "Looking at this from a development perspective, I recommend we follow the SOLID principles here. Here's my implementation plan with estimated complexity for each component.",
    "Great question! Based on current best practices, I'd suggest we implement this using a clean architecture pattern. Let me outline the approach with specific file structures.",
    "I've reviewed the requirements and can see several implementation paths. The most maintainable approach would be to start with the core domain logic.",
    "After analyzing the technical constraints, here's my recommended stack and architecture with error handling from the start."
  ],
  'testing': [
    "I've designed a comprehensive test strategy covering unit, integration, and E2E levels. Here's the test matrix with priority rankings.",
    "Based on the risk assessment, here are the critical test paths we need to cover. I've identified 12 edge cases that could cause production issues.",
    "Let me create a test plan that balances coverage with execution speed. Starting with happy paths, then covering boundary conditions.",
    "I've identified several areas where test coverage is insufficient. Here's my prioritized testing roadmap.",
    "For this feature, I recommend a risk-based testing approach focusing on high-risk areas first."
  ],
  'business-analysis': [
    "I've mapped the current business process and identified 3 key gaps. Here's my analysis with recommended solutions.",
    "After analyzing stakeholder needs, I've created a requirements document with clear acceptance criteria.",
    "I see conflicting requirements from different stakeholders. Let me propose a resolution framework.",
    "Based on workflow analysis, I've identified optimizations that could reduce processing time by 40%.",
    "I've conducted a gap analysis. Here are the critical changes needed, organized by business impact."
  ],
  'sales': [
    "I've analyzed the deal and here's my competitive positioning strategy based on the prospect's pain points.",
    "Looking at the pipeline data, I see opportunities to accelerate 3 deals in the qualification stage.",
    "Based on the competitive landscape, I've developed objection handling plays for the top 5 concerns.",
    "I've reviewed the proposal requirements. I suggest a value-based approach with tiered options.",
    "Analyzing sales metrics, our win rate increases 35% with customer success stories in proposals."
  ],
  'implementation': [
    "I've created a detailed implementation plan with phased rollout and complete milestone schedule.",
    "For this deployment, I recommend a blue-green strategy with automated rollback triggers.",
    "I've mapped all configuration dependencies and identified 2 that need updates before go-live.",
    "Based on change impact assessment, I recommend staged rollout: 10% → 25% → 50% → 100%.",
    "I've prepared the implementation checklist with 23 critical items, 5 blocking."
  ],
  'data-analysis': [
    "I've completed the statistical analysis and found 3 significant trends with a 23% QoQ increase.",
    "After cleaning the dataset, I've identified several anomalies warranting investigation.",
    "The predictive model shows 87% accuracy. Here are feature importance rankings.",
    "I've created an interactive dashboard surfacing the 5 KPIs leadership cares about most.",
    "Based on trend analysis, I project continued growth with a seasonal dip in Q3."
  ],
  'system-admin': [
    "I've reviewed the infrastructure and identified 2 performance bottlenecks with remediation plans.",
    "Monitoring shows elevated latency on the primary database. I recommend read replicas.",
    "I've audited security configuration and found 3 findings needing immediate attention.",
    "Based on capacity planning, we'll need to scale compute within 60 days.",
    "I've created a disaster recovery runbook with RPO/RTO targets."
  ],
  'support': [
    "I've triaged the issue — it's a configuration problem. Here's the step-by-step resolution.",
    "Based on ticket patterns, a recurring issue affects 12% of users. I recommend a self-service FAQ.",
    "Issue resolved. Root cause was a race condition in the authentication flow.",
    "Looking at the issue history, there's an onboarding gap. Here's my training material update.",
    "Escalation handled, service restored. SLA impact was minimal — 4 minutes of degraded performance."
  ]
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { agentId, content } = body;

    if (!agentId || !content) {
      return NextResponse.json({ error: 'agentId and content are required' }, { status: 400 });
    }

    if (isVercel() || !db) {
      // Use memory store
      const agent = memoryStore.getAgentById(agentId);
      if (!agent) {
        return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
      }

      memoryStore.createChatMessage({ role: 'user', content, agentId });

      const typeResponses = RESPONSES[agent.type] || RESPONSES['development'];
      const response = typeResponses[Math.floor(Math.random() * typeResponses.length)];

      const message = memoryStore.createChatMessage({ role: 'agent', content: response, agentId });

      return NextResponse.json({ message });
    }

    // Use database
    await db.chatMessage.create({
      data: { role: 'user', content, agentId }
    });

    const agent = await db.agent.findUnique({ where: { id: agentId } });
    if (!agent) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    }

    const typeResponses = RESPONSES[agent.type] || RESPONSES['development'];
    const response = typeResponses[Math.floor(Math.random() * typeResponses.length)];

    const message = await db.chatMessage.create({
      data: { role: 'agent', content: response, agentId }
    });

    return NextResponse.json({ message });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const agentId = url.searchParams.get('agentId');
    
    if (!agentId) {
      return NextResponse.json({ error: 'agentId is required' }, { status: 400 });
    }

    if (isVercel() || !db) {
      const messages = memoryStore.getChatMessages(agentId);
      return NextResponse.json({ messages });
    }

    const messages = await db.chatMessage.findMany({
      where: { agentId },
      orderBy: { createdAt: 'asc' },
      take: 100,
    });

    return NextResponse.json({ messages });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
