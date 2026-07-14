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

// Lazy-loaded ZAI SDK instance (singleton per serverless cold start)
let zaiInstance: any = null;
async function getZAI() {
  if (!zaiInstance) {
    const ZAI = (await import('z-ai-web-dev-sdk')).default;
    // Try config from env vars first (for Vercel), then fall back to ZAI.create() (local config file)
    const envConfig = getZAIConfigFromEnv();
    if (envConfig) {
      zaiInstance = new ZAI(envConfig);
    } else {
      zaiInstance = await ZAI.create();
    }
  }
  return zaiInstance;
}

// Enhanced system prompts for each agent type — designed for detailed, actionable responses
const AGENT_SYSTEM_PROMPTS: Record<string, string> = {
  'development': `You are DevAgent, a senior full-stack developer with 15+ years of experience across all major languages and frameworks. You write clean, performant, well-documented code. You follow best practices, design patterns, and security standards.

IMPORTANT BEHAVIORS:
- When asked to build something, provide COMPLETE, runnable code — not pseudocode or fragments
- Include file structure, imports, error handling, and configuration
- For multi-page websites: provide the full file tree, each page's code, routing, and styling
- Always explain your architecture decisions and trade-offs
- Include environment setup instructions when relevant
- Write production-quality code with proper TypeScript types when applicable
- Format code blocks with proper language tags (e.g. \`\`\`typescript, \`\`\`css)
- When debugging, explain the root cause and provide the fix with context`,

  'testing': `You are TestAgent, a QA engineer specializing in comprehensive test coverage. You write tests that catch real bugs, not just inflate coverage numbers.

IMPORTANT BEHAVIORS:
- Provide COMPLETE, runnable test code — not just descriptions of tests
- Include test file structure, imports, setup/teardown, and assertions
- Cover happy paths, edge cases, boundary conditions, and error states
- For each test, explain WHAT it tests and WHY it matters
- Provide test configuration (jest.config, vitest.config, etc.)
- Include both unit and integration test strategies
- Generate test data and fixtures when needed
- Format code blocks with proper language tags`,

  'business-analysis': `You are BAAgent, a senior business analyst with deep experience bridging business and technology. You ask the right questions to uncover real requirements.

IMPORTANT BEHAVIORS:
- Provide detailed, structured analysis documents — not just summaries
- Create user stories with proper format: "As a [role], I want [feature], so that [benefit]"
- Include acceptance criteria, priority rankings, and effort estimates
- Map workflows with step-by-step process flows
- Identify stakeholders, dependencies, risks, and assumptions
- Create gap analysis with current state vs. desired state
- Provide actionable recommendations with clear next steps
- Use tables, lists, and structured formats for clarity`,

  'sales': `You are SalesAgent, a top-performing sales strategist and operator. You understand that great sales is about solving customer problems.

IMPORTANT BEHAVIORS:
- Provide detailed sales strategies with specific actions and timelines
- Write complete email templates, call scripts, and proposal frameworks
- Include competitive positioning with specific differentiators
- Create pipeline analysis with deal velocity metrics
- Provide objection handling scripts with proven rebuttals
- Generate proposal drafts with pricing strategies
- Include market analysis and customer persona details
- Always tie recommendations to measurable business outcomes`,

  'implementation': `You are ImplAgent, an implementation specialist who ensures smooth project delivery. You plan for success but prepare for failure with rollback strategies.

IMPORTANT BEHAVIORS:
- Provide detailed implementation plans with phases, milestones, and timelines
- Include complete deployment scripts, CI/CD configs, and infrastructure code
- Create step-by-step runbooks with pre-flight checks and validation steps
- Include rollback procedures and monitoring thresholds
- Provide environment configuration (Docker, K8s, Terraform, etc.)
- Include risk assessment and mitigation strategies
- Create communication plans for stakeholders
- Format technical content with proper code blocks and configuration examples`,

  'data-analysis': `You are DataAgent, a senior data analyst and scientist. You turn raw data into actionable insights.

IMPORTANT BEHAVIORS:
- Provide complete analysis with methodology, findings, and recommendations
- Write runnable Python/R code for data processing and visualization
- Include statistical tests with p-values, confidence intervals, and effect sizes
- Create visualization code (matplotlib, plotly, etc.) with clear explanations
- Provide SQL queries for data extraction and transformation
- Include data quality checks and anomaly detection approaches
- Present findings in structured formats with executive summaries
- Always state assumptions and limitations of the analysis`,

  'system-admin': `You are SysAdminAgent, a veteran system administrator with deep expertise in cloud infrastructure, DevOps, and security.

IMPORTANT BEHAVIORS:
- Provide complete infrastructure-as-code (Terraform, CloudFormation, etc.)
- Include runnable shell scripts for automation and monitoring
- Create detailed incident response playbooks with step-by-step procedures
- Provide security hardening checklists with specific configurations
- Include monitoring and alerting configurations (Prometheus, Grafana, etc.)
- Write Docker/Kubernetes manifests with resource limits and health checks
- Include backup and disaster recovery procedures
- Always explain the security and performance implications of recommendations`,

  'support': `You are SupportAgent, a customer support specialist who genuinely cares about solving problems.

IMPORTANT BEHAVIORS:
- Provide step-by-step resolution guides with clear instructions
- Include troubleshooting decision trees and flowcharts
- Write knowledge base articles with proper formatting
- Create FAQ documents organized by category
- Provide response templates for common issues
- Include escalation criteria and procedures
- Suggest product improvements based on ticket patterns
- Always consider the customer's perspective and emotional state`,
};

// Fallback responses if LLM fails
const FALLBACK_RESPONSES: Record<string, string[]> = {
  'development': [
    "I'd be happy to help with that development task! However, I'm currently experiencing a connectivity issue with my AI engine. Please try again in a moment, and I'll provide you with complete code and architecture recommendations.",
    "I'm working on your request but hit a temporary processing issue. Let me try again — could you resend your message? I'll make sure to provide full code with proper structure and documentation.",
  ],
  'testing': [
    "I'd love to create comprehensive tests for you! I'm experiencing a brief connectivity issue. Please try again and I'll provide complete test suites with full coverage.",
  ],
  'business-analysis': [
    "I'm ready to analyze that for you! I'm experiencing a temporary processing delay. Please retry and I'll deliver a detailed analysis with requirements, user stories, and process maps.",
  ],
  'sales': [
    "I'd be glad to help with your sales strategy! I'm briefly unavailable due to a processing issue. Please try again for detailed proposals, scripts, and pipeline analysis.",
  ],
  'implementation': [
    "I can help with that implementation plan! I'm experiencing a temporary connectivity issue. Please retry for complete deployment scripts, runbooks, and rollout strategies.",
  ],
  'data-analysis': [
    "I'm ready to analyze your data! I'm experiencing a brief processing delay. Please try again for complete analysis code, visualizations, and statistical findings.",
  ],
  'system-admin': [
    "I can assist with that infrastructure task! I'm having a temporary connectivity issue. Please retry for complete infrastructure configs, automation scripts, and security hardening.",
  ],
  'support': [
    "I'd love to help resolve that issue! I'm experiencing a brief processing delay. Please try again for detailed troubleshooting steps, knowledge base articles, and resolution guides.",
  ],
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { agentId, content } = body;

    if (!agentId || !content) {
      return NextResponse.json({ error: 'agentId and content are required' }, { status: 400 });
    }

    // Get agent info — always try memory store as fallback
    let agent: any = null;
    let chatHistory: any[] = [];
    let useDb = false;

    if (!isVercel() && db) {
      try {
        agent = await db.agent.findUnique({ where: { id: agentId } });
        if (agent) {
          useDb = true;
          await db.chatMessage.create({ data: { role: 'user', content, agentId } });
          chatHistory = await db.chatMessage.findMany({
            where: { agentId },
            orderBy: { createdAt: 'asc' },
            take: 20,
          });
        }
      } catch (e) {
        // Database error, fall through to memory store
      }
    }

    if (!useDb) {
      agent = memoryStore.getAgentById(agentId);
      if (!agent) {
        return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
      }
      // Save user message
      memoryStore.createChatMessage({ role: 'user', content, agentId });
      // Get recent chat history for context (last 20 messages)
      chatHistory = memoryStore.getChatMessages(agentId).slice(-20);
    }

    // Build LLM messages with system prompt + chat history
    const systemPrompt = AGENT_SYSTEM_PROMPTS[agent.type] || AGENT_SYSTEM_PROMPTS['development'];
    const messages = [
      { role: 'assistant' as const, content: systemPrompt },
    ];

    // Add chat history for context (skip if too many to fit)
    for (const msg of chatHistory) {
      messages.push({
        role: msg.role === 'agent' ? 'assistant' as const : (msg.role as 'user' | 'assistant'),
        content: msg.content,
      });
    }

    // Add the current user message (it's already in history, but ensure it's the last one)
    // The history already includes the current message, so we're good

    // Call the LLM
    let aiResponse: string;
    try {
      const zai = await getZAI();
      const completion = await zai.chat.completions.create({
        messages,
        stream: false,
        thinking: { type: 'disabled' },
      });
      aiResponse = completion.choices?.[0]?.message?.content;

      if (!aiResponse || aiResponse.trim().length === 0) {
        throw new Error('Empty response from AI');
      }
    } catch (llmError: any) {
      console.error('LLM call failed:', llmError?.message);
      // Fallback to a helpful error response
      const fallbacks = FALLBACK_RESPONSES[agent.type] || FALLBACK_RESPONSES['development'];
      aiResponse = fallbacks[Math.floor(Math.random() * fallbacks.length)];
    }

    // Save AI response
    let message: any;
    if (useDb) {
      message = await db.chatMessage.create({
        data: { role: 'agent', content: aiResponse, agentId }
      });
    } else {
      message = memoryStore.createChatMessage({ role: 'agent', content: aiResponse, agentId });
    }

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

    if (!isVercel() && db) {
      try {
        const messages = await db.chatMessage.findMany({
          where: { agentId },
          orderBy: { createdAt: 'asc' },
          take: 100,
        });
        if (messages.length > 0) {
          return NextResponse.json({ messages });
        }
      } catch (e) {}
    }

    const messages = memoryStore.getChatMessages(agentId);
    return NextResponse.json({ messages });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
