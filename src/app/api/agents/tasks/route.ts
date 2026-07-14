import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { agentId, title, description, priority } = body;

    if (!agentId || !title) {
      return NextResponse.json({ error: 'agentId and title are required' }, { status: 400 });
    }

    const agent = await db.agent.findUnique({ where: { id: agentId } });
    if (!agent) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    }

    // Update agent status to busy
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

    // Simulate task completion after a delay
    setTimeout(async () => {
      try {
        const responses: Record<string, string> = {
          'development': `Task "${title}" completed. Code changes have been implemented following best practices. All tests passing. Ready for review.`,
          'testing': `Task "${title}" completed. Test suite created with comprehensive coverage. Edge cases identified and tested. Quality report generated.`,
          'business-analysis': `Task "${title}" completed. Requirements documented with clear acceptance criteria. Stakeholder alignment confirmed. Specification ready for development.`,
          'sales': `Task "${title}" completed. Pipeline updated with latest deal status. Proposal drafted with competitive positioning. Next steps identified.`,
          'implementation': `Task "${title}" completed. Deployment plan validated. Configuration applied to target environment. Rollback plan documented.`,
          'data-analysis': `Task "${title}" completed. Data analyzed with statistical rigor. Key insights identified. Visualization and report generated.`,
          'system-admin': `Task "${title}" completed. Infrastructure changes applied. Monitoring dashboards updated. Health checks all green.`,
          'support': `Task "${title}" completed. Issue resolved and root cause documented. Knowledge base updated. Customer satisfaction confirmed.`,
        };

        await db.task.update({
          where: { id: task.id },
          data: {
            status: 'completed',
            result: responses[agent.type] || `Task "${title}" completed successfully.`,
          }
        });

        // Update agent stats
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
    
    const where = agentId ? { agentId } : {};
    
    const tasks = await db.task.findMany({
      where,
      include: { agent: true },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return NextResponse.json({ tasks });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
