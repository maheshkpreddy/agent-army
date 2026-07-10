#!/bin/bash
# Rebrand Claude Skills → Marq AI Skills Platform
# Then build a Next.js web app for Vercel deployment

set -e
WORKDIR="/home/z/my-project/marqaisills-temp"
TARGET="/home/z/my-project/marqaiskills"

echo "=== Step 1: Text replacements in all .md files ==="

# Replace in all SKILL.md and other .md files
find "$WORKDIR" -name "*.md" -type f | while read file; do
    # Skip .git directory
    if [[ "$file" == *".git"* ]]; then continue; fi
    
    # Claude → Marq AI (in context of AI agent/skills references)
    sed -i 's/Claude Code/Marq AI/g' "$file"
    sed -i 's/Claude agent/Marq AI agent/g' "$file"
    sed -i 's/Claude Agents/Marq AI Agents/g' "$file"
    sed -i 's/Claude skills/Marq AI Skills/g' "$file"
    sed -i 's/claude-skills/marqaiskills/g' "$file"
    sed -i 's/Claude Skills/Marq AI Skills/g' "$file"
    sed -i 's/claude skill/Marq AI skill/g' "$file"
    sed -i 's/Claude Skill/Marq AI Skill/g' "$file"
    sed -i 's/Claude for Enterprise/Marq AI Enterprise/g' "$file"
    sed -i 's/Claude and the Anthropic ecosystem/Marq AI ecosystem/g' "$file"
    sed -i 's/Claude Consulting/Marq AI Consulting/g' "$file"
    sed -i 's/Claude/Marq AI/g' "$file"
    
    # OneWave AI → Marq AI
    sed -i 's/OneWave-AI/pmkshar/g' "$file"
    sed -i 's/OneWave AI/Marq AI/g' "$file"
    sed -i 's/OneWave/Marq AI/g' "$file"
    sed -i 's/onewave-ai/marqai/g' "$file"
    sed -i 's/onewave/marqai/g' "$file"
    sed -i 's/www\.onewave-ai\.com/www.marqai.io/g' "$file"
    sed -i 's/www\.onewave\.com/www.marqai.io/g' "$file"
    
    # Anthropic → Marq AI (in branding context)
    sed -i 's/Anthropic ecosystem/Marq AI ecosystem/g' "$file"
    sed -i 's/Anthropic product/Marq AI product/g' "$file"
    sed -i 's/Anthropic/Marq AI/g' "$file"
    
    # Fable or Opus → Marq AI Pro (model references)
    sed -i 's/Fable or Opus/Marq AI Pro/g' "$file"
    sed -i 's/Opus/Marq AI Pro/g' "$file"
    sed -i 's/Sonnet/Marq AI Standard/g' "$file"
    sed -i 's/Haiku/Marq AI Light/g' "$file"
    
    # Skill folder references
    sed -i 's|OneWave-AI/claude-skills|pmkshar/marqaiskills|g' "$file"
    sed -i 's|~/.claude/skills|~/.marqai/skills|g' "$file"
    sed -i 's|\.claude/skills|.marqai/skills|g' "$file"
    sed -i 's|claude skill install|marqai skill install|g' "$file"
done

echo "=== Step 2: Rename directories with 'claude' ==="
cd "$WORKDIR"
# Already renamed the main ones; check for any remaining
for dir in $(find . -maxdepth 1 -type d -name "*claude*"); do
    newname=$(echo "$dir" | sed 's/claude/marq/g')
    mv "$dir" "$newname"
    echo "Renamed $dir → $newname"
done

echo "=== Step 3: Update SKILL.md frontmatter name fields ==="
find "$WORKDIR" -name "SKILL.md" -type f | while read file; do
    sed -i 's/name: claude-/name: marq-/g' "$file"
done

echo "=== Step 4: Update LICENSE ==="
cat > "$WORKDIR/LICENSE" << 'EOF'
MIT License

Copyright (c) 2025 Marq AI

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
EOF

echo "=== Step 5: Create new README.md ==="
cat > "$WORKDIR/README.md" << 'READMEEOF'
# Marq AI Skills Platform

Production-ready skills for Marq AI. Built and maintained by [Marq AI](https://www.marqai.io) — AI consulting and solutions for businesses of all sizes.

**173 skills** across three pillars: **business** (sales, marketing, consulting, ops), **everyday life** (personal finance, travel, fitness, job hunting), and **coding** (engineering, design, AI agent architecture).

---

## Featured: /agent-army

Deploy 3 to 50+ independent Marq AI agents in parallel, each with its own context window. Each agent spawns sub-agents underneath. A top-tier commander (Marq AI Pro) orchestrates the swarms, and you pick a power level — Max Power, Heavy, Balanced, or Economy — that sets the model mix for each layer. The system runs in waves — execute, audit, propagate — and checks its own work between each.

Built for tasks where one agent isn't enough: large refactors, full-site audits, bulk content generation, codebase migrations. Battle-tested on 60+ concurrent agents in a single session.

**[View agent-army](https://github.com/pmkshar/marqaiskills/tree/main/agent-army)**

---

## Getting Started

```bash
# Install a single skill
marqai skill install pmkshar/marqaiskills/<skill-name>

# Or clone the full library
git clone https://github.com/pmkshar/marqaiskills.git ~/.marqai/skills
```

Each skill is a self-contained `SKILL.md` file that Marq AI loads as a system prompt. No dependencies, no build step.

---

## Categories

### AI Agent Architecture
Skills for building, orchestrating, and managing autonomous AI agents.

| Skill | Description |
|-------|-------------|
| `agent-army` | 2-layer parallel agent hierarchy for large tasks at maximum speed |
| `agent-to-agent` | A2A communication protocol — message passing, shared context, handoffs |
| `agent-swarm-deployer` | Deploy swarms of sub-agents for massive parallel data processing |
| `agent-team-builder` | Design and deploy custom agent teams for business workflows |
| `sub-agent-orchestrator` | Parent/child agent orchestration with task delegation |
| `scout` | Recommends the best skill for any task |
| `scout-pro` | Enhanced scout with skill chains, pattern recognition, usage learning |
| `skill-navigator` | Guide to all skills with combination recommendations |
| `skill-composer-studio` | Chain multiple skills into custom workflows |

### Marq AI Products
Skills built around specific Marq AI platform capabilities.

| Skill | Description |
|-------|-------------|
| `overnight-repo-auditor` | Uses Managed Agents (14.5hr runtime) for autonomous overnight codebase audits |
| `multi-agent-client-onboarding` | Agent SDK: 3 parallel agents for client assessment |
| `cowork-deal-room` | Cowork-style multi-step deal room document analysis |
| `gmail-to-crm-pipeline` | MCP Connectors: Gmail to CRM lead qualification pipeline |
| `full-codebase-migrator` | Large context window: ingest entire codebases for migration planning |
| `marq-design-system-architect` | Generate a premium design system (tokens, type, motion) exported to Tailwind/CSS |
| `marq-landing-composer` | Build premium animated landing pages in Next.js + Framer Motion, anti-template |
| `marq-design-critic` | Audit a UI and de-AI it — design + copy fixes toward editorial/premium |

### Sales and Revenue
| Skill | Description |
|-------|-------------|
| `deal-closer-playbook` | Closing strategy with buying committee mapping and objection handling |
| `renewal-predictor` | Predict renewal likelihood from health score signals |
| `expansion-revenue-finder` | Identify upsell and cross-sell opportunities in existing accounts |
| `pipeline-health-analyzer` | Identify stalled deals, predict close probability |
| `deal-review-framework` | MEDDIC/BANT deal assessment with risk scoring |
| `deal-momentum-analyzer` | Score deal velocity from engagement patterns |
| `sales-forecast-builder` | Weighted pipeline forecast with scenario modeling |
| `sales-call-prep-assistant` | Pre-call research briefs with discovery questions |
| `sales-methodology-implementer` | MEDDIC, BANT, Sandler, Challenger, SPIN implementation |
| `lead-scoring-model` | Build custom lead scoring from historical win/loss data |
| `inbound-lead-qualifier` | Score inbound leads by ICP fit, intent, and urgency |
| `cold-email-sequence-generator` | Multi-touch outbound campaigns optimized for response |
| `personalization-at-scale` | Personalized first lines for hundreds of prospects |
| `champion-identifier` | Find internal champions in target accounts |
| `intent-signal-aggregator` | Monitor buyer intent signals across the web |
| `objection-pattern-detector` | Mine lost deals for recurring objection patterns |
| `lookalike-customer-finder` | Find companies matching your best customer profile |
| `quota-setting-calculator` | Top-down vs bottom-up quota models |
| `sales-comp-plan-designer` | Variable compensation design with accelerators |
| `sales-coaching-plan-generator` | Individualized rep development plans |
| `ramping-rep-tracker` | 30/60/90/120 day ramp milestones |
| `rep-performance-scorecard` | Multi-dimensional rep evaluation |
| `territory-planning-optimizer` | Account assignment by revenue potential |
| `icp-deep-scanner` | Read-only deep scan of connected tools → data-grounded ICP + persona library |
| `customer-panel-of-experts` | Your buyer personas debate any decision (launch, price, product) and recommend |
| `prospect-panel-simulator` | Simulate prospects to pressure-test emails, decks, and pages before sending |
| `pricing-change-strategist` | Plan a price increase: segmentation, scenarios, grandfathering, full comms kit |

### Consulting and Professional Services
| Skill | Description |
|-------|-------------|
| `client-proposal-generator` | Full consulting proposals from a brief |
| `sow-generator` | Professional Statements of Work with legal boilerplate |
| `client-health-dashboard` | RAG status across all client accounts |
| `churn-autopsy` | Post-mortem analysis when a client churns |
| `onboarding-checklist` | Customized client onboarding plans |
| `ai-readiness-assessment` | Assess how ready a business is for AI adoption |
| `saas-replacement-planner` | Evaluate which SaaS tools can be replaced with AI agents |
| `roi-calculator` | AI implementation ROI with sensitivity analysis |
| `meeting-intelligence` | Extract decisions, action items, and sentiment from transcripts |
| `meeting-to-tasks` | Convert transcripts to action items with owner assignment |
| `weekly-business-report` | Auto-generated weekly KPI reports |

### Engineering and DevOps
| Skill | Description |
|-------|-------------|
| `code-review-pro` | Security, performance, and best practices review |
| `api-load-tester` | Progressive load testing with bottleneck analysis |
| `database-migrator` | Cross-provider database migration with validation |
| `incident-responder` | Production incident response automation |
| `runbook-generator` | Operational runbooks from codebase analysis |
| `data-pipeline-builder` | ETL/ELT pipeline design and implementation |
| `dependency-auditor` | Security vulnerabilities and outdated packages |
| `test-coverage-improver` | Find and fill test coverage gaps |
| `docker-debugger` | Container troubleshooting and optimization |
| `env-setup-wizard` | Environment variable management |
| `error-boundary-creator` | React error boundaries and fallback UIs |
| `git-pr-reviewer` | Pull request quality review |
| `regex-debugger` | Visual regex breakdown and debugging |
| `performance-profiler` | Application performance profiling |
| `api-endpoint-scaffolder` | REST API endpoint generation |
| `responsive-layout-builder` | CSS Grid, Flexbox, container queries |
| `react-component-generator` | React components with TypeScript and a11y |
| `design-system-generator` | Design tokens, components, documentation |
| `css-animation-creator` | Professional animations and micro-interactions |
| `database-schema-designer` | Optimized schemas with ERD diagrams |
| `screenshot-to-code` | Convert UI screenshots to working code |
| `landing-page-optimizer` | Conversion and performance optimization |

### Security and Compliance
| Skill | Description |
|-------|-------------|
| `compliance-checker` | GDPR, HIPAA, SOC2, CCPA, PCI-DSS audit |
| `security-pentest-planner` | Penetration test planning (OWASP Top 10) |
| `tech-due-diligence` | Technical due diligence for M&A/investment |
| `contract-analyzer` | Review contracts for concerning clauses |
| `contract-redliner` | Generate redline suggestions with replacement language |

### Marketing and Content
| Skill | Description |
|-------|-------------|
| `seo-optimizer` | Keyword analysis, readability, competitor comparison |
| `seo-keyword-cluster-builder` | Topic cluster architecture |
| `landing-page-copywriter` | High-converting copy using PAS, AIDA, StoryBrand |
| `brand-voice-analyzer` | Extract and codify brand voice from existing content |
| `content-repurposer` | Transform content into 8+ formats |
| `social-repurposer` | Adapt content for different platforms |
| `social-selling-content-generator` | LinkedIn thought leadership posts |
| `tweetclaw-x-twitter-automation` | TweetClaw X/Twitter workflows |
| `linkedin-post-optimizer` | Professional narrative with hooks |
| `utm-parameter-generator` | Standardized UTM tracking |
| `competitor-content-analyzer` | Track competitor content strategy |
| `competitor-price-tracker` | Monitor competitor pricing changes |
| `competitor-intel-agent` | Comprehensive competitor monitoring |
| `customer-review-aggregator` | Aggregate and analyze reviews from G2, Capterra, etc. |
| `podcast-content-suite` | Transform podcasts into content marketing |
| `webinar-content-repurposer` | Webinar to blog, social, email |
| `email-template-generator` | Professional email templates |
| `email-subject-line-optimizer` | A/B test subject lines |
| `product-launch-war-room` | Adversarial GTM war room: go/no-go, risk register, phased rollout, kill criteria |
| `hyperframes-ad-director` | Brief → finished HyperFrames video ad: hook, script, storyboard, scenes, cuts |
| `hyperframes-sales-demo-builder` | Personalized product-demo videos in HyperFrames for a specific account |

### Strategy and Finance
| Skill | Description |
|-------|-------------|
| `pricing-strategy` | Pricing model design with competitive analysis |
| `market-sizing` | TAM/SAM/SOM with top-down and bottom-up estimates |
| `pitch-deck-reviewer` | Investor deck review with scoring |
| `board-deck-generator` | Board meeting presentation content |
| `investor-update-writer` | Monthly/quarterly investor updates |
| `executive-dashboard-generator` | Data to executive-ready reports |
| `financial-parser` | Extract data from invoices, receipts, statements |
| `portfolio-analyzer` | Investment portfolio risk and diversification |
| `budget-optimizer` | Spending analysis and savings strategies |
| `financial-goal-planner` | Savings targets and investment strategies |
| `tax-strategy-optimizer` | Pre-tax, Roth, charitable giving optimization |

### Operations and People
| Skill | Description |
|-------|-------------|
| `workflow-automator` | Design automated workflows from manual processes |
| `okr-generator` | OKRs following Google/Intel methodology |
| `customer-journey-mapper` | Full journey from first touch to advocacy |
| `hiring-scorecard` | Structured scorecards for any role |
| `knowledge-base-builder` | FAQ identification and tutorial creation |
| `technical-writer` | User guides, architecture docs, onboarding materials |
| `job-application-optimizer` | Tailor resumes to job postings |
| `raise-negotiation-prep` | Salary research and negotiation scripts |

### Sports and Entertainment
| Skill | Description |
|-------|-------------|
| `bracket-predictor` | Tournament bracket predictions with upset analysis |
| `fantasy-lineup-optimizer` | Fantasy sports lineup optimization |
| `game-strategy-simulator` | Game strategy simulation and analysis |
| `scouting-report-builder` | Professional scouting reports |
| `player-comparison-tool` | Side-by-side player comparisons |
| `highlight-reel-scripter` | Highlight reel narration scripts |
| `game-recap-generator` | Game recap generation |
| `injury-report-tracker` | Injury tracking and impact analysis |
| `training-log-analyzer` | Training performance analysis |
| `workout-program-designer` | Customized workout programs |
| `trash-talk-generator` | Creative trash talk for rivalries |
| `sports-meme-creator` | Sports-themed meme creation |
| `sports-betting-analyzer` | Betting odds analysis |
| `sports-podcast-outline-generator` | Sports podcast outlines |
| `sports-trivia-builder` | Sports trivia question sets |
| `play-by-play-generator` | Play-by-play commentary generation |
| `post-game-press-conference-simulator` | Simulated press conferences |
| `practice-plan-creator` | Practice session planning |
| `team-chemistry-evaluator` | Team chemistry assessment |
| `athlete-social-media-manager` | Athlete social media content |
| `scout` | Sports scouting recommendations |
| `scout-pro` | Enhanced scouting with pattern recognition |

### Everyday Life
| Skill | Description |
|-------|-------------|
| `budget-optimizer` | Spending analysis and savings strategies |
| `financial-goal-planner` | Savings targets and investment strategies |
| `tax-strategy-optimizer` | Pre-tax, Roth, charitable giving optimization |
| `itinerary-optimizer` | Travel itinerary optimization |
| `flashcard-generator` | Study flashcard creation |
| `quiz-maker` | Quiz and assessment creation |
| `debate-simulator` | Simulated debates on any topic |
| `before-you-build` | Pre-build planning checklist |

---

## Skill Format

Every skill is a single `SKILL.md` file with YAML frontmatter:

```yaml
---
name: skill-name                 # required — kebab-case, matches the folder
description: What the skill does and when to use it.   # required — drives auto-selection
tools: Read, Write, Bash, Agent  # optional — restrict tool access; omit to inherit all
model: inherit                   # optional — pin a model; omit to inherit the session model
---

# Skill prompt content here...
```

Marq AI loads this as a system prompt when the skill is invoked. Only `name` and `description` are required; most skills here use just those two. The `description` is what the system reads to decide when to trigger the skill, so make it specific.

---

## About Marq AI

[Marq AI](https://www.marqai.io) is an AI solutions platform specializing in intelligent agent architecture and skills-based automation. We help businesses implement AI that ships real results — from enterprise deployment to custom agent architecture.

- [Marq AI Platform](https://www.marqai.io)
- [Services](https://www.marqai.io/services)
- [Blog](https://www.marqai.io/blog)
- [Contact](https://www.marqai.io/contact)

---

## Contributing

1. Fork the repository
2. Create a new folder with your skill name
3. Add a `SKILL.md` following the format above
4. Submit a pull request

Skills should be production-ready, well-documented, and solve a real problem. No placeholder or stub skills.

---

## License

MIT
READMEEOF

echo "=== Step 6: Remove .git from source ==="
rm -rf "$WORKDIR/.git"

echo "=== Rebranding complete! ==="
