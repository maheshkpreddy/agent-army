/**
 * Seed script: Import all skills from the reference claude-skills repo into the database.
 * Parses SKILL.md files with YAML frontmatter and categorizes them.
 */
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

// Category definitions mapped from the README
const CATEGORIES = [
  { name: 'AI Agent Architecture', slug: 'ai-agent-architecture', icon: 'Bot', description: 'Skills for building, orchestrating, and managing autonomous AI agents', color: '#8B5CF6', order: 1 },
  { name: 'Anthropic / Claude Products', slug: 'anthropic-claude-products', icon: 'Sparkles', description: 'Skills built around specific Anthropic product releases', color: '#D97706', order: 2 },
  { name: 'Sales and Revenue', slug: 'sales-and-revenue', icon: 'TrendingUp', description: 'Skills for driving revenue, managing pipelines, and closing deals', color: '#059669', order: 3 },
  { name: 'Consulting and Professional Services', slug: 'consulting-professional-services', icon: 'Briefcase', description: 'Skills for consulting engagements, client management, and professional services', color: '#2563EB', order: 4 },
  { name: 'Engineering and DevOps', slug: 'engineering-devops', icon: 'Code', description: 'Skills for code review, debugging, deployment, and infrastructure', color: '#DC2626', order: 5 },
  { name: 'Security and Compliance', slug: 'security-compliance', icon: 'Shield', description: 'Skills for security audits, compliance checks, and risk management', color: '#7C3AED', order: 6 },
  { name: 'Marketing and Content', slug: 'marketing-content', icon: 'Megaphone', description: 'Skills for SEO, content creation, social media, and brand management', color: '#DB2777', order: 7 },
  { name: 'Strategy and Finance', slug: 'strategy-finance', icon: 'BarChart3', description: 'Skills for pricing, market sizing, investor relations, and financial planning', color: '#0891B2', order: 8 },
  { name: 'Operations and People', slug: 'operations-people', icon: 'Users', description: 'Skills for workflow automation, OKRs, hiring, and knowledge management', color: '#65A30D', order: 9 },
  { name: 'Sports and Entertainment', slug: 'sports-entertainment', icon: 'Trophy', description: 'Skills for sports analytics, fantasy sports, game strategy, and sports content', color: '#EA580C', order: 10 },
  { name: 'Design and Creative', slug: 'design-creative', icon: 'Palette', description: 'Skills for design systems, UI/UX, animations, and creative workflows', color: '#C026D3', order: 11 },
  { name: 'Everyday Life', slug: 'everyday-life', icon: 'Heart', description: 'Skills for personal finance, travel, fitness, and daily productivity', color: '#0D9488', order: 12 },
];

// Map skill folder names to categories
const SKILL_CATEGORY_MAP: Record<string, string> = {
  // AI Agent Architecture
  'agent-army': 'ai-agent-architecture',
  'agent-to-agent': 'ai-agent-architecture',
  'agent-swarm-deployer': 'ai-agent-architecture',
  'agent-team-builder': 'ai-agent-architecture',
  'sub-agent-orchestrator': 'ai-agent-architecture',
  'scout': 'ai-agent-architecture',
  'scout-pro': 'ai-agent-architecture',
  'skill-navigator': 'ai-agent-architecture',
  'skill-composer-studio': 'ai-agent-architecture',

  // Anthropic / Claude Products
  'overnight-repo-auditor': 'anthropic-claude-products',
  'multi-agent-client-onboarding': 'anthropic-claude-products',
  'cowork-deal-room': 'anthropic-claude-products',
  'gmail-to-crm-pipeline': 'anthropic-claude-products',
  'full-codebase-migrator': 'anthropic-claude-products',
  'claude-design-system-architect': 'anthropic-claude-products',
  'claude-landing-composer': 'anthropic-claude-products',
  'claude-design-critic': 'anthropic-claude-products',

  // Sales and Revenue
  'deal-closer-playbook': 'sales-and-revenue',
  'renewal-predictor': 'sales-and-revenue',
  'expansion-revenue-finder': 'sales-and-revenue',
  'pipeline-health-analyzer': 'sales-and-revenue',
  'deal-review-framework': 'sales-and-revenue',
  'deal-momentum-analyzer': 'sales-and-revenue',
  'sales-forecast-builder': 'sales-and-revenue',
  'sales-call-prep-assistant': 'sales-and-revenue',
  'sales-methodology-implementer': 'sales-and-revenue',
  'lead-scoring-model': 'sales-and-revenue',
  'inbound-lead-qualifier': 'sales-and-revenue',
  'cold-email-sequence-generator': 'sales-and-revenue',
  'personalization-at-scale': 'sales-and-revenue',
  'champion-identifier': 'sales-and-revenue',
  'intent-signal-aggregator': 'sales-and-revenue',
  'objection-pattern-detector': 'sales-and-revenue',
  'lookalike-customer-finder': 'sales-and-revenue',
  'quota-setting-calculator': 'sales-and-revenue',
  'sales-comp-plan-designer': 'sales-and-revenue',
  'sales-coaching-plan-generator': 'sales-and-revenue',
  'ramping-rep-tracker': 'sales-and-revenue',
  'rep-performance-scorecard': 'sales-and-revenue',
  'territory-planning-optimizer': 'sales-and-revenue',
  'icp-deep-scanner': 'sales-and-revenue',
  'customer-panel-of-experts': 'sales-and-revenue',
  'prospect-panel-simulator': 'sales-and-revenue',
  'pricing-change-strategist': 'sales-and-revenue',
  'contact-hunter': 'sales-and-revenue',
  'linkedin-sales-navigator-alt': 'sales-and-revenue',

  // Consulting and Professional Services
  'client-proposal-generator': 'consulting-professional-services',
  'sow-generator': 'consulting-professional-services',
  'client-health-dashboard': 'consulting-professional-services',
  'churn-autopsy': 'consulting-professional-services',
  'onboarding-checklist': 'consulting-professional-services',
  'ai-readiness-assessment': 'consulting-professional-services',
  'saas-replacement-planner': 'consulting-professional-services',
  'roi-calculator': 'consulting-professional-services',
  'meeting-intelligence': 'consulting-professional-services',
  'meeting-to-tasks': 'consulting-professional-services',
  'weekly-business-report': 'consulting-professional-services',

  // Engineering and DevOps
  'code-review-pro': 'engineering-devops',
  'api-load-tester': 'engineering-devops',
  'database-migrator': 'engineering-devops',
  'incident-responder': 'engineering-devops',
  'runbook-generator': 'engineering-devops',
  'data-pipeline-builder': 'engineering-devops',
  'dependency-auditor': 'engineering-devops',
  'test-coverage-improver': 'engineering-devops',
  'docker-debugger': 'engineering-devops',
  'env-setup-wizard': 'engineering-devops',
  'error-boundary-creator': 'engineering-devops',
  'git-pr-reviewer': 'engineering-devops',
  'regex-debugger': 'engineering-devops',
  'performance-profiler': 'engineering-devops',
  'api-endpoint-scaffolder': 'engineering-devops',
  'responsive-layout-builder': 'engineering-devops',
  'react-component-generator': 'engineering-devops',
  'css-animation-creator': 'engineering-devops',
  'database-schema-designer': 'engineering-devops',
  'screenshot-to-code': 'engineering-devops',
  'landing-page-optimizer': 'engineering-devops',
  'api-documentation-writer': 'engineering-devops',
  'animate': 'engineering-devops',

  // Security and Compliance
  'compliance-checker': 'security-compliance',
  'security-pentest-planner': 'security-compliance',
  'tech-due-diligence': 'security-compliance',
  'contract-analyzer': 'security-compliance',
  'contract-redliner': 'security-compliance',

  // Marketing and Content
  'seo-optimizer': 'marketing-content',
  'seo-keyword-cluster-builder': 'marketing-content',
  'landing-page-copywriter': 'marketing-content',
  'brand-voice-analyzer': 'marketing-content',
  'content-repurposer': 'marketing-content',
  'social-repurposer': 'marketing-content',
  'social-selling-content-generator': 'marketing-content',
  'tweetclaw-x-twitter-automation': 'marketing-content',
  'linkedin-post-optimizer': 'marketing-content',
  'utm-parameter-generator': 'marketing-content',
  'utm-link-generator': 'marketing-content',
  'competitor-content-analyzer': 'marketing-content',
  'competitor-price-tracker': 'marketing-content',
  'competitor-intel-agent': 'marketing-content',
  'customer-review-aggregator': 'marketing-content',
  'podcast-content-suite': 'marketing-content',
  'webinar-content-repurposer': 'marketing-content',
  'webinar-to-content-multiplier': 'marketing-content',
  'email-template-generator': 'marketing-content',
  'email-subject-line-optimizer': 'marketing-content',
  'product-launch-war-room': 'marketing-content',
  'hyperframes-ad-director': 'marketing-content',
  'hyperframes-sales-demo-builder': 'marketing-content',
  'stock-photo-finder': 'marketing-content',
  'color-palette-extractor': 'marketing-content',
  'font-pairing-suggester': 'marketing-content',
  'brand-consistency-checker': 'marketing-content',
  'reddit-analyzer': 'marketing-content',
  'athlete-social-media-manager': 'marketing-content',

  // Strategy and Finance
  'pricing-strategy': 'strategy-finance',
  'market-sizing': 'strategy-finance',
  'pitch-deck-reviewer': 'strategy-finance',
  'board-deck-generator': 'strategy-finance',
  'investor-update-writer': 'strategy-finance',
  'executive-dashboard-generator': 'strategy-finance',
  'financial-parser': 'strategy-finance',
  'portfolio-analyzer': 'strategy-finance',
  'budget-optimizer': 'strategy-finance',
  'financial-goal-planner': 'strategy-finance',
  'tax-strategy-optimizer': 'strategy-finance',

  // Operations and People
  'workflow-automator': 'operations-people',
  'okr-generator': 'operations-people',
  'customer-journey-mapper': 'operations-people',
  'hiring-scorecard': 'operations-people',
  'knowledge-base-builder': 'operations-people',
  'technical-writer': 'operations-people',
  'job-application-optimizer': 'operations-people',
  'raise-negotiation-prep': 'operations-people',
  'slack-message-formatter': 'operations-people',
  'sms-text-optimizer': 'operations-people',
  'internal-email-composer': 'operations-people',
  'company-announcement-writer': 'operations-people',
  'before-you-build': 'operations-people',

  // Sports and Entertainment
  'game-recap-generator': 'sports-entertainment',
  'fantasy-lineup-optimizer': 'sports-entertainment',
  'player-comparison-tool': 'sports-entertainment',
  'highlight-reel-scripter': 'sports-entertainment',
  'scouting-report-builder': 'sports-entertainment',
  'sports-betting-analyzer': 'sports-entertainment',
  'practice-plan-creator': 'sports-entertainment',
  'play-by-play-generator': 'sports-entertainment',
  'injury-report-tracker': 'sports-entertainment',
  'trash-talk-generator': 'sports-entertainment',
  'sports-trivia-builder': 'sports-entertainment',
  'post-game-press-conference-simulator': 'sports-entertainment',
  'bracket-predictor': 'sports-entertainment',
  'training-log-analyzer': 'sports-entertainment',
  'team-chemistry-evaluator': 'sports-entertainment',
  'sports-meme-creator': 'sports-entertainment',
  'game-strategy-simulator': 'sports-entertainment',
  'sports-podcast-outline-generator': 'sports-entertainment',
  'mvp-case-builder': 'sports-entertainment',
  'debate-simulator': 'sports-entertainment',
  'expert-panel': 'sports-entertainment',
  'game-builder': 'sports-entertainment',

  // Design and Creative
  'design-system-generator': 'design-creative',
  'presentation-design-enhancer': 'design-creative',
  'podcast-studio': 'design-creative',
  'flashcard-generator': 'design-creative',
  'quiz-maker': 'design-creative',

  // Everyday Life
  'itinerary-optimizer': 'everyday-life',
  'workout-program-designer': 'everyday-life',
  'hypothesis-testing-engine': 'everyday-life',
  'conversation-archaeologist': 'everyday-life',
  'weak-signal-synthesizer': 'everyday-life',
  'cross-conversation-project-manager': 'everyday-life',
};

// Featured skills
const FEATURED_SKILLS = [
  'agent-army',
  'scout-pro',
  'skill-navigator',
  'claude-design-system-architect',
  'overnight-repo-auditor',
  'deal-closer-playbook',
  'code-review-pro',
  'compliance-checker',
];

function parseFrontmatter(content: string) {
  const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) {
    return { frontmatter: {}, body: content };
  }

  const frontmatter: Record<string, any> = {};
  const raw = match[1];
  const body = match[2];

  // Parse simple YAML key-value pairs
  for (const line of raw.split('\n')) {
    const kvMatch = line.match(/^(\w+):\s*"?([^"]*?)"?\s*$/);
    if (kvMatch) {
      frontmatter[kvMatch[1]] = kvMatch[2].trim();
    }
  }

  return { frontmatter, body };
}

function extractDescriptionFromContent(frontmatter: Record<string, string>, body: string): string {
  // Use frontmatter description if available
  if (frontmatter.description) {
    return frontmatter.description;
  }
  // Otherwise extract first meaningful paragraph
  const lines = body.split('\n').filter(l => l.trim().length > 0 && !l.startsWith('#') && !l.startsWith('```'));
  return lines[0]?.substring(0, 200) || 'No description available';
}

function extractTags(name: string, description: string, categorySlug: string): string[] {
  const tags = new Set<string>();
  const lowerDesc = description.toLowerCase();
  const lowerName = name.toLowerCase();

  // Add category as tag
  tags.add(categorySlug.replace(/-/g, ' '));

  // Keyword-based tagging
  const tagKeywords: Record<string, string[]> = {
    'ai agents': ['agent', 'swarm', 'orchestrat', 'army', 'sub-agent', 'a2a'],
    'sales': ['sales', 'deal', 'revenue', 'pipeline', 'forecast', 'quota', 'comp plan', 'closing'],
    'marketing': ['seo', 'content', 'social', 'email', 'brand', 'landing page', 'copywrit'],
    'security': ['security', 'compliance', 'pentest', 'audit', 'gdpr', 'hipaa', 'soc2'],
    'coding': ['code', 'debug', 'api', 'database', 'docker', 'react', 'typescript', 'css', 'git'],
    'finance': ['pricing', 'budget', 'financial', 'roi', 'investor', 'portfolio', 'tax'],
    'consulting': ['client', 'proposal', 'sow', 'onboarding', 'churn'],
    'design': ['design', 'animation', 'ui', 'ux', 'component', 'layout'],
    'automation': ['automat', 'workflow', 'pipeline', 'etl', 'cron'],
    'data': ['data', 'analytics', 'dashboard', 'report', 'parser', 'csv', 'excel'],
    'sports': ['sports', 'game', 'player', 'team', 'fantasy', 'scout', 'bracket'],
  };

  for (const [tag, keywords] of Object.entries(tagKeywords)) {
    if (keywords.some(kw => lowerDesc.includes(kw) || lowerName.includes(kw))) {
      tags.add(tag);
    }
  }

  return Array.from(tags);
}

async function main() {
  console.log('🌱 Seeding database...');

  // Create categories
  console.log('Creating categories...');
  for (const cat of CATEGORIES) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: cat,
      create: cat,
    });
  }

  // Read all skills from the reference repo
  const refRepoPath = '/home/z/my-project/ref-claude-skills';
  const skillDirs = fs.readdirSync(refRepoPath).filter(dir => {
    const skillPath = path.join(refRepoPath, dir);
    return fs.statSync(skillPath).isDirectory() && fs.existsSync(path.join(skillPath, 'SKILL.md'));
  });

  console.log(`Found ${skillDirs.length} skills to import`);

  let imported = 0;
  let skipped = 0;

  for (const skillDir of skillDirs) {
    const skillMdPath = path.join(refRepoPath, skillDir, 'SKILL.md');
    const content = fs.readFileSync(skillMdPath, 'utf-8');
    const { frontmatter, body } = parseFrontmatter(content);

    const name = frontmatter.name || skillDir;
    const description = extractDescriptionFromContent(frontmatter, body);
    const categorySlug = SKILL_CATEGORY_MAP[skillDir] || 'operations-people';
    const isFeatured = FEATURED_SKILLS.includes(skillDir);

    const category = await prisma.category.findUnique({ where: { slug: categorySlug } });
    if (!category) {
      console.log(`⚠ Category not found for ${skillDir}: ${categorySlug}`);
      skipped++;
      continue;
    }

    // Extract tags
    const tagNames = extractTags(name, description, categorySlug);
    const tagRecords = [];
    for (const tagName of tagNames) {
      const tagSlug = tagName.toLowerCase().replace(/\s+/g, '-');
      const tag = await prisma.tag.upsert({
        where: { slug: tagSlug },
        update: { name: tagName },
        create: { name: tagName, slug: tagSlug },
      });
      tagRecords.push({ id: tag.id });
    }

    // Create or update skill
    await prisma.skill.upsert({
      where: { slug: skillDir },
      update: {
        name,
        description,
        content,
        tools: frontmatter.tools || null,
        model: frontmatter.model || null,
        userInvocable: frontmatter.user_invocable !== 'false',
        featured: isFeatured,
        categoryId: category.id,
        tags: {
          set: tagRecords.map(t => ({ id: t.id })),
        },
      },
      create: {
        name,
        slug: skillDir,
        description,
        content,
        tools: frontmatter.tools || null,
        model: frontmatter.model || null,
        userInvocable: frontmatter.user_invocable !== 'false',
        featured: isFeatured,
        categoryId: category.id,
        tags: {
          connect: tagRecords.map(t => ({ id: t.id })),
        },
      },
    });

    imported++;
    if (imported % 20 === 0) {
      console.log(`  Imported ${imported}/${skillDirs.length} skills...`);
    }
  }

  console.log(`\n✅ Seeding complete! Imported: ${imported}, Skipped: ${skipped}`);

  // Summary stats
  const totalSkills = await prisma.skill.count();
  const totalCategories = await prisma.category.count();
  const totalTags = await prisma.tag.count();
  const featuredSkills = await prisma.skill.count({ where: { featured: true } });

  console.log(`\n📊 Database stats:`);
  console.log(`   Skills: ${totalSkills}`);
  console.log(`   Categories: ${totalCategories}`);
  console.log(`   Tags: ${totalTags}`);
  console.log(`   Featured: ${featuredSkills}`);
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
