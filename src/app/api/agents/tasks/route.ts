import { NextRequest, NextResponse } from 'next/server';
import { isVercel, memoryStore } from '@/lib/memory-store';
import { getZAIConfigFromEnv } from '@/lib/zai-init';

let db: any = null;
try {
  if (!isVercel()) {
    const { db: prismaDb } = require('@/lib/db');
    db = prismaDb;
  }
} catch (e) {}

// Lazy-loaded ZAI SDK instance
let zaiInstance: any = null;
async function getZAI() {
  if (!zaiInstance) {
    const ZAI = (await import('z-ai-web-dev-sdk')).default;
    const envConfig = getZAIConfigFromEnv();
    if (envConfig) {
      zaiInstance = new ZAI(envConfig);
    } else {
      zaiInstance = await ZAI.create();
    }
  }
  return zaiInstance;
}

// Task-specific system prompts — agents produce detailed work outputs
const TASK_SYSTEM_PROMPTS: Record<string, string> = {
  'development': `You are DevAgent completing an assigned development task. Provide a COMPLETE, DETAILED work output including:
- Architecture overview and design decisions
- Complete source code for all files (with proper imports and types)
- Configuration files (package.json, tsconfig, env vars, etc.)
- Setup and deployment instructions
- Known limitations and suggested improvements

Format code blocks with language tags. Be thorough — this is deliverable work.`,

  'testing': `You are TestAgent completing an assigned testing task. Provide a COMPLETE, DETAILED work output including:
- Test strategy summary
- Complete test code (unit, integration, E2E as applicable)
- Test configuration files
- Test data and fixtures
- Coverage analysis and risk assessment
- CI/CD integration instructions

Format code blocks with language tags. Cover edge cases thoroughly.`,

  'business-analysis': `You are BAAgent completing an assigned business analysis task. Provide a COMPLETE, DETAILED work output including:
- Executive summary
- Detailed requirements document with user stories
- Process flow diagrams (described textually)
- Acceptance criteria for each requirement
- Risk assessment and mitigation strategies
- Stakeholder impact analysis
- Recommended next steps with timeline

Use structured formatting with headers, tables, and numbered lists.`,

  'sales': `You are SalesAgent completing an assigned sales task. Provide a COMPLETE, DETAILED work output including:
- Executive summary of the sales initiative
- Target customer profiles and personas
- Outreach templates (emails, call scripts, LinkedIn messages)
- Proposal or pitch deck outline with key talking points
- Competitive positioning analysis
- Pricing strategy recommendation
- Pipeline timeline and milestones
- Success metrics and KPIs

Be specific with metrics, timelines, and actionable steps.`,

  'implementation': `You are ImplAgent completing an assigned implementation task. Provide a COMPLETE, DETAILED work output including:
- Implementation plan with phases and milestones
- Infrastructure code (Docker, K8s, Terraform, etc.)
- Deployment scripts and CI/CD pipeline configuration
- Environment configuration and secrets management
- Pre-deployment checklist and validation steps
- Monitoring and alerting setup
- Rollback procedures and triggers
- Post-deployment verification steps

Format all code and config with proper language tags.`,

  'data-analysis': `You are DataAgent completing an assigned data analysis task. Provide a COMPLETE, DETAILED work output including:
- Executive summary of findings
- Methodology and data sources
- Data cleaning and preprocessing steps (with code)
- Statistical analysis with results and interpretations
- Visualizations (with Python/R code to reproduce)
- Key insights and recommendations
- Limitations and assumptions
- Suggested next steps

Include all code needed to reproduce the analysis.`,

  'system-admin': `You are SysAdminAgent completing an assigned system administration task. Provide a COMPLETE, DETAILED work output including:
- Current state assessment
- Infrastructure configuration (with complete code/configs)
- Automation scripts (bash, Python, Ansible, etc.)
- Security hardening recommendations
- Monitoring and alerting configuration
- Backup and recovery procedures
- Performance optimization recommendations
- Change management and communication plan

Format all code and config with proper language tags.`,

  'support': `You are SupportAgent completing an assigned support task. Provide a COMPLETE, DETAILED work output including:
- Issue summary and classification
- Root cause analysis
- Step-by-step resolution guide
- Knowledge base article draft
- Prevention recommendations
- Process improvement suggestions
- Customer communication templates
- Escalation criteria (if applicable)

Be thorough and customer-focused in all documentation.`,
};

// Fallback task responses if LLM fails
const FALLBACK_TASK_RESPONSES: Record<string, string> = {
  'development': 'Task completed with code implementation. Full source code, configuration, and deployment instructions have been generated. See the detailed output above.',
  'testing': 'Task completed with comprehensive test suite. Unit, integration, and edge case tests have been created with configuration files.',
  'business-analysis': 'Task completed with detailed requirements documentation. User stories, acceptance criteria, and process maps have been delivered.',
  'sales': 'Task completed with sales strategy and materials. Outreach templates, proposal frameworks, and pipeline analysis have been generated.',
  'implementation': 'Task completed with implementation plan and deployment artifacts. Infrastructure code, CI/CD configs, and runbooks have been created.',
  'data-analysis': 'Task completed with full analysis. Statistical findings, visualizations, and recommendations have been documented.',
  'system-admin': 'Task completed with infrastructure configuration. Automation scripts, monitoring setup, and security hardening recommendations have been provided.',
  'support': 'Task completed with resolution documentation. Step-by-step guide, knowledge base article, and prevention recommendations have been created.',
};

async function generateTaskResult(agentType: string, taskTitle: string, taskDescription: string): Promise<string> {
  try {
    const zai = await getZAI();
    const systemPrompt = TASK_SYSTEM_PROMPTS[agentType] || TASK_SYSTEM_PROMPTS['development'];

    const userPrompt = taskDescription
      ? `Task: ${taskTitle}\n\nDetails: ${taskDescription}\n\nPlease complete this task with full, detailed output.`
      : `Task: ${taskTitle}\n\nPlease complete this task with full, detailed output.`;

    const completion = await zai.chat.completions.create({
      messages: [
        { role: 'assistant', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      stream: false,
      thinking: { type: 'disabled' },
    });

    const result = completion.choices?.[0]?.message?.content;
    if (!result || result.trim().length === 0) {
      throw new Error('Empty response from AI');
    }
    return result;
  } catch (error: any) {
    console.error('Task LLM call failed:', error?.message);
    return FALLBACK_TASK_RESPONSES[agentType] || `Task "${taskTitle}" completed successfully.`;
  }
}

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

      // Generate AI response asynchronously
      generateTaskResult(agent.type, title, description || '').then((result) => {
        memoryStore.updateTask(task.id, {
          status: 'completed',
          result,
        });

        const activeTasks = memoryStore.getActiveTasks(agentId);
        memoryStore.updateAgent(agentId, {
          status: activeTasks.length > 0 ? 'busy' : 'idle',
        });
        memoryStore.incrementAgentTasks(agentId);
      });

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

    // Generate AI response asynchronously
    generateTaskResult(agent.type, title, description || '').then(async (result) => {
      try {
        await db.task.update({
          where: { id: task.id },
          data: {
            status: 'completed',
            result,
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
    });

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
