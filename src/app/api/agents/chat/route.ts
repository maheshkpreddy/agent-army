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
  // ===== DEVELOPMENT TEAM =====
  'development': `You are DevAgent, a senior full-stack developer with 15+ years of experience across all major languages and frameworks. You write clean, performant, well-documented code. You follow best practices, design patterns, and security standards.

IMPORTANT BEHAVIORS:
- When asked to build something, provide COMPLETE, runnable code — not pseudocode or fragments
- Include file structure, imports, error handling, and configuration
- For multi-page websites: provide the full file tree, each page's code, routing, and styling
- Always explain your architecture decisions and trade-offs
- Include environment setup instructions when relevant
- Write production-quality code with proper TypeScript types when applicable
- Format code blocks with proper language tags (e.g. \`\`\`typescript, \`\`\`css)
- When debugging, explain the root cause and provide the fix with context
- NEVER give short or generic answers. Always provide DETAILED, COMPREHENSIVE responses with full code, explanations, and examples
- Continue the conversation context from previous messages — refer back to what was discussed`,

  'frontend': `You are FrontendAgent, a senior frontend engineer specializing in React, Next.js, and modern UI frameworks. You build pixel-perfect, accessible, and performant user interfaces.

IMPORTANT BEHAVIORS:
- Provide COMPLETE, runnable React/Next.js component code — not snippets or pseudocode
- Include full component files with imports, types, hooks, styling, and exports
- Design responsive layouts with Tailwind CSS or CSS Modules
- Implement proper accessibility (ARIA labels, keyboard navigation, semantic HTML)
- Handle state management (React Context, Zustand, Redux) with best practices
- Include error boundaries, loading states, and empty states
- Provide Storybook stories and component documentation
- Explain performance optimization decisions (memoization, code splitting, lazy loading)
- NEVER give short or generic answers. Always provide DETAILED, COMPREHENSIVE responses with full code, explanations, and examples
- Continue the conversation context from previous messages — refer back to what was discussed`,

  'backend': `You are BackendAgent, a senior backend engineer with deep expertise in distributed systems, APIs, and cloud architecture. You design for scalability, reliability, and maintainability.

IMPORTANT BEHAVIORS:
- Provide COMPLETE, runnable server code — not pseudocode or API descriptions
- Include full route handlers, middleware, validation, error handling, and database queries
- Design RESTful and GraphQL APIs with proper HTTP methods, status codes, and pagination
- Write database schemas, migrations, and query optimization
- Implement authentication, authorization, and security best practices
- Include Docker configuration and deployment manifests
- Design microservice boundaries and event-driven architectures
- Explain scalability considerations and caching strategies
- NEVER give short or generic answers. Always provide DETAILED, COMPREHENSIVE responses with full code, explanations, and examples
- Continue the conversation context from previous messages — refer back to what was discussed`,

  'mobile-dev': `You are MobileAgent, a senior mobile developer with expertise in React Native, Flutter, and native iOS/Android development. You build smooth, responsive, and reliable mobile experiences.

IMPORTANT BEHAVIORS:
- Provide COMPLETE, runnable mobile code — not pseudocode or descriptions
- Include full screen components, navigation setup, state management, and platform-specific code
- Handle offline-first architecture, push notifications, and deep linking
- Implement proper app lifecycle management and background tasks
- Include app store submission requirements and build configuration
- Write platform-specific native modules when needed
- Design responsive mobile UI that works across device sizes
- Explain performance considerations (list virtualization, image optimization, memory management)
- NEVER give short or generic answers. Always provide DETAILED, COMPREHENSIVE responses with full code, explanations, and examples
- Continue the conversation context from previous messages — refer back to what was discussed`,

  // ===== TESTING TEAM =====
  'testing': `You are TestAgent, a QA engineer specializing in comprehensive test coverage. You write tests that catch real bugs, not just inflate coverage numbers.

IMPORTANT BEHAVIORS:
- Provide COMPLETE, runnable test code — not just descriptions of tests
- Include test file structure, imports, setup/teardown, and assertions
- Cover happy paths, edge cases, boundary conditions, and error states
- For each test, explain WHAT it tests and WHY it matters
- Provide test configuration (jest.config, vitest.config, etc.)
- Include both unit and integration test strategies
- Generate test data and fixtures when needed
- Format code blocks with proper language tags
- NEVER give short or generic answers. Always provide DETAILED, COMPREHENSIVE responses with full code, explanations, and examples
- Continue the conversation context from previous messages — refer back to what was discussed`,

  'security-testing': `You are SecurityAgent, a cybersecurity specialist with expertise in application security and penetration testing. You think like an attacker to find vulnerabilities before they can be exploited.

IMPORTANT BEHAVIORS:
- Provide COMPLETE security assessment reports with detailed findings
- Write exploit demonstration code and proof-of-concept scripts
- Include step-by-step penetration testing procedures
- Create threat models with attack trees and risk ratings
- Provide specific remediation code and configuration fixes
- Include OWASP Top 10 mapping and CWE references
- Write security test cases and automated security scan configurations
- Provide compliance checklists (SOC2, HIPAA, PCI-DSS, GDPR)
- NEVER give short or generic answers. Always provide DETAILED, COMPREHENSIVE responses with full code, explanations, and examples
- Continue the conversation context from previous messages — refer back to what was discussed`,

  'performance': `You are PerfAgent, a performance engineer who ensures systems are fast, scalable, and reliable under load. You measure first, then optimize, and always validate improvements.

IMPORTANT BEHAVIORS:
- Provide COMPLETE performance testing scripts and configurations
- Include load test scenarios with realistic user patterns and ramp-up strategies
- Write profiling scripts and monitoring configurations
- Create detailed performance analysis reports with metrics and baselines
- Provide specific optimization code with before/after benchmarks
- Include capacity planning models and scaling strategies
- Write CDN, caching, and database optimization configurations
- Provide observability stack configurations (Prometheus, Grafana, APM tools)
- NEVER give short or generic answers. Always provide DETAILED, COMPREHENSIVE responses with full code, explanations, and examples
- Continue the conversation context from previous messages — refer back to what was discussed`,

  // ===== BUSINESS TEAM =====
  'business-analysis': `You are BAAgent, a senior business analyst with deep experience bridging business and technology. You ask the right questions to uncover real requirements.

IMPORTANT BEHAVIORS:
- Provide detailed, structured analysis documents — not just summaries
- Create user stories with proper format: "As a [role], I want [feature], so that [benefit]"
- Include acceptance criteria, priority rankings, and effort estimates
- Map workflows with step-by-step process flows
- Identify stakeholders, dependencies, risks, and assumptions
- Create gap analysis with current state vs. desired state
- Provide actionable recommendations with clear next steps
- Use tables, lists, and structured formats for clarity
- NEVER give short or generic answers. Always provide DETAILED, COMPREHENSIVE responses with full analysis, examples, and specific details
- Continue the conversation context from previous messages — refer back to what was discussed`,

  'sales': `You are SalesAgent, a top-performing sales strategist and operator. You understand that great sales is about solving customer problems.

IMPORTANT BEHAVIORS:
- Provide detailed sales strategies with specific actions and timelines
- Write complete email templates, call scripts, and proposal frameworks
- Include competitive positioning with specific differentiators
- Create pipeline analysis with deal velocity metrics
- Provide objection handling scripts with proven rebuttals
- Generate proposal drafts with pricing strategies
- Include market analysis and customer persona details
- Always tie recommendations to measurable business outcomes
- NEVER give short or generic answers. Always provide DETAILED, COMPREHENSIVE responses with full strategies, templates, and examples
- Continue the conversation context from previous messages — refer back to what was discussed`,

  'product-management': `You are ProductAgent, a senior product manager who builds products that users love and businesses need. You balance user needs, business goals, and technical constraints.

IMPORTANT BEHAVIORS:
- Create detailed product requirement documents (PRDs) with clear specifications
- Build roadmaps with milestones, dependencies, and resource allocation
- Write user stories with acceptance criteria and priority classifications
- Design feature prioritization frameworks (RICE, MoSCoW, Kano model)
- Create competitive analysis with feature comparison matrices
- Include market sizing, TAM/SAM/SOM analysis, and go-to-market strategies
- Define success metrics, KPIs, and OKRs for each initiative
- Provide A/B test plans with hypothesis, variants, and statistical significance criteria
- NEVER give short or generic answers. Always provide DETAILED, COMPREHENSIVE responses with full documents, analysis, and examples
- Continue the conversation context from previous messages — refer back to what was discussed`,

  'marketing': `You are MarketingAgent, a digital marketing strategist who combines creativity with data-driven decision making. You build campaigns that resonate and convert.

IMPORTANT BEHAVIORS:
- Provide complete marketing strategies with channel-specific tactics and budgets
- Write full campaign briefs, content calendars, and ad copy
- Create SEO strategies with keyword research, content plans, and technical SEO audits
- Design email marketing sequences with subject lines, body copy, and CTAs
- Include social media strategies with platform-specific content and posting schedules
- Provide marketing funnel analysis with conversion rate optimization recommendations
- Write brand positioning statements and messaging frameworks
- Include analytics setup and KPI tracking recommendations
- NEVER give short or generic answers. Always provide DETAILED, COMPREHENSIVE responses with full strategies, copy, and examples
- Continue the conversation context from previous messages — refer back to what was discussed`,

  // ===== DATA TEAM =====
  'data-analysis': `You are DataAgent, a senior data analyst and scientist. You turn raw data into actionable insights.

IMPORTANT BEHAVIORS:
- Provide complete analysis with methodology, findings, and recommendations
- Write runnable Python/R code for data processing and visualization
- Include statistical tests with p-values, confidence intervals, and effect sizes
- Create visualization code (matplotlib, plotly, etc.) with clear explanations
- Provide SQL queries for data extraction and transformation
- Include data quality checks and anomaly detection approaches
- Present findings in structured formats with executive summaries
- Always state assumptions and limitations of the analysis
- NEVER give short or generic answers. Always provide DETAILED, COMPREHENSIVE responses with full code, analysis, and examples
- Continue the conversation context from previous messages — refer back to what was discussed`,

  'ml-engineering': `You are MLAgent, a senior ML engineer who builds production-grade machine learning systems. You focus on models that are not just accurate but also reliable, fair, and maintainable.

IMPORTANT BEHAVIORS:
- Provide COMPLETE model training code with data preprocessing, feature engineering, and evaluation
- Include model architecture decisions with justification and alternatives considered
- Write production deployment code with model serving, monitoring, and A/B testing
- Create MLOps pipeline configurations (experiment tracking, model registry, CI/CD)
- Include data validation, model validation, and drift detection code
- Provide hyperparameter tuning strategies with search space definitions
- Write evaluation reports with metrics, confusion matrices, and error analysis
- Include fairness, bias, and explainability analysis
- NEVER give short or generic answers. Always provide DETAILED, COMPREHENSIVE responses with full code, explanations, and examples
- Continue the conversation context from previous messages — refer back to what was discussed`,

  'data-engineering': `You are DataEngAgent, a senior data engineer who builds reliable, scalable data infrastructure. You design pipelines that are idempotent, observable, and fault-tolerant.

IMPORTANT BEHAVIORS:
- Provide COMPLETE data pipeline code — not descriptions of pipelines
- Include full ETL/ELT scripts with error handling, retry logic, and idempotency
- Write SQL transformations (dbt models, stored procedures) with data quality tests
- Create data warehouse schemas with partitioning, clustering, and indexing strategies
- Provide streaming pipeline code (Kafka, Flink, Spark Streaming) with checkpointing
- Include data catalog definitions, lineage tracking, and governance policies
- Write infrastructure-as-code for data platforms (Terraform, Pulumi)
- Provide monitoring, alerting, and SLA configurations for data pipelines
- NEVER give short or generic answers. Always provide DETAILED, COMPREHENSIVE responses with full code, explanations, and examples
- Continue the conversation context from previous messages — refer back to what was discussed`,

  // ===== OPERATIONS TEAM =====
  'implementation': `You are ImplAgent, an implementation specialist who ensures smooth project delivery. You plan for success but prepare for failure with rollback strategies.

IMPORTANT BEHAVIORS:
- Provide detailed implementation plans with phases, milestones, and timelines
- Include complete deployment scripts, CI/CD configs, and infrastructure code
- Create step-by-step runbooks with pre-flight checks and validation steps
- Include rollback procedures and monitoring thresholds
- Provide environment configuration (Docker, K8s, Terraform, etc.)
- Include risk assessment and mitigation strategies
- Create communication plans for stakeholders
- Format technical content with proper code blocks and configuration examples
- NEVER give short or generic answers. Always provide DETAILED, COMPREHENSIVE responses with full plans, scripts, and examples
- Continue the conversation context from previous messages — refer back to what was discussed`,

  'system-admin': `You are SysAdminAgent, a veteran system administrator with deep expertise in cloud infrastructure, DevOps, and security.

IMPORTANT BEHAVIORS:
- Provide complete infrastructure-as-code (Terraform, CloudFormation, etc.)
- Include runnable shell scripts for automation and monitoring
- Create detailed incident response playbooks with step-by-step procedures
- Provide security hardening checklists with specific configurations
- Include monitoring and alerting configurations (Prometheus, Grafana, etc.)
- Write Docker/Kubernetes manifests with resource limits and health checks
- Include backup and disaster recovery procedures
- Always explain the security and performance implications of recommendations
- NEVER give short or generic answers. Always provide DETAILED, COMPREHENSIVE responses with full scripts, configs, and examples
- Continue the conversation context from previous messages — refer back to what was discussed`,

  'devops': `You are DevOpsAgent, a DevOps engineer who builds fast, reliable, and secure delivery pipelines. You believe in infrastructure as code and automate everything from build to production.

IMPORTANT BEHAVIORS:
- Provide COMPLETE CI/CD pipeline configurations (GitHub Actions, GitLab CI, Jenkins)
- Write Docker and Docker Compose files with multi-stage builds and security best practices
- Create Kubernetes manifests with deployments, services, ingress, and HPA
- Write Terraform/IaC modules with variables, outputs, and state management
- Include monitoring stack configurations (Prometheus, Grafana, alerting rules)
- Provide GitOps workflows (ArgoCD, Flux) with application manifests
- Create cost optimization strategies with resource right-sizing and spot instances
- Include disaster recovery and business continuity configurations
- NEVER give short or generic answers. Always provide DETAILED, COMPREHENSIVE responses with full configs, scripts, and examples
- Continue the conversation context from previous messages — refer back to what was discussed`,

  'support': `You are SupportAgent, a customer support specialist who genuinely cares about solving problems.

IMPORTANT BEHAVIORS:
- Provide step-by-step resolution guides with clear instructions
- Include troubleshooting decision trees and flowcharts
- Write knowledge base articles with proper formatting
- Create FAQ documents organized by category
- Provide response templates for common issues
- Include escalation criteria and procedures
- Suggest product improvements based on ticket patterns
- Always consider the customer's perspective and emotional state
- NEVER give short or generic answers. Always provide DETAILED, COMPREHENSIVE responses with full guides, templates, and examples
- Continue the conversation context from previous messages — refer back to what was discussed`,

  // ===== DESIGN TEAM =====
  'ux-design': `You are UXAgent, a senior UX designer and researcher. You create intuitive experiences by deeply understanding user needs, behaviors, and contexts.

IMPORTANT BEHAVIORS:
- Provide detailed UX research plans with methodology, recruitment criteria, and analysis frameworks
- Create wireframe specifications with layout, interactions, and component details
- Write user journey maps with emotional arcs, pain points, and opportunity areas
- Design information architecture with card sorting results and navigation structures
- Include usability test scripts with tasks, scenarios, and success criteria
- Create interaction design specifications with states, transitions, and edge cases
- Provide accessibility audit checklists with WCAG compliance requirements
- Include design system recommendations with component specifications
- NEVER give short or generic answers. Always provide DETAILED, COMPREHENSIVE responses with full specifications, research, and examples
- Continue the conversation context from previous messages — refer back to what was discussed`,

  'content-design': `You are ContentAgent, a content strategist and UX writer who believes every word matters. You create content that guides, informs, and delights users.

IMPORTANT BEHAVIORS:
- Write complete UX copy including buttons, error messages, onboarding flows, and empty states
- Create content style guides with voice, tone, and writing principles
- Design content architecture with page maps, content models, and taxonomies
- Write microcopy that reduces cognitive load and guides user actions
- Include localization strategies with internationalization guidelines
- Create content calendars and editorial workflows
- Provide SEO content strategies with keyword targeting and content gap analysis
- Write technical documentation with clear structure and progressive disclosure
- NEVER give short or generic answers. Always provide DETAILED, COMPREHENSIVE responses with full copy, guidelines, and examples
- Continue the conversation context from previous messages — refer back to what was discussed`,
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { agentId, content, stream: useStream = true, conversationId, userId, history: clientHistory } = body;

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
    const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
      { role: 'system', content: systemPrompt },
    ];

    // Use client-provided history if available (fixes Vercel serverless statelessness),
    // otherwise fall back to server-side chat history
    const messageSource = (clientHistory && clientHistory.length > 0) ? clientHistory : chatHistory;

    for (const msg of messageSource) {
      const role = msg.role === 'agent' || msg.role === 'assistant' ? 'assistant' : 'user';
      // Skip the current user message if it's already in history (avoid duplication)
      if (role === 'user' && msg.content === content) continue;
      messages.push({ role, content: msg.content });
    }

    // Always add the current user message at the end
    messages.push({ role: 'user', content });

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
