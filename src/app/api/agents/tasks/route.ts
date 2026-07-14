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
    "Great question! Based on current best practices, I'd suggest we implement this using a clean architecture pattern. Let me outline the approach with specific file structures and dependencies.",
    "I've reviewed the requirements and can see several implementation paths. The most maintainable approach would be to start with the core domain logic and work outward. Let me detail the layers.",
    "After analyzing the technical constraints, here's my recommended stack and architecture. I'll include error handling, logging, and monitoring from the start — not as afterthoughts."
  ],
  'testing': [
    "I've designed a comprehensive test strategy covering unit, integration, and E2E levels. Here's the test matrix with priority rankings for each scenario.",
    "Based on the risk assessment, here are the critical test paths we need to cover. I've identified 12 edge cases that could cause production issues if left untested.",
    "Let me create a test plan that balances coverage with execution speed. I recommend starting with the happy paths, then systematically covering boundary conditions and error states.",
    "I've identified several areas where test coverage is insufficient. Here's my prioritized testing roadmap with specific test cases for each component.",
    "For this feature, I recommend a risk-based testing approach. Here are the high-risk areas that need thorough testing, and the lower-risk areas where we can use lighter coverage."
  ],
  'business-analysis': [
    "I've mapped the current business process and identified 3 key gaps. Here's my analysis with recommended solutions for each gap, including effort estimates.",
    "After analyzing stakeholder needs, I've created a requirements document with clear acceptance criteria. Here are the key business rules and their priority classifications.",
    "I see several conflicting requirements from different stakeholders. Let me propose a resolution framework that addresses the core business need while managing trade-offs.",
    "Based on the current workflow analysis, I've identified optimization opportunities that could reduce processing time by 40%. Here's the proposed process map with changes highlighted.",
    "I've conducted a gap analysis between current state and desired state. Here are the critical changes needed, organized by business impact and implementation complexity."
  ],
  'sales': [
    "I've analyzed the deal and here's my competitive positioning strategy. Based on the prospect's pain points, I recommend leading with our integration capabilities and time-to-value metrics.",
    "Looking at the pipeline data, I see opportunities to accelerate 3 deals in the qualification stage. Here's my recommended outreach sequence with personalized messaging for each.",
    "Based on the competitive landscape, I've developed objection handling plays for the top 5 concerns prospects raise. Here's the framework with specific talking points.",
    "I've reviewed the proposal requirements and here's my recommended pricing structure. I suggest a value-based approach with tiered options that create natural upsell paths.",
    "Analyzing the sales metrics, I see our win rate increases 35% when we include customer success stories in proposals. Here's my template incorporating that insight."
  ],
  'implementation': [
    "I've created a detailed implementation plan with phased rollout. Phase 1 targets core functionality with a 2-week timeline. Here's the complete milestone schedule with dependencies.",
    "For this deployment, I recommend a blue-green strategy with automated rollback triggers. Here's the deployment runbook with pre-flight checks and success criteria.",
    "I've mapped all the configuration dependencies and identified 2 that need to be updated before go-live. Here's the configuration change sequence with validation steps.",
    "Based on the change impact assessment, I recommend a staged rollout: 10% → 25% → 50% → 100%. Here's the monitoring plan with rollback triggers at each stage.",
    "I've prepared the implementation checklist with 23 critical items. 5 are blocking and must be resolved before we proceed. Here's the priority order with estimated resolution times."
  ],
  'data-analysis': [
    "I've completed the statistical analysis and found 3 significant trends. The data shows a 23% quarter-over-quarter increase in the key metric. Here are the confidence intervals and p-values.",
    "After cleaning and normalizing the dataset, I've identified several anomalies that warrant investigation. Here's my analysis with recommended next steps for each anomaly.",
    "The predictive model shows 87% accuracy on the validation set. Here are the feature importance rankings and the key drivers behind the predictions.",
    "I've created an interactive dashboard that surfaces the 5 KPIs leadership cares about most. Here's the analysis with drill-down capabilities for each metric.",
    "Based on the trend analysis, I project continued growth with a seasonal dip expected in Q3. Here's the forecast with confidence bands and the key assumptions behind the model."
  ],
  'system-admin': [
    "I've reviewed the infrastructure and identified 2 performance bottlenecks. Here's my remediation plan with specific configuration changes and expected improvements.",
    "The monitoring data shows elevated latency on the primary database. I recommend implementing read replicas and connection pooling. Here's the implementation timeline.",
    "I've audited the security configuration and found 3 findings that need immediate attention. Here's the remediation plan ordered by risk severity.",
    "Based on capacity planning analysis, we'll need to scale the compute layer within 60 days. Here's my recommendation for auto-scaling configuration with cost optimization.",
    "I've created a disaster recovery runbook with RPO/RTO targets. Here are the backup verification steps and failover procedures for each critical service."
  ],
  'support': [
    "I've triaged the issue and identified it as a configuration problem. Here's the step-by-step resolution with screenshots. I've also updated the knowledge base to prevent future occurrences.",
    "Based on the ticket pattern analysis, I see a recurring issue affecting 12% of users. I recommend creating a self-service FAQ and implementing a product fix. Here's the detailed plan.",
    "I've resolved the issue and identified the root cause as a race condition in the authentication flow. Here's the detailed incident report with prevention recommendations.",
    "Looking at the customer's issue history, I see a pattern that suggests an onboarding gap. Here's my recommended training material update to reduce similar tickets by 50%.",
    "I've handled the escalation and restored service. The SLA impact was minimal — 4 minutes of degraded performance. Here's the post-incident review with process improvements."
  ]
};

const TASK_RESPONSES: Record<string, string> = {
  'development': 'Task completed. Code changes have been implemented following best practices. All tests passing. Ready for review.',
  'testing': 'Task completed. Test suite created with comprehensive coverage. Edge cases identified and tested. Quality report generated.',
  'business-analysis': 'Task completed. Requirements documented with clear acceptance criteria. Stakeholder alignment confirmed. Specification ready for development.',
  'sales': 'Task completed. Pipeline updated with latest deal status. Proposal drafted with competitive positioning. Next steps identified.',
  'implementation': 'Task completed. Deployment plan validated. Configuration applied to target environment. Rollback plan documented.',
  'data-analysis': 'Task completed. Data analyzed with statistical rigor. Key insights identified. Visualization and report generated.',
  'system-admin': 'Task completed. Infrastructure changes applied. Monitoring dashboards updated. Health checks all green.',
  'support': 'Task completed. Issue resolved and root cause documented. Knowledge base updated. Customer satisfaction confirmed.',
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { agentId, title, description, priority } = body;

    if (!agentId || !title) {
      return NextResponse.json({ error: 'agentId and title are required' }, { status: 400 });
    }

    if (isVercel() || !db) {
      // Use memory store
      const agent = memoryStore.getAgentById(agentId);
      if (!agent) {
        return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
      }

      memoryStore.updateAgent(agentId, { status: 'busy' });

      const task = memoryStore.createTask({
        title,
        description: description || '',
        priority: priority || 'medium',
        agentId,
        status: 'running',
        result: null,
      });

      // Simulate completion
      setTimeout(() => {
        memoryStore.updateTask(task.id, {
          status: 'completed',
          result: TASK_RESPONSES[agent.type] || `Task "${title}" completed successfully.`,
        });

        const activeTasks = memoryStore.getActiveTasks(agentId);
        memoryStore.updateAgent(agentId, {
          status: activeTasks.length > 0 ? 'busy' : 'idle',
        });
        memoryStore.incrementAgentTasks(agentId);
      }, 3000 + Math.random() * 4000);

      return NextResponse.json({ task });
    }

    // Use database
    const agent = await db.agent.findUnique({ where: { id: agentId } });
    if (!agent) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    }

    await db.agent.update({
      where: { id: agentId },
      data: { status: 'busy' }
    });

    const task = await db.task.create({
      data: {
        title,
        description: description || '',
        priority: priority || 'medium',
        agentId,
        status: 'running',
      }
    });

    setTimeout(async () => {
      try {
        await db.task.update({
          where: { id: task.id },
          data: {
            status: 'completed',
            result: TASK_RESPONSES[agent.type] || `Task "${title}" completed successfully.`,
          }
        });

        const pendingTasks = await db.task.count({
          where: { agentId, status: { in: ['pending', 'running'] } }
        });

        await db.agent.update({
          where: { id: agentId },
          data: {
            status: pendingTasks > 0 ? 'busy' : 'idle',
            tasksCompleted: { increment: 1 }
          }
        });
      } catch (e) {
        console.error('Task completion error:', e);
      }
    }, 3000 + Math.random() * 4000);

    return NextResponse.json({ task });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const agentId = url.searchParams.get('agentId');
    
    if (isVercel() || !db) {
      const tasks = memoryStore.getTasks(agentId || undefined);
      return NextResponse.json({ tasks });
    }

    const where = agentId ? { agentId } : {};
    
    const tasks = await db.task.findMany({
      where,
      include: { agent: true },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return NextResponse.json({ tasks });
  } catch (error: any) {
    const tasks = memoryStore.getTasks();
    return NextResponse.json({ tasks });
  }
}
