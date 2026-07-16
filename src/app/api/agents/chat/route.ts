import { NextRequest, NextResponse } from 'next/server';
import { isVercel, memoryStore } from '@/lib/memory-store';
import { getZAIConfigFromEnv } from '@/lib/zai-init';
import { generateContextualResponse } from '@/lib/agent-responses';

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
    const envConfig = getZAIConfigFromEnv();
    if (envConfig) {
      zaiInstance = new ZAI(envConfig);
    } else {
      zaiInstance = await ZAI.create();
    }
  }
  return zaiInstance;
}

// Detect if user is asking to build/develop a website
function isWebsiteBuildRequest(content: string): boolean {
  const lower = content.toLowerCase();
  const buildKeywords = [
    'build me a website', 'create a website', 'develop a website', 'make a website',
    'build a web page', 'create a web app', 'develop a web app', 'build a landing page',
    'create a landing page', 'build me a page', 'make me a website', 'develop a page',
    'build website', 'create website', 'develop website', 'make website',
    'build a site', 'create a site', 'make a site', 'build a dashboard',
    'create a dashboard', 'build a portal', 'create a portfolio', 'build an app',
    'show me the preview', 'show me preview', 'give me preview', 'with preview',
    'and preview', 'show preview', 'with a preview'
  ];
  return buildKeywords.some(kw => lower.includes(kw));
}

// Detect if user is asking to test a URL/website
function isUrlTestRequest(content: string): boolean {
  const lower = content.toLowerCase();
  const testKeywords = [
    'test this url', 'test this website', 'test this link', 'test this site',
    'test the url', 'test the website', 'test the link', 'test the site',
    'test url', 'test website', 'test link', 'test site',
    'run a test on', 'check this url', 'check this website', 'check this link',
    'analyze this url', 'analyze this website', 'audit this website', 'audit this url',
    'qa this', 'quality check', 'performance test', 'test report for',
    'give me a report', 'generate report', 'test and report', 'test report'
  ];
  const hasUrl = lower.match(/https?:\/\/[^\s]+/) !== null;
  return testKeywords.some(kw => lower.includes(kw)) || (hasUrl && (lower.includes('test') || lower.includes('check') || lower.includes('report')));
}

// Extract URL from content
function extractUrl(content: string): string | null {
  const match = content.match(/https?:\/\/[^\s]+/);
  return match ? match[0] : null;
}

// Enhanced system prompts for each agent type
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

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { agentId, content, stream: useStream = true, conversationId, userId } = body;

    if (!agentId || !content) {
      return NextResponse.json({ error: 'agentId and content are required' }, { status: 400 });
    }

    // Get agent info
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
      } catch (e) {}
    }

    if (!useDb) {
      agent = memoryStore.getAgentById(agentId);
      if (!agent) {
        return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
      }
      memoryStore.createChatMessage({ role: 'user', content, agentId, conversationId: conversationId || 'default', userId: userId || 'unknown' });
      if (conversationId) {
        chatHistory = memoryStore.getConversationMessages(conversationId).slice(-20);
      } else {
        chatHistory = memoryStore.getChatMessages(agentId).slice(-20);
      }
    }

    // Check for special action requests based on agent type
    let specialActionResult: any = null;

    if (agent.type === 'development' && isWebsiteBuildRequest(content)) {
      try {
        const buildRes = await fetch(new URL('/api/agents/build', req.url).toString(), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ description: content, agentId }),
        });
        if (buildRes.ok) {
          specialActionResult = await buildRes.json();
        }
      } catch (e) {
        console.error('Build trigger failed:', e);
      }
    } else if (agent.type === 'testing' && isUrlTestRequest(content)) {
      const targetUrl = extractUrl(content) || content;
      try {
        const testRes = await fetch(new URL('/api/agents/test-url', req.url).toString(), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: targetUrl, description: content, agentId }),
        });
        if (testRes.ok) {
          specialActionResult = await testRes.json();
        }
      } catch (e) {
        console.error('Test trigger failed:', e);
      }
    }

    // Build LLM messages with system prompt + chat history
    const systemPrompt = AGENT_SYSTEM_PROMPTS[agent.type] || AGENT_SYSTEM_PROMPTS['development'];
    const messages = [
      { role: 'assistant' as const, content: systemPrompt },
    ];

    for (const msg of chatHistory) {
      messages.push({
        role: msg.role === 'agent' ? 'assistant' as const : (msg.role as 'user' | 'assistant'),
        content: msg.content,
      });
    }

    // STREAMING RESPONSE - this is the key performance improvement
    if (useStream) {
      const encoder = new TextEncoder();

      const stream = new ReadableStream({
        async start(controller) {
          let fullResponse = '';

          try {
            const zai = await getZAI();
            const completion = await zai.chat.completions.create({
              messages,
              stream: true,
              thinking: { type: 'disabled' },
            });

            // Stream tokens as they arrive
            for await (const chunk of completion) {
              const token = chunk.choices?.[0]?.delta?.content || '';
              if (token) {
                fullResponse += token;
                // Send token as SSE
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'token', content: token })}\n\n`));
              }
            }

            // If we have a special action result, append it to the response
            let finalResponse = fullResponse;
            if (specialActionResult) {
              if (specialActionResult.success && specialActionResult.previewUrl) {
                if (agent.type === 'development') {
                  finalResponse = `${fullResponse}\n\n---\n\n## 🚀 Website Generated Successfully!\n\n**Project ID:** \`${specialActionResult.projectId}\`\n**Tech Stack:** ${specialActionResult.techStack}\n**Files Created:**\n${specialActionResult.files.map((f: string) => `- \`${f}\``).join('\n')}\n\n### 📺 Preview\n**[View Live Preview](${specialActionResult.previewUrl})**\n\n### 📥 Download\n**[Download Project Files](${specialActionResult.downloadUrl})**\n\nYou can view the live website in the preview link above, or download all project files using the download link.`;
                } else if (agent.type === 'testing') {
                  finalResponse = `${fullResponse}\n\n---\n\n## 🧪 Test Report Generated!\n\n**URL Tested:** ${specialActionResult.url}\n**Overall Score:** ${specialActionResult.summary?.overallScore || 'N/A'}/100\n**Tests Passed:** ${specialActionResult.summary?.passed || 0} | **Failed:** ${specialActionResult.summary?.failed || 0} | **Warnings:** ${specialActionResult.summary?.warnings || 0}\n\n### Category Scores\n${(specialActionResult.categories || []).map((c: any) => `- **${c.name}**: ${c.score}/100`).join('\n')}\n\n### 📺 View Report\n**[View Full Test Report](${specialActionResult.previewUrl})**\n\n### 📥 Download\n**[Download HTML Report](${specialActionResult.downloadUrl})** | **[Download JSON Data](${specialActionResult.jsonUrl})**\n\n### Recommendations\n${(specialActionResult.recommendations || []).map((r: string) => `- ${r}`).join('\n')}`;
                }
              }

              // Send the action result suffix
              const suffix = finalResponse.substring(fullResponse.length);
              if (suffix) {
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'token', content: suffix })}\n\n`));
              }
            }

            // Save the complete AI response
            if (useDb) {
              await db.chatMessage.create({
                data: { role: 'agent', content: finalResponse, agentId }
              });
            } else {
              memoryStore.createChatMessage({ role: 'agent', content: finalResponse, agentId, conversationId: conversationId || 'default', userId: userId || 'unknown' });
            }

            // Send completion event with metadata
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({
              type: 'done',
              actionResult: specialActionResult || null,
            })}\n\n`));

          } catch (llmError: any) {
            console.error('LLM stream failed, using fallback:', llmError?.message);

            // Fallback to contextual response
            const fallbackResponse = generateContextualResponse(
              { id: agent.id, type: agent.type, name: agent.name, systemPrompt: agent.systemPrompt || '', capabilities: agent.capabilities || '' },
              content
            );

            // Send fallback as tokens
            for (let i = 0; i < fallbackResponse.length; i += 20) {
              const chunk = fallbackResponse.substring(i, i + 20);
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'token', content: chunk })}\n\n`));
            }

            // Save fallback response
            if (useDb) {
              await db.chatMessage.create({ data: { role: 'agent', content: fallbackResponse, agentId } });
            } else {
              memoryStore.createChatMessage({ role: 'agent', content: fallbackResponse, agentId, conversationId: conversationId || 'default', userId: userId || 'unknown' });
            }

            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'done', actionResult: null })}\n\n`));
          }

          controller.close();
        },
      });

      return new Response(stream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
          'X-Accel-Buffering': 'no',
        },
      });
    }

    // NON-STREAMING FALLBACK (for older clients)
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
      console.error('LLM call failed, using contextual fallback:', llmError?.message);
      aiResponse = generateContextualResponse(
        { id: agent.id, type: agent.type, name: agent.name, systemPrompt: agent.systemPrompt || '', capabilities: agent.capabilities || '' },
        content
      );
    }

    let finalResponse = aiResponse;
    if (specialActionResult) {
      if (specialActionResult.success && specialActionResult.previewUrl) {
        if (agent.type === 'development') {
          finalResponse = `${aiResponse}\n\n---\n\n## 🚀 Website Generated Successfully!\n\n**Project ID:** \`${specialActionResult.projectId}\`\n**Tech Stack:** ${specialActionResult.techStack}\n**Files Created:**\n${specialActionResult.files.map((f: string) => `- \`${f}\``).join('\n')}\n\n### 📺 Preview\n**[View Live Preview](${specialActionResult.previewUrl})**\n\n### 📥 Download\n**[Download Project Files](${specialActionResult.downloadUrl})**\n\nYou can view the live website in the preview link above, or download all project files using the download link.`;
        } else if (agent.type === 'testing') {
          finalResponse = `${aiResponse}\n\n---\n\n## 🧪 Test Report Generated!\n\n**URL Tested:** ${specialActionResult.url}\n**Overall Score:** ${specialActionResult.summary?.overallScore || 'N/A'}/100\n**Tests Passed:** ${specialActionResult.summary?.passed || 0} | **Failed:** ${specialActionResult.summary?.failed || 0} | **Warnings:** ${specialActionResult.summary?.warnings || 0}\n\n### Category Scores\n${(specialActionResult.categories || []).map((c: any) => `- **${c.name}**: ${c.score}/100`).join('\n')}\n\n### 📺 View Report\n**[View Full Test Report](${specialActionResult.previewUrl})**\n\n### 📥 Download\n**[Download HTML Report](${specialActionResult.downloadUrl})** | **[Download JSON Data](${specialActionResult.jsonUrl})**\n\n### Recommendations\n${(specialActionResult.recommendations || []).map((r: string) => `- ${r}`).join('\n')}`;
        }
      }
    }

    let message: any;
    if (useDb) {
      message = await db.chatMessage.create({
        data: { role: 'agent', content: finalResponse, agentId }
      });
    } else {
      message = memoryStore.createChatMessage({ role: 'agent', content: finalResponse, agentId, conversationId: conversationId || 'default', userId: userId || 'unknown' });
    }

    const responseData: any = { message };
    if (specialActionResult) {
      responseData.actionResult = specialActionResult;
    }

    return NextResponse.json(responseData);
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
          return NextResponse.json({ messages }, {
            headers: { 'Cache-Control': 'private, max-age=5' },
          });
        }
      } catch (e) {}
    }

    const messages = memoryStore.getChatMessages(agentId);
    return NextResponse.json({ messages }, {
      headers: { 'Cache-Control': 'private, max-age=5' },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
