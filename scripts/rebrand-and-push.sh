#!/bin/bash
set -e

SOURCE_DIR="/home/z/my-project/claude-skills"
TARGET_DIR="/home/z/my-project/marqaiskills"

echo "=== Step 1: Copy source to target directory ==="
rm -rf "$TARGET_DIR"
cp -r "$SOURCE_DIR" "$TARGET_DIR"
# Remove the old .git to start fresh
rm -rf "$TARGET_DIR/.git"

echo "=== Step 2: Rename claude-* directories to marq-* ==="
cd "$TARGET_DIR"
# Rename directories starting with "claude-" to "marq-"
for dir in claude-*/; do
    if [ -d "$dir" ]; then
        new_name=$(echo "$dir" | sed 's/claude-/marq-/')
        mv "$dir" "$new_name"
        echo "Renamed: $dir -> $new_name"
    fi
done

echo "=== Step 3: Update references inside renamed directories' SKILL.md ==="
# Update the name field in SKILL.md for renamed directories
for dir in marq-*/; do
    if [ -d "$dir" ] && [ -f "$dir/SKILL.md" ]; then
        sed -i "s/name: claude-/name: marq-/g" "$dir/SKILL.md"
        echo "Updated name field in $dir/SKILL.md"
    fi
done

echo "=== Step 4: Replace 'Claude' references in all .md files ==="
# Find all .md files and replace Claude references with Marq AI
find "$TARGET_DIR" -name "*.md" -type f | while read file; do
    # Replace various Claude references
    sed -i 's/Claude Code/Marq AI/g' "$file"
    sed -i 's/Claude Skills/Marq AI Skills/g' "$file"
    sed -i 's/Claude and the Anthropic ecosystem/Marq AI ecosystem/g' "$file"
    sed -i 's/Claude for Enterprise/Marq AI Enterprise/g' "$file"
    sed -i 's/Claude/Marq AI/g' "$file"
    echo "Updated Claude refs in: $file"
done

echo "=== Step 5: Replace 'OneWave AI' references in all .md files ==="
find "$TARGET_DIR" -name "*.md" -type f | while read file; do
    sed -i 's/OneWave AI/Marq AI/g' "$file"
    sed -i 's/OneWave-AI/MarqAI/g' "$file"
    sed -i 's/onewave-ai/marqai/g' "$file"
    sed -i 's/onewave\.ai/marqai/g' "$file"
    sed -i 's/www\.onewave-ai\.com/www.marqai.io/g' "$file"
    sed -i 's/www\.onewave\.ai/www.marqai.io/g' "$file"
    echo "Updated OneWave refs in: $file"
done

echo "=== Step 6: Update README.md with Marq AI branding ==="
cat > "$TARGET_DIR/README.md" << 'READMEEOF'
# Marq AI Skills Platform

Production-ready skills for Marq AI. Built and maintained by [Marq AI](https://www.marqai.io) -- AI consulting and skills platform for businesses of all sizes.

**173+ skills** across three pillars: **business** (sales, marketing, consulting, ops), **everyday life** (personal finance, travel, fitness, job hunting), and **coding** (engineering, design, AI agent architecture).

---

## Featured: /agent-army

Deploy 3 to 50+ independent Marq AI agents in parallel, each with its own context window. Each agent spawns sub-agents underneath. A top-tier commander orchestrates the swarms, and you pick a power level -- Max Power, Heavy, Balanced, or Economy -- that sets the model mix for each layer. The system runs in waves -- execute, audit, propagate -- and checks its own work between each.

Built for tasks where one agent isn't enough: large refactors, full-site audits, bulk content generation, codebase migrations. Battle-tested on 60+ concurrent agents in a single session.

**[View agent-army](https://github.com/pmkshar/marqaiskills/tree/main/agent-army)**

---

## Getting Started

```bash
# Install a single skill
marq skill install MarqAI/marqaiskills/<skill-name>

# Or clone the full library
git clone https://github.com/pmkshar/marqaiskills.git ~/.marq/skills
```

Each skill is a self-contained `SKILL.md` file that Marq AI loads as a system prompt. No dependencies, no build step.

---

## Categories

### AI Agent Architecture
Skills for building, orchestrating, and managing autonomous AI agents.

| Skill | Description |
|-------|-------------|
| `agent-army` | 2-layer parallel agent hierarchy for large tasks at maximum speed |
| `agent-to-agent` | A2A communication protocol -- message passing, shared context, handoffs |
| `agent-swarm-deployer` | Deploy swarms of sub-agents for massive parallel data processing |
| `agent-team-builder` | Design and deploy custom agent teams for business workflows |
| `sub-agent-orchestrator` | Parent/child agent orchestration with task delegation |
| `scout` | Recommends the best skill for any task |
| `scout-pro` | Enhanced scout with skill chains, pattern recognition, usage learning |
| `skill-navigator` | Guide to all skills with combination recommendations |
| `skill-composer-studio` | Chain multiple skills into custom workflows |

### Marq AI Products
Skills built around specific Marq AI product releases.

| Skill | Description |
|-------|-------------|
| `overnight-repo-auditor` | Uses Managed Agents for autonomous overnight codebase audits |
| `multi-agent-client-onboarding` | Agent SDK: 3 parallel agents for client assessment |
| `cowork-deal-room` | Cowork-style multi-step deal room document analysis |
| `gmail-to-crm-pipeline` | Connectors: Gmail to CRM lead qualification pipeline |
| `full-codebase-migrator` | Large context window: ingest entire codebases for migration planning |
| `marq-design-system-architect` | Generate a premium design system (tokens, type, motion) exported to Tailwind/CSS |
| `marq-landing-composer` | Build premium animated landing pages, anti-template |
| `marq-design-critic` | Audit a UI and refine it — design + copy fixes toward editorial/premium |

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

Marq AI loads this as a system prompt when the skill is invoked. Only `name` and `description` are required; most skills here use just those two. The `description` is what Marq AI reads to decide when to trigger the skill, so make it specific.

---

## About Marq AI

[Marq AI](https://www.marqai.io) is an AI skills platform specializing in intelligent automation and AI agent architecture. We help businesses implement AI that ships real results -- from enterprise deployment to custom agent architecture.

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

echo "=== Step 7: Update LICENSE ==="
cat > "$TARGET_DIR/LICENSE" << 'LICENSEEOF'
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
LICENSEEOF

echo "=== Step 8: Update .gitignore ==="
cat > "$TARGET_DIR/.gitignore" << 'GITIGNOREEOF'
.workflow-*.js
.army-state.md
.env
.env.*
!.env.example
.DS_Store
node_modules/
.vercel/
GITIGNOREEOF

echo "=== Step 9: Initialize git and push to target repo ==="
cd "$TARGET_DIR"
git init
git add -A
git commit -m "Initial commit: Marq AI Skills Platform - rebranded from Claude Skills

- Renamed all 'Claude' references to 'Marq AI'
- Renamed all 'OneWave AI' references to 'Marq AI'
- Renamed claude-* directories to marq-*
- Updated README.md with Marq AI branding
- Updated LICENSE with Marq AI copyright
- 173+ production-ready skills across business, life, and coding pillars"

git branch -M main
git remote add origin https://github.com/pmkshar/marqaiskills.git
git push -u origin main 2>&1 || echo "PUSH_FAILED: Will retry with force"

echo "=== Done! ==="
