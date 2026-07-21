// In-memory store for Vercel serverless environment
// Used as fallback when SQLite is not available

interface Agent {
  id: string;
  name: string;
  slug: string;
  type: string;
  description: string;
  avatar: string;
  color: string;
  status: string;
  capabilities: string;
  systemPrompt: string;
  industry: string[];
  tasksCompleted: number;
  createdAt: string;
  updatedAt: string;
}

interface Task {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  result: string | null;
  agentId: string;
  createdAt: string;
  updatedAt: string;
}

interface ChatMessage {
  id: string;
  role: string;
  content: string;
  agentId: string;
  conversationId: string;
  userId: string;
  createdAt: string;
  deletedAt: string | null;
}

interface Conversation {
  id: string;
  agentId: string;
  userId: string;
  title: string;
  status: 'active' | 'archived';
  lastMessageAt: string;
  messageCount: number;
  createdAt: string;
  updatedAt: string;
}

interface User {
  id: string;
  email: string;
  name: string;
  password: string;
  role: string;
  avatar: string;
  department: string;
  isActive: boolean;
  lastLogin: string | null;
  createdAt: string;
  updatedAt: string;
}

// Generate simple CUID-like IDs
let idCounter = 0;
function cuid(): string {
  return `mem_${Date.now()}_${++idCounter}`;
}

// Default agents
const DEFAULT_AGENTS: Agent[] = [
  {
    id: 'agent_dev',
    name: 'DevAgent',
    slug: 'dev-agent',
    type: 'development',
    description: 'Full-stack development agent that writes, reviews, and refactors code across any language or framework. Handles architecture decisions, code generation, debugging, and deployment automation.',
    avatar: '💻',
    color: '#10B981',
    status: 'idle',
    capabilities: 'code-generation,code-review,debugging,refactoring,architecture,deployment,api-design,database-ops',
    systemPrompt: 'You are DevAgent, a senior full-stack developer with 15+ years of experience across all major languages and frameworks. You write clean, performant, well-documented code.',
    industry: ['Technology & Software', 'Telecommunications', 'Finance & Banking'],
    tasksCompleted: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'agent_test',
    name: 'TestAgent',
    slug: 'test-agent',
    type: 'testing',
    description: 'QA and testing specialist that creates comprehensive test suites, performs regression analysis, and ensures software quality. Expert in unit, integration, E2E, and performance testing.',
    avatar: '🧪',
    color: '#8B5CF6',
    status: 'idle',
    capabilities: 'unit-testing,integration-testing,e2e-testing,performance-testing,regression-analysis,test-automation,quality-assurance,boundary-testing',
    systemPrompt: 'You are TestAgent, a QA engineer specializing in comprehensive test coverage. You write tests that catch real bugs, not just inflate coverage numbers.',
    industry: ['Technology & Software', 'Healthcare & Life Sciences', 'Finance & Banking', 'Retail & E-Commerce'],
    tasksCompleted: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'agent_ba',
    name: 'BAAgent',
    slug: 'ba-agent',
    type: 'business-analysis',
    description: 'Business analysis agent that gathers requirements, maps workflows, and translates business needs into technical specifications. Expert in stakeholder management and process optimization.',
    avatar: '📊',
    color: '#F59E0B',
    status: 'idle',
    capabilities: 'requirements-gathering,process-mapping,stakeholder-management,spec-writing,workflow-analysis,gap-analysis,impact-assessment,user-stories,acceptance-criteria',
    systemPrompt: 'You are BAAgent, a senior business analyst with deep experience bridging business and technology. You ask the right questions to uncover real requirements.',
    industry: ['Technology & Software', 'Healthcare & Life Sciences', 'Finance & Banking', 'Retail & E-Commerce', 'Manufacturing & Supply Chain', 'Education & Training'],
    tasksCompleted: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'agent_sales',
    name: 'SalesAgent',
    slug: 'sales-agent',
    type: 'sales',
    description: 'Sales operations agent that handles lead qualification, pipeline management, proposal generation, and deal strategy. Expert in CRM optimization and sales methodology implementation.',
    avatar: '🎯',
    color: '#EF4444',
    status: 'idle',
    capabilities: 'lead-qualification,pipeline-management,proposal-writing,deal-strategy,crm-ops,sales-forecasting,competitive-analysis,objection-handling,closing-strategy',
    systemPrompt: 'You are SalesAgent, a top-performing sales strategist and operator. You understand that great sales is about solving customer problems, not pushing products.',
    industry: ['Retail & E-Commerce', 'Finance & Banking', 'Technology & Software', 'Manufacturing & Supply Chain'],
    tasksCompleted: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'agent_impl',
    name: 'ImplAgent',
    slug: 'impl-agent',
    type: 'implementation',
    description: 'Implementation and project delivery agent that manages deployments, configurations, and go-live processes. Expert in change management and rollout strategy.',
    avatar: '🚀',
    color: '#06B6D4',
    status: 'idle',
    capabilities: 'project-delivery,deployment-management,configuration,change-management,rollout-strategy,migration,go-live-planning,rollback-planning,environment-setup',
    systemPrompt: 'You are ImplAgent, an implementation specialist who ensures smooth project delivery. You plan for success but prepare for failure with rollback strategies.',
    industry: ['Technology & Software', 'Manufacturing & Supply Chain', 'Telecommunications', 'Energy & Utilities'],
    tasksCompleted: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'agent_data',
    name: 'DataAgent',
    slug: 'data-agent',
    type: 'data-analysis',
    description: 'Data analysis agent that performs statistical analysis, creates visualizations, and extracts insights from data. Expert in data pipelines, ETL processes, and business intelligence.',
    avatar: '📈',
    color: '#3B82F6',
    status: 'idle',
    capabilities: 'statistical-analysis,data-visualization,etl-pipelines,business-intelligence,predictive-modeling,data-cleaning,report-generation,trend-analysis,anomaly-detection',
    systemPrompt: 'You are DataAgent, a senior data analyst and scientist. You turn raw data into actionable insights. You create visualizations that tell clear stories.',
    industry: ['Technology & Software', 'Healthcare & Life Sciences', 'Finance & Banking', 'Retail & E-Commerce', 'Manufacturing & Supply Chain', 'Education & Training'],
    tasksCompleted: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'agent_sysadmin',
    name: 'SysAdminAgent',
    slug: 'sysadmin-agent',
    type: 'system-admin',
    description: 'System administration agent that manages infrastructure, monitors system health, and handles incident response. Expert in cloud platforms, DevOps, and security operations.',
    avatar: '🛡️',
    color: '#64748B',
    status: 'idle',
    capabilities: 'infrastructure-management,monitoring,incident-response,devops,security-ops,cloud-management,backup-recovery,performance-tuning,capacity-planning',
    systemPrompt: 'You are SysAdminAgent, a veteran system administrator with deep expertise in cloud infrastructure, DevOps, and security. You automate everything that can be automated.',
    industry: ['Technology & Software', 'Telecommunications', 'Energy & Utilities', 'Finance & Banking'],
    tasksCompleted: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'agent_support',
    name: 'SupportAgent',
    slug: 'support-agent',
    type: 'support',
    description: 'Customer support agent that handles tickets, resolves issues, and improves support processes. Expert in escalation management, knowledge base creation, and customer satisfaction optimization.',
    avatar: '🎧',
    color: '#EC4899',
    status: 'idle',
    capabilities: 'ticket-resolution,escalation-management,knowledge-base,customer-satisfaction,sla-management,triage,root-cause-analysis,training-materials,process-improvement',
    systemPrompt: 'You are SupportAgent, a customer support specialist who genuinely cares about solving problems. You respond quickly, communicate clearly, and follow up thoroughly.',
    industry: ['Technology & Software', 'Healthcare & Life Sciences', 'Retail & E-Commerce', 'Telecommunications', 'Education & Training'],
    tasksCompleted: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// Default users with bcrypt hashes
const DEFAULT_USERS: User[] = [
  { id: 'user_admin', email: 'admin@marq.ai', name: 'MARQ Admin', password: '$2a$12$LJ3m4ys3Hz0JeVN5UxCE/.B9X6F0O3hKN1vG5P3Q7V8K9M0N1O2P3R', role: 'admin', avatar: '👑', department: 'Executive', isActive: true, lastLogin: null, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'user_manager', email: 'manager@marq.ai', name: 'Sarah Mitchell', password: '$2a$12$LJ3m4ys3Hz0JeVN5UxCE/.B9X6F0O3hKN1vG5P3Q7V8K9M0N1O2P3R', role: 'manager', avatar: '📋', department: 'Operations', isActive: true, lastLogin: null, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'user_developer', email: 'developer@marq.ai', name: 'Alex Chen', password: '$2a$12$LJ3m4ys3Hz0JeVN5UxCE/.B9X6F0O3hKN1vG5P3Q7V8K9M0N1O2P3R', role: 'developer', avatar: '💻', department: 'Engineering', isActive: true, lastLogin: null, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'user_analyst', email: 'analyst@marq.ai', name: 'Priya Sharma', password: '$2a$12$LJ3m4ys3Hz0JeVN5UxCE/.B9X6F0O3hKN1vG5P3Q7V8K9M0N1O2P3R', role: 'analyst', avatar: '📊', department: 'Analytics', isActive: true, lastLogin: null, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'user_operator', email: 'operator@marq.ai', name: 'James Rodriguez', password: '$2a$12$LJ3m4ys3Hz0JeVN5UxCE/.B9X6F0O3hKN1vG5P3Q7V8K9M0N1O2P3R', role: 'operator', avatar: '🔧', department: 'Infrastructure', isActive: true, lastLogin: null, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'user_viewer', email: 'viewer@marq.ai', name: 'Emily Watson', password: '$2a$12$LJ3m4ys3Hz0JeVN5UxCE/.B9X6F0O3hKN1vG5P3Q7V8K9M0N1O2P3R', role: 'viewer', avatar: '👁️', department: 'Stakeholder', isActive: true, lastLogin: null, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
];

class MemoryStore {
  agents: Agent[] = [...DEFAULT_AGENTS];
  tasks: Task[] = [];
  chatMessages: ChatMessage[] = [];
  conversations: Conversation[] = [];
  users: User[] = [...DEFAULT_USERS];
  isAvailable = true;

  // Agent operations
  getAgents() { return this.agents; }
  getAgentById(id: string) { return this.agents.find(a => a.id === id); }
  
  updateAgent(id: string, data: Partial<Agent>) {
    const idx = this.agents.findIndex(a => a.id === id);
    if (idx !== -1) {
      this.agents[idx] = { ...this.agents[idx], ...data, updatedAt: new Date().toISOString() };
      return this.agents[idx];
    }
    return null;
  }

  incrementAgentTasks(id: string) {
    const agent = this.getAgentById(id);
    if (agent) {
      agent.tasksCompleted++;
      agent.updatedAt = new Date().toISOString();
    }
  }

  // Task operations
  createTask(data: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) {
    const task: Task = {
      ...data,
      id: cuid(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.tasks.unshift(task);
    return task;
  }

  getTasks(agentId?: string) {
    if (agentId) return this.tasks.filter(t => t.agentId === agentId);
    return this.tasks;
  }

  getActiveTasks(agentId: string) {
    return this.tasks.filter(t => t.agentId === agentId && (t.status === 'pending' || t.status === 'running'));
  }

  updateTask(id: string, data: Partial<Task>) {
    const idx = this.tasks.findIndex(t => t.id === id);
    if (idx !== -1) {
      this.tasks[idx] = { ...this.tasks[idx], ...data, updatedAt: new Date().toISOString() };
      return this.tasks[idx];
    }
    return null;
  }

  // Conversation operations
  createConversation(data: { agentId: string; userId: string; title: string }) {
    const conv: Conversation = {
      id: cuid(),
      agentId: data.agentId,
      userId: data.userId,
      title: data.title,
      status: 'active',
      lastMessageAt: new Date().toISOString(),
      messageCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.conversations.unshift(conv);
    return conv;
  }

  getConversations(agentId?: string, userId?: string, status?: string) {
    return this.conversations.filter(c => {
      if (agentId && c.agentId !== agentId) return false;
      if (userId && c.userId !== userId) return false;
      if (status && c.status !== status) return false;
      return true;
    });
  }

  getConversationById(id: string) {
    return this.conversations.find(c => c.id === id);
  }

  archiveConversation(id: string) {
    const idx = this.conversations.findIndex(c => c.id === id);
    if (idx !== -1) {
      this.conversations[idx].status = 'archived';
      this.conversations[idx].updatedAt = new Date().toISOString();
      return this.conversations[idx];
    }
    return null;
  }

  unarchiveConversation(id: string) {
    const idx = this.conversations.findIndex(c => c.id === id);
    if (idx !== -1) {
      this.conversations[idx].status = 'active';
      this.conversations[idx].updatedAt = new Date().toISOString();
      return this.conversations[idx];
    }
    return null;
  }

  deleteConversation(id: string) {
    // Soft-delete: mark messages as deleted but keep for admin recovery
    const conv = this.conversations.find(c => c.id === id);
    if (conv) {
      // Mark all messages as deleted
      this.chatMessages.forEach(m => {
        if (m.conversationId === id) {
          m.deletedAt = new Date().toISOString();
        }
      });
      // Remove conversation from list (admin can still see deleted messages)
      this.conversations = this.conversations.filter(c => c.id !== id);
      return true;
    }
    return false;
  }

  // Chat operations
  createChatMessage(data: { role: string; content: string; agentId: string; conversationId?: string; userId?: string }) {
    const msg: ChatMessage = {
      id: cuid(),
      role: data.role,
      content: data.content,
      agentId: data.agentId,
      conversationId: data.conversationId || 'default',
      userId: data.userId || 'unknown',
      createdAt: new Date().toISOString(),
      deletedAt: null,
    };
    this.chatMessages.push(msg);

    // Update conversation stats
    if (data.conversationId) {
      const convIdx = this.conversations.findIndex(c => c.id === data.conversationId);
      if (convIdx !== -1) {
        this.conversations[convIdx].messageCount++;
        this.conversations[convIdx].lastMessageAt = new Date().toISOString();
        this.conversations[convIdx].updatedAt = new Date().toISOString();
      }
    }

    return msg;
  }

  getChatMessages(agentId: string, includeDeleted = false) {
    return this.chatMessages.filter(m => {
      if (m.agentId !== agentId) return false;
      if (!includeDeleted && m.deletedAt) return false;
      return true;
    });
  }

  getConversationMessages(conversationId: string, includeDeleted = false) {
    return this.chatMessages.filter(m => {
      if (m.conversationId !== conversationId) return false;
      if (!includeDeleted && m.deletedAt) return false;
      return true;
    });
  }

  // Admin: get ALL messages including deleted ones
  getAllMessages(includeDeleted = false) {
    if (includeDeleted) return this.chatMessages;
    return this.chatMessages.filter(m => !m.deletedAt);
  }

  // Admin: get all conversations including deleted
  getAllConversations() {
    return this.conversations;
  }

  // User operations
  getUserByEmail(email: string) { return this.users.find(u => u.email === email); }
  getUserById(id: string) { return this.users.find(u => u.id === id); }
  getAllUsers() {
    return this.users.map(({ password, ...rest }) => rest);
  }
  
  updateUser(id: string, data: Partial<User>) {
    const idx = this.users.findIndex(u => u.id === id);
    if (idx !== -1) {
      this.users[idx] = { ...this.users[idx], ...data, updatedAt: new Date().toISOString() };
    }
  }

  seedUsers() {
    // Already seeded in constructor
    return this.users.length;
  }
}

// Singleton
export const memoryStore = new MemoryStore();

// Check if we're running on Vercel (serverless)
export function isVercel(): boolean {
  return !!(process.env.VERCEL || process.env.VERCEL_URL);
}
