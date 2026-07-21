'use client';

import React, { useEffect, useState, useCallback, useRef, useMemo, memo } from 'react';
import {
  Code2, TestTube2, BarChart3, Target, Rocket, TrendingUp,
  Shield, Headphones, Send, Bot, Activity, Clock, CheckCircle2,
  AlertCircle, Loader2, ChevronRight, Sparkles, Zap,
  Play, MessageSquare, X, Terminal,
  RefreshCw, LogOut, Lock, Eye,
  Crown, ShieldCheck, BarChart2, Wrench,
  Download, ExternalLink, ChevronDown, ChevronUp,
  PanelRightClose, PanelRightOpen, Search, Plus,
  FileText, ClipboardCheck, Menu, ArrowLeft,
  History, Archive, Trash2, ArchiveRestore, Users, Database,
  Factory, Building2, Heart, GraduationCap, Wifi,
  Flame, ShoppingBag, Filter, XCircle,
  Palette, Smartphone, PenTool, BrainCircuit, Server,
  Megaphone, Map, ShieldAlert, Gauge
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';

// Lazy load heavy components
import dynamic from 'next/dynamic';
const MarkdownRenderer = dynamic(
  () => import('@/components/agent/MarkdownRenderer').then(mod => ({ default: mod.MarkdownRenderer })),
  {
    loading: () => <div className="text-slate-500 text-sm animate-pulse">Loading...</div>,
    ssr: false,
  }
);

// Types
interface Agent {
  id: string;
  name: string;
  slug: string;
  type: string;
  team: string;
  description: string;
  avatar: string;
  color: string;
  capabilities: string;
  systemPrompt: string | null;
  industry: string[];
  status: string;
  tasksCompleted: number;
  tasks: Task[];
  _count: { tasks: number };
}

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  result: string | null;
  createdAt: string;
}

interface ChatMessage {
  id: string;
  role: string;
  content: string;
  agentId: string;
  createdAt: string;
  actionResult?: any;
  isStreaming?: boolean;
}

interface Conversation {
  id: string;
  agentId: string;
  userId: string;
  title: string;
  status: 'active' | 'archived' | 'deleted';
  lastMessageAt: string;
  messageCount: number;
  createdAt: string;
  updatedAt: string;
  // Admin enriched fields
  userName?: string;
  userEmail?: string;
  userRole?: string;
  agentName?: string;
  agentType?: string;
  agentAvatar?: string;
  totalMessages?: number;
  deletedMessages?: number;
}

interface UserInfo {
  id: string;
  email: string;
  name: string;
  role: string;
  avatar: string;
  department: string;
}

// Team configuration
const TEAM_CONFIG: Record<string, { label: string; icon: React.ReactNode; color: string; bg: string; order: number }> = {
  'development': { label: 'Development Team', icon: <Code2 className="w-3.5 h-3.5" />, color: '#10B981', bg: '#10B98112', order: 1 },
  'testing': { label: 'Testing Team', icon: <TestTube2 className="w-3.5 h-3.5" />, color: '#8B5CF6', bg: '#8B5CF612', order: 2 },
  'business': { label: 'Business Team', icon: <BarChart3 className="w-3.5 h-3.5" />, color: '#F59E0B', bg: '#F59E0B12', order: 3 },
  'data': { label: 'Data Team', icon: <TrendingUp className="w-3.5 h-3.5" />, color: '#3B82F6', bg: '#3B82F612', order: 4 },
  'operations': { label: 'Operations Team', icon: <Server className="w-3.5 h-3.5" />, color: '#06B6D4', bg: '#06B6D412', order: 5 },
  'design': { label: 'Design Team', icon: <Palette className="w-3.5 h-3.5" />, color: '#A855F7', bg: '#A855F712', order: 6 },
};

// Role configuration
const ROLE_AGENT_ACCESS: Record<string, string[]> = {
  admin: ['development', 'frontend', 'backend', 'mobile-dev', 'testing', 'security-testing', 'performance', 'business-analysis', 'sales', 'product-management', 'marketing', 'data-analysis', 'ml-engineering', 'data-engineering', 'implementation', 'system-admin', 'devops', 'support', 'ux-design', 'content-design'],
  manager: ['development', 'frontend', 'backend', 'mobile-dev', 'testing', 'security-testing', 'performance', 'business-analysis', 'sales', 'product-management', 'marketing', 'data-analysis', 'ml-engineering', 'data-engineering', 'implementation', 'system-admin', 'devops', 'support', 'ux-design', 'content-design'],
  developer: ['development', 'frontend', 'backend', 'mobile-dev', 'testing', 'data-analysis', 'devops'],
  analyst: ['business-analysis', 'data-analysis', 'ml-engineering', 'data-engineering', 'sales', 'product-management', 'marketing'],
  operator: ['implementation', 'system-admin', 'devops', 'support', 'security-testing'],
  viewer: ['development', 'frontend', 'backend', 'mobile-dev', 'testing', 'security-testing', 'performance', 'business-analysis', 'sales', 'product-management', 'marketing', 'data-analysis', 'ml-engineering', 'data-engineering', 'implementation', 'system-admin', 'devops', 'support', 'ux-design', 'content-design'],
};

const ROLE_PERMISSIONS: Record<string, {
  canChat: boolean;
  canAssignTasks: boolean;
  canManageUsers: boolean;
  canViewAnalytics: boolean;
  canConfigureAgents: boolean;
  canViewAllHistory: boolean;
}> = {
  admin: { canChat: true, canAssignTasks: true, canManageUsers: true, canViewAnalytics: true, canConfigureAgents: true, canViewAllHistory: true },
  manager: { canChat: true, canAssignTasks: true, canManageUsers: false, canViewAnalytics: true, canConfigureAgents: false, canViewAllHistory: false },
  developer: { canChat: true, canAssignTasks: true, canManageUsers: false, canViewAnalytics: false, canConfigureAgents: false, canViewAllHistory: false },
  analyst: { canChat: true, canAssignTasks: true, canManageUsers: false, canViewAnalytics: true, canConfigureAgents: false, canViewAllHistory: false },
  operator: { canChat: true, canAssignTasks: true, canManageUsers: false, canViewAnalytics: false, canConfigureAgents: false, canViewAllHistory: false },
  viewer: { canChat: false, canAssignTasks: false, canManageUsers: false, canViewAnalytics: false, canConfigureAgents: false, canViewAllHistory: false },
};

const ROLE_LABELS: Record<string, string> = {
  admin: 'Administrator', manager: 'Manager', developer: 'Developer',
  analyst: 'Analyst', operator: 'Operator', viewer: 'Viewer',
};

const ROLE_COLORS: Record<string, string> = {
  admin: '#EF4444', manager: '#F59E0B', developer: '#10B981',
  analyst: '#3B82F6', operator: '#06B6D4', viewer: '#64748B',
};

const ROLE_ICONS: Record<string, React.ReactNode> = {
  admin: <Crown className="w-3.5 h-3.5" />,
  manager: <ShieldCheck className="w-3.5 h-3.5" />,
  developer: <Code2 className="w-3.5 h-3.5" />,
  analyst: <BarChart2 className="w-3.5 h-3.5" />,
  operator: <Wrench className="w-3.5 h-3.5" />,
  viewer: <Eye className="w-3.5 h-3.5" />,
};

// Agent type config
const TYPE_CONFIG: Record<string, { icon: React.ReactNode; color: string; label: string; bg: string }> = {
  'development': { icon: <Code2 className="w-4 h-4" />, color: '#10B981', label: 'Dev', bg: '#10B98115' },
  'frontend': { icon: <Palette className="w-4 h-4" />, color: '#F472B6', label: 'Frontend', bg: '#F472B615' },
  'backend': { icon: <Server className="w-4 h-4" />, color: '#14B8A6', label: 'Backend', bg: '#14B8A615' },
  'mobile-dev': { icon: <Smartphone className="w-4 h-4" />, color: '#8B5CF6', label: 'Mobile', bg: '#8B5CF615' },
  'testing': { icon: <TestTube2 className="w-4 h-4" />, color: '#8B5CF6', label: 'QA', bg: '#8B5CF615' },
  'security-testing': { icon: <ShieldAlert className="w-4 h-4" />, color: '#EF4444', label: 'Security', bg: '#EF444415' },
  'performance': { icon: <Gauge className="w-4 h-4" />, color: '#F59E0B', label: 'Perf', bg: '#F59E0B15' },
  'business-analysis': { icon: <BarChart3 className="w-4 h-4" />, color: '#F59E0B', label: 'BA', bg: '#F59E0B15' },
  'sales': { icon: <Target className="w-4 h-4" />, color: '#EF4444', label: 'Sales', bg: '#EF444415' },
  'product-management': { icon: <Map className="w-4 h-4" />, color: '#6366F1', label: 'Product', bg: '#6366F115' },
  'marketing': { icon: <Megaphone className="w-4 h-4" />, color: '#EC4899', label: 'Marketing', bg: '#EC489915' },
  'data-analysis': { icon: <TrendingUp className="w-4 h-4" />, color: '#3B82F6', label: 'Data', bg: '#3B82F615' },
  'ml-engineering': { icon: <BrainCircuit className="w-4 h-4" />, color: '#0EA5E9', label: 'ML', bg: '#0EA5E915' },
  'data-engineering': { icon: <Database className="w-4 h-4" />, color: '#22C55E', label: 'DataEng', bg: '#22C55E15' },
  'implementation': { icon: <Rocket className="w-4 h-4" />, color: '#06B6D4', label: 'Impl', bg: '#06B6D415' },
  'system-admin': { icon: <Shield className="w-4 h-4" />, color: '#64748B', label: 'SysOps', bg: '#64748B15' },
  'devops': { icon: <RefreshCw className="w-4 h-4" />, color: '#0EA5E9', label: 'DevOps', bg: '#0EA5E915' },
  'support': { icon: <Headphones className="w-4 h-4" />, color: '#EC4899', label: 'Support', bg: '#EC489915' },
  'ux-design': { icon: <PenTool className="w-4 h-4" />, color: '#A855F7', label: 'UX', bg: '#A855F715' },
  'content-design': { icon: <FileText className="w-4 h-4" />, color: '#F97316', label: 'Content', bg: '#F9731615' },
};

const STATUS_CONFIG: Record<string, { dotColor: string; label: string }> = {
  idle: { dotColor: '#10B981', label: 'Ready' },
  busy: { dotColor: '#F59E0B', label: 'Working' },
  error: { dotColor: '#EF4444', label: 'Error' },
};

// Industry config
const INDUSTRY_CONFIG: Record<string, { icon: React.ReactNode; color: string; bg: string; label: string }> = {
  'Technology & Software': { icon: <Code2 className="w-3 h-3" />, color: '#0d9488', bg: '#0d948815', label: 'Technology' },
  'Healthcare & Life Sciences': { icon: <Heart className="w-3 h-3" />, color: '#EC4899', bg: '#EC489915', label: 'Healthcare' },
  'Finance & Banking': { icon: <BarChart2 className="w-3 h-3" />, color: '#F59E0B', bg: '#F59E0B15', label: 'Finance' },
  'Retail & E-Commerce': { icon: <ShoppingBag className="w-3 h-3" />, color: '#EF4444', bg: '#EF444415', label: 'Retail' },
  'Manufacturing & Supply Chain': { icon: <Factory className="w-3 h-3" />, color: '#06B6D4', bg: '#06B6D415', label: 'Manufacturing' },
  'Education & Training': { icon: <GraduationCap className="w-3 h-3" />, color: '#8B5CF6', bg: '#8B5CF615', label: 'Education' },
  'Telecommunications': { icon: <Wifi className="w-3 h-3" />, color: '#3B82F6', bg: '#3B82F615', label: 'Telecom' },
  'Energy & Utilities': { icon: <Flame className="w-3 h-3" />, color: '#F97316', bg: '#F9731615', label: 'Energy' },
  'Media & Entertainment': { icon: <Sparkles className="w-3 h-3" />, color: '#A21CAF', bg: '#A21CAF15', label: 'Media' },
  'Legal & Compliance': { icon: <Shield className="w-3 h-3" />, color: '#64748B', bg: '#64748B15', label: 'Legal' },
};

// Memoized Agent List Item
const AgentListItem = memo(function AgentListItem({
  agent, isSelected, onClick,
}: { agent: Agent; isSelected: boolean; onClick: () => void; }) {
  const typeConf = TYPE_CONFIG[agent.type];
  return (
    <button onClick={onClick}
      className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left transition-colors duration-150 ${
        isSelected ? 'bg-teal-500/10 border border-teal-500/20' : 'hover:bg-white/[0.03] border border-transparent'
      }`}>
      <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm shrink-0" style={{ background: typeConf?.bg || '#33415520' }}>
        {agent.avatar}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <p className="text-xs font-medium text-white truncate">{agent.name}</p>
          <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: STATUS_CONFIG[agent.status]?.dotColor || '#10B981' }} />
        </div>
        <div className="flex items-center gap-1 mt-0.5">
          <p className="text-[10px] text-slate-600 truncate">{typeConf?.label || agent.type}</p>
          {agent.industry && agent.industry.slice(0, 2).map((ind) => {
            const conf = INDUSTRY_CONFIG[ind];
            return (
              <span key={ind} className="inline-flex items-center gap-0.5 text-[7px] px-1 py-0 rounded-full"
                style={{ background: conf?.bg, color: conf?.color }}>
                {conf?.icon}
                <span>{conf?.label || ind.split(' & ')[0]}</span>
              </span>
            );
          })}
          {agent.industry && agent.industry.length > 2 && (
            <span className="text-[7px] text-slate-600">+{agent.industry.length - 2}</span>
          )}
        </div>
      </div>
      {agent._count?.tasks > 0 && (
        <Badge className="bg-white/[0.06] text-slate-400 border-0 text-[9px] px-1.5 py-0 h-4">{agent._count.tasks}</Badge>
      )}
    </button>
  );
});

// Memoized Chat Message
const ChatMessageItem = memo(function ChatMessageItem({
  msg, agentAvatar, agentType,
}: { msg: ChatMessage; agentAvatar: string; agentType: string; }) {
  const typeConf = TYPE_CONFIG[agentType];
  return (
    <div className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
      {msg.role !== 'user' && (
        <div className="w-7 h-7 rounded-lg flex items-center justify-center text-sm mr-2 mt-1 shrink-0" style={{ background: typeConf?.bg }}>
          {agentAvatar}
        </div>
      )}
      <div className={`max-w-[75%] rounded-2xl ${
        msg.role === 'user' ? 'bg-teal-600 text-white px-4 py-2.5 rounded-br-md'
          : 'bg-[#1a1a2e] text-slate-200 px-4 py-3 rounded-bl-md border border-white/[0.06]'
      }`}>
        {msg.role === 'user' ? (
          <p className="text-sm leading-relaxed">{msg.content}</p>
        ) : (
          <div className="agent-message"><MarkdownRenderer content={msg.content} /></div>
        )}
      </div>
    </div>
  );
});

export default function MARQAIAgentTRIBE() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [taskPriority, setTaskPriority] = useState('medium');
  const [loading, setLoading] = useState(true);
  const [chatLoading, setChatLoading] = useState(false);
  const [taskLoading, setTaskLoading] = useState(false);
  const [user, setUser] = useState<UserInfo | null>(null);
  const [userLoading, setUserLoading] = useState(true);
  const [selectedIndustry, setSelectedIndustry] = useState('');
  const [industryFilterOpen, setIndustryFilterOpen] = useState(false);
  const [expandedTeams, setExpandedTeams] = useState<Record<string, boolean>>({ development: true, testing: true, business: true, data: true, operations: true, design: true });
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewTitle, setPreviewTitle] = useState('Preview');
  const [activeView, setActiveView] = useState<'chat' | 'tasks' | 'history' | 'admin-history'>('chat');
  const [searchQuery, setSearchQuery] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Conversation / History state
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [historyFilter, setHistoryFilter] = useState<'active' | 'archived'>('active');

  // Admin history state
  const [adminConversations, setAdminConversations] = useState<Conversation[]>([]);
  const [adminStats, setAdminStats] = useState({ totalActive: 0, totalArchived: 0, totalDeleted: 0 });
  const [expandedAdminConv, setExpandedAdminConv] = useState<string | null>(null);
  const [adminConvMessages, setAdminConvMessages] = useState<any[]>([]);

  const fetchSession = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/session');
      if (res.ok) {
        const data = await res.json();
        if (data.authenticated && data.user) { setUser(data.user); }
        else { window.location.href = '/auth/login'; }
      } else { window.location.href = '/auth/login'; }
    } catch { window.location.href = '/auth/login'; }
    finally { setUserLoading(false); }
  }, []);

  const fetchAgents = useCallback(async () => {
    try {
      const res = await fetch('/api/agents');
      if (res.ok) { const data = await res.json(); setAgents(data.agents); }
    } catch (error) { console.error('Failed to fetch agents:', error); }
    finally { setLoading(false); }
  }, []);

  const fetchTasks = useCallback(async () => {
    try {
      const res = await fetch('/api/agents/tasks');
      if (res.ok) { const data = await res.json(); setTasks(data.tasks); }
    } catch (error) { console.error('Failed to fetch tasks:', error); }
  }, []);

  const fetchChat = useCallback(async (agentId: string) => {
    try {
      const res = await fetch(`/api/agents/chat?agentId=${agentId}`);
      if (res.ok) { const data = await res.json(); setChatMessages(data.messages || []); }
    } catch (error) { console.error('Failed to fetch chat:', error); }
  }, []);

  const fetchConversations = useCallback(async (agentId: string, status = 'active') => {
    try {
      const res = await fetch(`/api/agents/conversations?agentId=${agentId}&status=${status}`);
      if (res.ok) { const data = await res.json(); setConversations(data.conversations || []); }
    } catch (error) { console.error('Failed to fetch conversations:', error); }
  }, []);

  const fetchAdminHistory = useCallback(async () => {
    try {
      const res = await fetch('/api/agents/conversations?admin=true');
      if (res.ok) {
        const data = await res.json();
        setAdminConversations(data.conversations || []);
        setAdminStats({ totalActive: data.totalActive, totalArchived: data.totalArchived, totalDeleted: data.totalDeleted });
      }
    } catch (error) { console.error('Failed to fetch admin history:', error); }
  }, []);

  useEffect(() => { fetchSession(); }, [fetchSession]);

  useEffect(() => {
    if (user) {
      fetchAgents();
      fetchTasks();
      const interval = setInterval(() => { fetchAgents(); fetchTasks(); }, 30000);
      return () => clearInterval(interval);
    }
  }, [user, fetchAgents, fetchTasks]);

  useEffect(() => {
    if (selectedAgent) fetchChat(selectedAgent.id);
  }, [selectedAgent, fetchChat]);

  useEffect(() => {
    if (selectedAgent && activeView === 'history') {
      fetchConversations(selectedAgent.id, historyFilter);
    }
  }, [selectedAgent, activeView, historyFilter, fetchConversations]);

  useEffect(() => {
    if (user?.role === 'admin' && activeView === 'admin-history') {
      fetchAdminHistory();
    }
  }, [user, activeView, fetchAdminHistory]);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [chatMessages]);

  // Create a new conversation when sending first message
  const ensureConversation = useCallback(async (agentId: string, firstMessage: string): Promise<string | null> => {
    if (activeConversationId) return activeConversationId;
    try {
      const res = await fetch('/api/agents/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentId,
          userId: user?.id || 'unknown',
          title: firstMessage.substring(0, 60) + (firstMessage.length > 60 ? '...' : ''),
        }),
      });
      if (res.ok) {
        const data = await res.json();
        const convId = data.conversation?.id;
        setActiveConversationId(convId);
        return convId;
      }
    } catch (e) { console.error('Failed to create conversation:', e); }
    return null;
  }, [activeConversationId, user]);

  // STREAMING chat handler
  const handleSendChat = useCallback(async () => {
    if (!chatInput.trim() || !selectedAgent || !user) return;
    const perms = ROLE_PERMISSIONS[user.role];
    if (!perms.canChat) {
      toast.error('Access Denied', { description: 'Your role does not permit chat access' });
      return;
    }
    const msg = chatInput.trim();
    setChatInput('');

    // Ensure we have a conversation
    const convId = await ensureConversation(selectedAgent.id, msg);

    const tempUserMsg: ChatMessage = {
      id: 'temp-' + Date.now(), role: 'user', content: msg,
      agentId: selectedAgent.id, createdAt: new Date().toISOString(),
    };
    const streamMsgId = 'stream-' + Date.now();
    const streamMsg: ChatMessage = {
      id: streamMsgId, role: 'agent', content: '',
      agentId: selectedAgent.id, createdAt: new Date().toISOString(),
      isStreaming: true,
    };
    setChatMessages(prev => [...prev, tempUserMsg, streamMsg]);
    setChatLoading(true);

    if (abortControllerRef.current) abortControllerRef.current.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const res = await fetch('/api/agents/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentId: selectedAgent.id, content: msg, stream: true, conversationId: convId, userId: user.id }),
        signal: controller.signal,
      });
      if (!res.ok) throw new Error('Chat request failed');

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) throw new Error('No response stream');

      let fullContent = '';
      let actionResult: any = null;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const text = decoder.decode(value, { stream: true });
        const lines = text.split('\n');
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.substring(6));
              if (data.type === 'token') {
                fullContent += data.content;
                setChatMessages(prev => prev.map(m => m.id === streamMsgId ? { ...m, content: fullContent } : m));
              } else if (data.type === 'done') {
                actionResult = data.actionResult;
              }
            } catch { /* skip */ }
          }
        }
      }
      setChatMessages(prev => prev.map(m => m.id === streamMsgId ? { ...m, isStreaming: false, content: fullContent, actionResult } : m));
      if (actionResult?.previewUrl) {
        setPreviewUrl(actionResult.previewUrl);
        setPreviewTitle(actionResult.description || 'Preview');
        setPreviewOpen(true);
      }
    } catch (error: any) {
      if (error.name === 'AbortError') return;
      toast.error('Failed to send message');
      setChatMessages(prev => prev.filter(m => m.id !== streamMsgId));
    } finally { setChatLoading(false); }
  }, [chatInput, selectedAgent, user, ensureConversation]);

  const handleAssignTask = useCallback(async () => {
    if (!taskTitle.trim() || !selectedAgent || !user) return;
    const perms = ROLE_PERMISSIONS[user.role];
    if (!perms.canAssignTasks) { toast.error('Access Denied'); return; }
    setTaskLoading(true);
    try {
      const res = await fetch('/api/agents/tasks', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentId: selectedAgent.id, title: taskTitle, description: taskDesc, priority: taskPriority }),
      });
      if (res.ok) {
        toast.success(`Task assigned to ${selectedAgent.name}`);
        setTaskTitle(''); setTaskDesc(''); setTaskPriority('medium');
        fetchAgents(); fetchTasks();
      }
    } catch { toast.error('Failed to assign task'); }
    finally { setTaskLoading(false); }
  }, [taskTitle, taskDesc, taskPriority, selectedAgent, user, fetchAgents, fetchTasks]);

  const handleSelectAgent = useCallback((agent: Agent) => {
    if (!user) return;
    const allowedTypes = ROLE_AGENT_ACCESS[user.role] || [];
    if (!allowedTypes.includes(agent.type)) {
      toast.error('Access Restricted', { description: `Your ${ROLE_LABELS[user.role]} role does not have access to this agent` });
      return;
    }
    setSelectedAgent(agent);
    setActiveView('chat');
    setActiveConversationId(null);
  }, [user]);

  const handleLogout = useCallback(async () => {
    try { await fetch('/api/auth/callback/credentials', { method: 'POST' }); } catch {}
    window.location.href = '/api/auth/signout?callbackUrl=/auth/login';
  }, []);

  const handleArchiveConversation = useCallback(async (convId: string, action: 'archive' | 'unarchive' | 'delete') => {
    try {
      const res = await fetch('/api/agents/conversations', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId: convId, action }),
      });
      if (res.ok) {
        const data = await res.json();
        toast.success(data.message);
        if (selectedAgent) fetchConversations(selectedAgent.id, historyFilter);
        if (action === 'delete' && activeConversationId === convId) {
          setActiveConversationId(null);
          setChatMessages([]);
        }
      }
    } catch { toast.error('Failed to update conversation'); }
  }, [selectedAgent, historyFilter, activeConversationId, fetchConversations]);

  const handleNewChat = useCallback(() => {
    setActiveConversationId(null);
    setChatMessages([]);
    setActiveView('chat');
  }, []);

  const handleLoadConversation = useCallback(async (convId: string) => {
    try {
      const res = await fetch(`/api/agents/conversations?conversationId=${convId}`);
      if (res.ok) {
        const data = await res.json();
        setActiveConversationId(convId);
        setChatMessages(data.messages || []);
        setActiveView('chat');
      }
    } catch { toast.error('Failed to load conversation'); }
  }, []);

  const handleAdminViewConversation = useCallback(async (convId: string) => {
    try {
      const res = await fetch(`/api/agents/conversations?conversationId=${convId}`);
      if (res.ok) {
        const data = await res.json();
        setAdminConvMessages(data.messages || []);
        setExpandedAdminConv(prev => prev === convId ? null : convId);
      }
    } catch { toast.error('Failed to load messages'); }
  }, []);

  // Memoized values
  const accessibleAgents = useMemo(() => {
    if (!user) return [];
    const allowedTypes = ROLE_AGENT_ACCESS[user.role] || [];
    return agents.filter(a => allowedTypes.includes(a.type));
  }, [user, agents]);

  const filteredAgents = useMemo(() => {
    let result = accessibleAgents;
    // Filter by industry
    if (selectedIndustry) {
      result = result.filter(a => a.industry && a.industry.includes(selectedIndustry));
    }
    // Filter by search
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(a => a.name.toLowerCase().includes(q) || a.type.toLowerCase().includes(q));
    }
    return result;
  }, [accessibleAgents, searchQuery, selectedIndustry]);

  // Get unique industries from accessible agents
  const availableIndustries = useMemo(() => {
    const industries = new Set<string>();
    accessibleAgents.forEach(a => {
      if (a.industry) {
        a.industry.forEach(ind => industries.add(ind));
      }
    });
    return Array.from(industries).sort();
  }, [accessibleAgents]);

  // Group filtered agents by team
  const agentsByTeam = useMemo(() => {
    const teams: Record<string, Agent[]> = {};
    filteredAgents.forEach(agent => {
      const team = agent.team || 'operations';
      if (!teams[team]) teams[team] = [];
      teams[team].push(agent);
    });
    // Sort teams by order
    const sorted = Object.entries(teams).sort(([a], [b]) => {
      return (TEAM_CONFIG[a]?.order ?? 99) - (TEAM_CONFIG[b]?.order ?? 99);
    });
    return sorted;
  }, [filteredAgents]);

  const permissions = useMemo(() => user ? ROLE_PERMISSIONS[user.role] : null, [user]);
  const agentTasks = useMemo(() => tasks.filter(t => selectedAgent && (t as any).agentId === selectedAgent.id), [tasks, selectedAgent]);

  // Format relative time
  const formatTime = useCallback((dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHrs = Math.floor(diffMins / 60);
    if (diffHrs < 24) return `${diffHrs}h ago`;
    const diffDays = Math.floor(diffHrs / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  }, []);

  if (userLoading) {
    return (
      <div className="h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="text-center space-y-4 animate-fade-in">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center animate-pulse">
            <Bot className="w-7 h-7 text-white" />
          </div>
          <p className="text-slate-500 text-sm">Loading MARQ AI...</p>
        </div>
      </div>
    );
  }
  if (!user) return null;

  return (
    <div className="h-screen bg-[#0a0a0f] flex overflow-hidden">
      {/* === LEFT SIDEBAR === */}
      <aside className="h-full border-r border-white/[0.06] bg-[#0c0c14] flex flex-col shrink-0 overflow-hidden transition-[width] duration-200 ease-in-out"
        style={{ width: sidebarOpen ? 260 : 64 }}>
        {/* Sidebar Header */}
        <div className="h-14 flex items-center justify-between px-3 border-b border-white/[0.06] shrink-0">
          {sidebarOpen ? (
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-white leading-tight truncate">MARQ <span className="text-teal-400">AI</span></p>
                <p className="text-[9px] text-slate-600 leading-tight">Agent TRIBE</p>
              </div>
            </div>
          ) : (
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center mx-auto">
              <Bot className="w-4 h-4 text-white" />
            </div>
          )}
          <Button variant="ghost" size="sm" onClick={() => setSidebarOpen(!sidebarOpen)} className="text-slate-500 hover:text-white hover:bg-white/5 h-7 w-7 p-0 shrink-0">
            {sidebarOpen ? <ChevronRight className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </Button>
        </div>

        {/* Search */}
        {sidebarOpen && (
          <div className="px-3 py-2 border-b border-white/[0.06]">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-600" />
              <Input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search agents..." className="bg-white/[0.04] border-white/[0.06] text-white placeholder:text-slate-600 text-xs h-8 pl-8 rounded-lg" />
            </div>
          </div>
        )}

        {/* Industry Filter */}
        {sidebarOpen && (
          <div className="px-3 py-2 border-b border-white/[0.06]">
            <button
              onClick={() => setIndustryFilterOpen(!industryFilterOpen)}
              className="w-full flex items-center justify-between text-[10px] font-semibold text-slate-600 uppercase tracking-wider"
            >
              <span className="flex items-center gap-1.5">
                <Filter className="w-3 h-3" />
                Industry Filter
              </span>
              {selectedIndustry && (
                <span
                  onClick={(e) => { e.stopPropagation(); setSelectedIndustry(''); }}
                  className="text-[9px] normal-case text-red-400 hover:text-red-300 flex items-center gap-0.5"
                >
                  <XCircle className="w-3 h-3" /> Clear
                </span>
              )}
              {industryFilterOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
            {industryFilterOpen && (
              <div className="mt-2 flex flex-wrap gap-1">
                {availableIndustries.map((ind) => {
                  const conf = INDUSTRY_CONFIG[ind];
                  const count = accessibleAgents.filter(a => a.industry?.includes(ind)).length;
                  const isActive = selectedIndustry === ind;
                  return (
                    <button
                      key={ind}
                      onClick={() => setSelectedIndustry(isActive ? '' : ind)}
                      className={`inline-flex items-center gap-1 text-[9px] px-1.5 py-1 rounded-md transition-colors ${
                        isActive
                          ? 'text-white'
                          : 'text-slate-500 hover:text-slate-300'
                      }`}
                      style={{
                        background: isActive ? (conf?.color || '#0d9488') + '25' : 'rgba(255,255,255,0.03)',
                        border: `1px solid ${isActive ? (conf?.color || '#0d9488') + '40' : 'rgba(255,255,255,0.06)'}`,
                      }}
                    >
                      <span style={{ color: conf?.color || '#64748B' }}>{conf?.icon}</span>
                      <span>{conf?.label || ind.split(' & ')[0]}</span>
                      <span className="text-[8px] opacity-60">({count})</span>
                    </button>
                  );
                })}
              </div>
            )}
            {selectedIndustry && !industryFilterOpen && (
              <div className="mt-1.5 flex items-center gap-1">
                <span
                  className="inline-flex items-center gap-0.5 text-[9px] px-1.5 py-0.5 rounded-md"
                  style={{ background: (INDUSTRY_CONFIG[selectedIndustry]?.color || '#0d9488') + '15', color: INDUSTRY_CONFIG[selectedIndustry]?.color || '#0d9488' }}
                >
                  {INDUSTRY_CONFIG[selectedIndustry]?.icon}
                  <span className="ml-0.5">{INDUSTRY_CONFIG[selectedIndustry]?.label}</span>
                  <span className="ml-0.5 opacity-60">({filteredAgents.length})</span>
                </span>
              </div>
            )}
          </div>
        )}

        {/* Agent List - Grouped by Teams */}
        <div className="flex-1 overflow-y-auto py-2 px-1.5 space-y-0.5">
          {sidebarOpen ? (
            <>
              <div className="flex items-center justify-between px-2 mb-1.5">
                <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-wider">
                  Teams {selectedIndustry ? `(${filteredAgents.length})` : `(${accessibleAgents.length})`}
                </p>
                <div className="flex gap-1">
                  <button
                    onClick={() => setExpandedTeams(Object.fromEntries(Object.keys(TEAM_CONFIG).map(k => [k, true])))}
                    className="text-[8px] text-slate-600 hover:text-teal-400 px-1"
                  >All</button>
                  <button
                    onClick={() => setExpandedTeams(Object.fromEntries(Object.keys(TEAM_CONFIG).map(k => [k, false])))}
                    className="text-[8px] text-slate-600 hover:text-teal-400 px-1"
                  >None</button>
                </div>
              </div>
              {filteredAgents.length === 0 && selectedIndustry ? (
                <div className="px-2 py-4 text-center">
                  <p className="text-[10px] text-slate-600">No agents for this industry</p>
                  <button
                    onClick={() => setSelectedIndustry('')}
                    className="text-[10px] text-teal-400 hover:text-teal-300 mt-1"
                  >
                    Clear filter
                  </button>
                </div>
              ) : (
                agentsByTeam.map(([teamId, teamAgents]) => {
                  const teamConf = TEAM_CONFIG[teamId];
                  const isExpanded = expandedTeams[teamId] !== false;
                  return (
                    <div key={teamId} className="mb-1">
                      <button
                        onClick={() => setExpandedTeams(prev => ({ ...prev, [teamId]: !isExpanded }))}
                        className="w-full flex items-center gap-1.5 px-2 py-1.5 rounded-md hover:bg-white/[0.03] transition-colors"
                      >
                        <span className="shrink-0" style={{ color: teamConf?.color || '#64748B' }}>{teamConf?.icon}</span>
                        <span className="text-[10px] font-semibold uppercase tracking-wider flex-1 text-left" style={{ color: teamConf?.color || '#64748B' }}>
                          {teamConf?.label || teamId}
                        </span>
                        <span className="text-[9px] text-slate-600 mr-1">{teamAgents.length}</span>
                        {isExpanded ? <ChevronUp className="w-3 h-3 text-slate-600" /> : <ChevronDown className="w-3 h-3 text-slate-600" />}
                      </button>
                      {isExpanded && (
                        <div className="space-y-0.5 ml-1">
                          {teamAgents.map((agent) => (
                            <AgentListItem key={agent.id} agent={agent} isSelected={selectedAgent?.id === agent.id}
                              onClick={() => handleSelectAgent(agent)} />
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </>
          ) : (
            <>
              {/* Collapsed sidebar: industry filter quick button */}
              <button
                onClick={() => setSidebarOpen(true)}
                className={`w-full flex items-center justify-center p-2 rounded-lg transition-colors duration-150 mb-1 ${
                  selectedIndustry ? 'bg-teal-500/10 border border-teal-500/20' : 'hover:bg-white/[0.03]'
                }`}
                title={selectedIndustry || 'Filter by Industry'}
              >
                <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ background: selectedIndustry ? (INDUSTRY_CONFIG[selectedIndustry]?.bg || 'rgba(255,255,255,0.04)') : 'rgba(255,255,255,0.04)' }}>
                  <Filter className="w-4 h-4" style={{ color: selectedIndustry ? (INDUSTRY_CONFIG[selectedIndustry]?.color || '#64748B') : '#64748B' }} />
                </div>
              </button>
              <div className="border-b border-white/[0.06] mx-2 mb-1" />
              {filteredAgents.map((agent) => (
                <button key={agent.id} onClick={() => handleSelectAgent(agent)}
                  className={`w-full flex items-center justify-center p-2 rounded-lg transition-colors duration-150 ${selectedAgent?.id === agent.id ? 'bg-teal-500/10' : 'hover:bg-white/[0.03]'}`}
                  title={agent.name}>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm" style={{ background: TYPE_CONFIG[agent.type]?.bg }}>
                    {agent.avatar}
                  </div>
                </button>
              ))}
            </>
          )}
        </div>

        {/* Sidebar Footer */}
        <div className="border-t border-white/[0.06] p-3 shrink-0">
          {sidebarOpen ? (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm shrink-0" style={{ background: `${ROLE_COLORS[user.role]}20` }}>
                {user.avatar}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <p className="text-xs font-medium text-white truncate">{user.name}</p>
                  <span style={{ color: ROLE_COLORS[user.role] }}>{ROLE_ICONS[user.role]}</span>
                </div>
                <p className="text-[10px] text-slate-600 truncate">{ROLE_LABELS[user.role]}</p>
              </div>
              <Button variant="ghost" size="sm" onClick={handleLogout} className="text-slate-500 hover:text-red-400 hover:bg-white/5 h-7 w-7 p-0 shrink-0">
                <LogOut className="w-3.5 h-3.5" />
              </Button>
            </div>
          ) : (
            <button onClick={handleLogout} className="w-8 h-8 mx-auto rounded-lg flex items-center justify-center text-slate-500 hover:text-red-400 hover:bg-white/5 transition-colors">
              <LogOut className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </aside>

      {/* === MAIN CONTENT === */}
      <main className="flex-1 flex min-w-0 h-full">
        {selectedAgent ? (
          <div className="flex-1 flex flex-col min-w-0 h-full">
            {/* Agent Header */}
            <div className="h-14 border-b border-white/[0.06] flex items-center justify-between px-4 shrink-0 bg-[#0c0c14]">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg shrink-0" style={{ background: TYPE_CONFIG[selectedAgent.type]?.bg }}>
                  {selectedAgent.avatar}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm font-semibold text-white">{selectedAgent.name}</h2>
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: STATUS_CONFIG[selectedAgent.status]?.dotColor }} />
                    <Badge variant="outline" className="text-[9px] h-4 px-1.5" style={{ borderColor: TYPE_CONFIG[selectedAgent.type]?.color + '30', color: TYPE_CONFIG[selectedAgent.type]?.color }}>
                      {TYPE_CONFIG[selectedAgent.type]?.label}
                    </Badge>
                    {selectedAgent.team && TEAM_CONFIG[selectedAgent.team] && (
                      <Badge variant="outline" className="text-[9px] h-4 px-1.5" style={{ borderColor: TEAM_CONFIG[selectedAgent.team]?.color + '30', color: TEAM_CONFIG[selectedAgent.team]?.color, background: TEAM_CONFIG[selectedAgent.team]?.bg }}>
                        {TEAM_CONFIG[selectedAgent.team]?.icon}
                        <span className="ml-1">{TEAM_CONFIG[selectedAgent.team]?.label?.replace(' Team', '')}</span>
                      </Badge>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-500 truncate max-w-xs">{selectedAgent.description}</p>
                  {selectedAgent.industry && selectedAgent.industry.length > 0 && (
                    <div className="flex items-center gap-1 mt-1 flex-wrap">
                      {selectedAgent.industry.map((ind) => {
                        const conf = INDUSTRY_CONFIG[ind];
                        return (
                          <span
                            key={ind}
                            className="inline-flex items-center gap-0.5 text-[8px] px-1.5 py-0.5 rounded-full"
                            style={{ background: conf?.bg, color: conf?.color }}
                          >
                            {conf?.icon}
                            <span className="ml-0.5">{conf?.label || ind.split(' & ')[0]}</span>
                          </span>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Button variant="ghost" size="sm" onClick={handleNewChat}
                  className={`text-xs h-7 px-2.5 ${activeView === 'chat' && !activeConversationId ? 'bg-teal-500/10 text-teal-400' : 'text-slate-500 hover:text-white'}`}>
                  <Plus className="w-3.5 h-3.5 mr-1" /> New
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setActiveView('chat')}
                  className={`text-xs h-7 px-2.5 ${activeView === 'chat' ? 'bg-teal-500/10 text-teal-400' : 'text-slate-500 hover:text-white'}`}>
                  <MessageSquare className="w-3.5 h-3.5 mr-1" /> Chat
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setActiveView('history')}
                  className={`text-xs h-7 px-2.5 ${activeView === 'history' ? 'bg-teal-500/10 text-teal-400' : 'text-slate-500 hover:text-white'}`}>
                  <History className="w-3.5 h-3.5 mr-1" /> History
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setActiveView('tasks')}
                  className={`text-xs h-7 px-2.5 ${activeView === 'tasks' ? 'bg-teal-500/10 text-teal-400' : 'text-slate-500 hover:text-white'}`}>
                  <ClipboardCheck className="w-3.5 h-3.5 mr-1" /> Tasks
                </Button>
                {permissions?.canViewAllHistory && (
                  <Button variant="ghost" size="sm" onClick={() => setActiveView('admin-history')}
                    className={`text-xs h-7 px-2.5 ${activeView === 'admin-history' ? 'bg-red-500/10 text-red-400' : 'text-slate-500 hover:text-white'}`}>
                    <Crown className="w-3.5 h-3.5 mr-1" /> Admin
                  </Button>
                )}
                <Separator orientation="vertical" className="h-5 mx-1 bg-white/[0.06]" />
                <Button variant="ghost" size="sm" onClick={() => setPreviewOpen(!previewOpen)}
                  className={`text-xs h-7 px-2.5 ${previewOpen ? 'bg-teal-500/10 text-teal-400' : 'text-slate-500 hover:text-white'}`}>
                  <Eye className="w-3.5 h-3.5 mr-1" /> Preview
                </Button>
              </div>
            </div>

            {/* === CHAT VIEW === */}
            {activeView === 'chat' && (
              <div className="flex-1 flex flex-col min-h-0">
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {chatMessages.length === 0 && !chatLoading && (
                    <div className="text-center py-16">
                      <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-teal-500/10 to-cyan-500/10 flex items-center justify-center mb-4">
                        <Sparkles className="w-7 h-7 text-teal-400/50" />
                      </div>
                      <h3 className="text-lg font-semibold text-white mb-1">Start a conversation</h3>
                      <p className="text-slate-500 text-sm max-w-xs mx-auto mb-6">Ask {selectedAgent.name} anything.</p>
                      <div className="flex flex-wrap justify-center gap-2 max-w-md mx-auto">
                        {['Write a REST API', 'Debug my React component', 'Review my database schema', 'Create a CI/CD pipeline'].map((s) => (
                          <button key={s} onClick={() => setChatInput(s)}
                            className="text-xs px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-slate-400 hover:text-white hover:bg-white/[0.08] transition-colors duration-150">
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  {chatMessages.map((msg) => (
                    <ChatMessageItem key={msg.id} msg={msg} agentAvatar={selectedAgent.avatar} agentType={selectedAgent.type} />
                  ))}
                  {chatLoading && chatMessages.every(m => m.role !== 'agent' || !m.isStreaming) && (
                    <div className="flex justify-start">
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center text-sm mr-2 mt-1 shrink-0" style={{ background: TYPE_CONFIG[selectedAgent.type]?.bg }}>
                        {selectedAgent.avatar}
                      </div>
                      <div className="bg-[#1a1a2e] rounded-2xl rounded-bl-md px-4 py-3 border border-white/[0.06]">
                        <div className="flex items-center gap-2">
                          <div className="flex gap-1">
                            <div className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                            <div className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                            <div className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                          </div>
                          <span className="text-xs text-slate-500">{selectedAgent.name} is thinking...</span>
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>
                {!permissions?.canChat ? (
                  <div className="border-t border-white/[0.06] p-4 text-center">
                    <Lock className="w-4 h-4 text-slate-600 mx-auto mb-1" />
                    <p className="text-xs text-slate-600">Chat access restricted for your role</p>
                  </div>
                ) : (
                  <div className="border-t border-white/[0.06] p-3 shrink-0">
                    <div className="flex gap-2 items-end max-w-3xl mx-auto">
                      <div className="flex-1 relative">
                        <Textarea value={chatInput} onChange={(e) => setChatInput(e.target.value)}
                          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendChat(); }}}
                          placeholder={`Message ${selectedAgent.name}...`}
                          className="bg-white/[0.04] border-white/[0.08] text-white placeholder:text-slate-600 resize-none rounded-xl min-h-[44px] max-h-32 pr-12 text-sm" rows={1} />
                        <Button onClick={handleSendChat} disabled={!chatInput.trim() || chatLoading}
                          className="absolute right-1.5 bottom-1.5 bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 text-white h-8 w-8 p-0 rounded-lg shrink-0">
                          <Send className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* === HISTORY VIEW === */}
            {activeView === 'history' && (
              <div className="flex-1 overflow-y-auto p-4">
                <div className="max-w-3xl mx-auto">
                  {/* History Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                        <History className="w-4 h-4 text-teal-400" /> Chat History
                      </h3>
                      <p className="text-[10px] text-slate-500 mt-0.5">Your conversations with {selectedAgent.name}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button size="sm" variant="ghost"
                        onClick={() => setHistoryFilter('active')}
                        className={`text-[10px] h-7 px-2.5 ${historyFilter === 'active' ? 'bg-teal-500/10 text-teal-400' : 'text-slate-500'}`}>
                        Active
                      </Button>
                      <Button size="sm" variant="ghost"
                        onClick={() => setHistoryFilter('archived')}
                        className={`text-[10px] h-7 px-2.5 ${historyFilter === 'archived' ? 'bg-amber-500/10 text-amber-400' : 'text-slate-500'}`}>
                        <Archive className="w-3 h-3 mr-1" /> Archived
                      </Button>
                    </div>
                  </div>

                  {conversations.length === 0 ? (
                    <div className="text-center py-16">
                      <History className="w-10 h-10 text-slate-700 mx-auto mb-3" />
                      <p className="text-slate-500 text-sm">{historyFilter === 'archived' ? 'No archived conversations' : 'No conversations yet'}</p>
                      <p className="text-slate-600 text-xs mt-1">Start chatting to see your history here</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {conversations.map((conv) => (
                        <div key={conv.id} className="bg-[#12121c] rounded-xl border border-white/[0.06] overflow-hidden">
                          <div className="p-3 flex items-center justify-between">
                            <button onClick={() => handleLoadConversation(conv.id)} className="flex-1 text-left min-w-0">
                              <p className="text-xs font-medium text-white truncate">{conv.title}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-[10px] text-slate-500">{formatTime(conv.lastMessageAt)}</span>
                                <span className="text-[10px] text-slate-600">·</span>
                                <span className="text-[10px] text-slate-500">{conv.messageCount} messages</span>
                                {conv.status === 'archived' && (
                                  <Badge className="bg-amber-500/15 text-amber-400 border-0 text-[9px] px-1.5 py-0 h-4">Archived</Badge>
                                )}
                              </div>
                            </button>
                            <div className="flex items-center gap-1 shrink-0 ml-2">
                              <Button size="sm" variant="ghost"
                                onClick={() => handleArchiveConversation(conv.id, conv.status === 'archived' ? 'unarchive' : 'archive')}
                                className="text-slate-500 hover:text-amber-400 h-6 w-6 p-0"
                                title={conv.status === 'archived' ? 'Unarchive' : 'Archive'}>
                                {conv.status === 'archived' ? <ArchiveRestore className="w-3 h-3" /> : <Archive className="w-3 h-3" />}
                              </Button>
                              <Button size="sm" variant="ghost"
                                onClick={() => { if (confirm('Delete this conversation? Admin can still recover it.')) handleArchiveConversation(conv.id, 'delete'); }}
                                className="text-slate-500 hover:text-red-400 h-6 w-6 p-0" title="Delete">
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* === ADMIN HISTORY VIEW === */}
            {activeView === 'admin-history' && permissions?.canViewAllHistory && (
              <div className="flex-1 overflow-y-auto p-4">
                <div className="max-w-4xl mx-auto">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                        <Crown className="w-4 h-4 text-red-400" /> Admin Chat History
                      </h3>
                      <p className="text-[10px] text-slate-500 mt-0.5">All conversations across all users — including deleted ones</p>
                    </div>
                    <Button size="sm" variant="ghost" onClick={fetchAdminHistory} className="text-slate-500 hover:text-white h-7">
                      <RefreshCw className="w-3 h-3 mr-1" /> Refresh
                    </Button>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    <div className="bg-[#12121c] rounded-xl border border-white/[0.06] p-3 text-center">
                      <p className="text-lg font-bold text-teal-400">{adminStats.totalActive}</p>
                      <p className="text-[10px] text-slate-500">Active</p>
                    </div>
                    <div className="bg-[#12121c] rounded-xl border border-white/[0.06] p-3 text-center">
                      <p className="text-lg font-bold text-amber-400">{adminStats.totalArchived}</p>
                      <p className="text-[10px] text-slate-500">Archived</p>
                    </div>
                    <div className="bg-[#12121c] rounded-xl border border-white/[0.06] p-3 text-center">
                      <p className="text-lg font-bold text-red-400">{adminStats.totalDeleted}</p>
                      <p className="text-[10px] text-slate-500">Deleted</p>
                    </div>
                  </div>

                  {adminConversations.length === 0 ? (
                    <div className="text-center py-16">
                      <Database className="w-10 h-10 text-slate-700 mx-auto mb-3" />
                      <p className="text-slate-500 text-sm">No conversations found</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {adminConversations.map((conv) => (
                        <div key={conv.id} className="bg-[#12121c] rounded-xl border border-white/[0.06] overflow-hidden">
                          <div className="p-3 flex items-center justify-between cursor-pointer hover:bg-white/[0.02] transition-colors"
                            onClick={() => handleAdminViewConversation(conv.id)}>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-sm">{conv.agentAvatar || '💬'}</span>
                                <p className="text-xs font-medium text-white truncate">{conv.title}</p>
                                {conv.status === 'archived' && (
                                  <Badge className="bg-amber-500/15 text-amber-400 border-0 text-[9px] px-1.5 py-0 h-4">Archived</Badge>
                                )}
                                {conv.status === 'deleted' && (
                                  <Badge className="bg-red-500/15 text-red-400 border-0 text-[9px] px-1.5 py-0 h-4">Deleted</Badge>
                                )}
                                {(conv.deletedMessages || 0) > 0 && (
                                  <Badge className="bg-red-500/10 text-red-300 border-0 text-[9px] px-1.5 py-0 h-4">{conv.deletedMessages} deleted msgs</Badge>
                                )}
                              </div>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-[10px] text-teal-400/70">{conv.agentName}</span>
                                <span className="text-[10px] text-slate-600">·</span>
                                <span className="text-[10px] text-blue-400/70">{conv.userName} ({conv.userRole})</span>
                                <span className="text-[10px] text-slate-600">·</span>
                                <span className="text-[10px] text-slate-500">{formatTime(conv.lastMessageAt)}</span>
                                <span className="text-[10px] text-slate-600">·</span>
                                <span className="text-[10px] text-slate-500">{conv.totalMessages || conv.messageCount} msgs</span>
                              </div>
                            </div>
                            <div className="shrink-0 ml-2">
                              {expandedAdminConv === conv.id ? <ChevronUp className="w-3.5 h-3.5 text-slate-600" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-600" />}
                            </div>
                          </div>
                          {expandedAdminConv === conv.id && (
                            <div className="border-t border-white/[0.06] bg-[#0e0e18] p-3 max-h-[400px] overflow-y-auto">
                              {adminConvMessages.length === 0 ? (
                                <p className="text-xs text-slate-600 text-center py-4">No messages (deleted)</p>
                              ) : (
                                <div className="space-y-2">
                                  {adminConvMessages.map((msg: any) => (
                                    <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                      <div className={`max-w-[85%] rounded-xl px-3 py-2 text-xs ${
                                        msg.role === 'user'
                                          ? 'bg-teal-600/30 text-teal-100 rounded-br-sm'
                                          : 'bg-[#1a1a2e] text-slate-200 rounded-bl-sm border border-white/[0.04]'
                                      }`}>
                                        <div className="flex items-center gap-1.5 mb-1">
                                          <span className="text-[9px] text-slate-500">{msg.role === 'user' ? 'User' : 'Agent'}</span>
                                          <span className="text-[9px] text-slate-600">{formatTime(msg.createdAt)}</span>
                                          {msg.deletedAt && <Badge className="bg-red-500/15 text-red-400 border-0 text-[8px] px-1 py-0 h-3">Deleted</Badge>}
                                        </div>
                                        <p className="whitespace-pre-wrap break-words leading-relaxed" style={{ maxHeight: '120px', overflow: 'hidden' }}>
                                          {msg.content.substring(0, 500)}{msg.content.length > 500 ? '...' : ''}
                                        </p>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* === TASKS VIEW === */}
            {activeView === 'tasks' && (
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {permissions?.canAssignTasks && (
                  <div className="bg-[#12121c] rounded-xl border border-white/[0.06] p-4 space-y-3 max-w-2xl">
                    <h3 className="text-xs font-semibold text-white flex items-center gap-2">
                      <Plus className="w-3.5 h-3.5 text-teal-400" /> New Task
                    </h3>
                    <Input value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)} placeholder="Task title..."
                      className="bg-white/[0.04] border-white/[0.08] text-white placeholder:text-slate-600 text-sm h-9" />
                    <Textarea value={taskDesc} onChange={(e) => setTaskDesc(e.target.value)} placeholder="Description (optional)..."
                      className="bg-white/[0.04] border-white/[0.08] text-white placeholder:text-slate-600 resize-none text-sm" rows={2} />
                    <div className="flex items-center gap-2">
                      <select value={taskPriority} onChange={(e) => setTaskPriority(e.target.value)}
                        className="bg-white/[0.04] border border-white/[0.08] text-white text-xs rounded-lg px-2.5 py-1.5 h-8">
                        <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="critical">Critical</option>
                      </select>
                      <Button onClick={handleAssignTask} disabled={!taskTitle.trim() || taskLoading}
                        className="bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 text-white text-xs h-8">
                        {taskLoading ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Zap className="w-3.5 h-3.5 mr-1.5" />} Assign
                      </Button>
                    </div>
                  </div>
                )}
                <div className="space-y-2 max-w-2xl">
                  <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-1">Task History</h3>
                  {agentTasks.length === 0 ? (
                    <div className="text-center py-12">
                      <ClipboardCheck className="w-8 h-8 text-slate-700 mx-auto mb-2" />
                      <p className="text-slate-600 text-sm">No tasks yet</p>
                    </div>
                  ) : agentTasks.map((task) => <TaskResultCard key={task.id} task={task} onPreview={() => {
                    if (task.result) {
                      const previewMatch = task.result.match(/\[View (?:Live Preview|Full Test Report)\]\(([^)]+)\)/);
                      if (previewMatch) { setPreviewUrl(previewMatch[1]); setPreviewTitle(task.title); setPreviewOpen(true); }
                    }
                  }} />)}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center space-y-4">
              <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-teal-500/10 to-cyan-500/10 flex items-center justify-center">
                <Bot className="w-10 h-10 text-teal-500/50" />
              </div>
              <h2 className="text-xl font-semibold text-white">Select an Agent</h2>
              <p className="text-slate-500 text-sm max-w-sm">Choose an agent from the sidebar to start chatting or assign tasks.</p>
              <div className="flex items-center justify-center gap-2 text-teal-400/70 text-sm">
                <ArrowLeft className="w-4 h-4" /><span>Pick an agent to get started</span>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* === RIGHT PREVIEW PANEL === */}
      {previewOpen && (
        <aside className="h-full border-l border-white/[0.06] bg-[#0c0c14] flex flex-col shrink-0 overflow-hidden transition-[width,opacity] duration-200 ease-in-out"
          style={{ width: 480 }}>
          <div className="h-14 border-b border-white/[0.06] flex items-center justify-between px-4 shrink-0">
            <div className="flex items-center gap-2 min-w-0">
              <Eye className="w-4 h-4 text-teal-400 shrink-0" />
              <p className="text-xs font-medium text-white truncate">{previewTitle}</p>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              {previewUrl && (
                <a href={previewUrl} target="_blank" rel="noopener noreferrer" className="h-7 w-7 flex items-center justify-center rounded-md text-slate-500 hover:text-white hover:bg-white/5">
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
              <Button variant="ghost" size="sm" onClick={() => setPreviewOpen(false)} className="text-slate-500 hover:text-white hover:bg-white/5 h-7 w-7 p-0">
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
          <div className="flex-1 min-h-0 bg-[#111118]">
            {previewUrl ? (
              <iframe src={previewUrl} className="w-full h-full border-0" sandbox="allow-scripts allow-same-origin allow-popups" title="Preview" loading="lazy" />
            ) : (
              <div className="flex items-center justify-center h-full text-center p-8">
                <div>
                  <Eye className="w-10 h-10 text-slate-700 mx-auto mb-3" />
                  <p className="text-slate-500 text-sm">No preview available</p>
                  <p className="text-slate-600 text-xs mt-1">Previews will appear here when you generate websites or reports</p>
                </div>
              </div>
            )}
          </div>
        </aside>
      )}
    </div>
  );
}

// Task Result Card
const TaskResultCard = memo(function TaskResultCard({ task, onPreview }: { task: Task; onPreview?: () => void }) {
  const [expanded, setExpanded] = React.useState(false);
  return (
    <div className="bg-[#12121c] rounded-xl border border-white/[0.06] overflow-hidden">
      <div className="p-3 cursor-pointer hover:bg-white/[0.02] transition-colors duration-150" onClick={() => setExpanded(!expanded)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            {task.status === 'running' ? <Loader2 className="w-3.5 h-3.5 text-amber-400 animate-spin shrink-0" />
              : task.status === 'completed' ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              : <Clock className="w-3.5 h-3.5 text-slate-500 shrink-0" />}
            <p className="text-xs font-medium text-white truncate">{task.title}</p>
            {task.status === 'completed' && task.result && <Badge className="bg-emerald-500/15 text-emerald-400 border-0 text-[9px] px-1.5 py-0 h-4">Result</Badge>}
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <Badge variant="outline" className="text-[9px] h-4 px-1.5" style={{
              borderColor: task.status === 'completed' ? '#10B98130' : task.status === 'running' ? '#F59E0B30' : '#3B82F630',
              color: task.status === 'completed' ? '#10B981' : task.status === 'running' ? '#F59E0B' : '#3B82F6',
            }}>{task.status}</Badge>
            {task.result && (expanded ? <ChevronUp className="w-3 h-3 text-slate-600" /> : <ChevronDown className="w-3 h-3 text-slate-600" />)}
          </div>
        </div>
        {task.description && <p className="text-[10px] text-slate-600 mt-1 ml-5.5">{task.description}</p>}
      </div>
      {expanded && task.result && (
        <div className="border-t border-white/[0.06] bg-[#0e0e18]">
          <div className="p-3 max-h-[350px] overflow-y-auto"><MarkdownRenderer content={task.result} /></div>
          <div className="px-3 py-2 border-t border-white/[0.06] flex items-center gap-2">
            <Button size="sm" variant="ghost" className="text-[10px] text-slate-500 hover:text-white h-6 gap-1"
              onClick={() => {
                const blob = new Blob([task.result || ''], { type: 'text/markdown' }); const url = URL.createObjectURL(blob);
                const a = document.createElement('a'); a.href = url; a.download = `${task.title.replace(/\s+/g, '-').toLowerCase()}-result.md`; a.click(); URL.revokeObjectURL(url);
              }}><Download className="w-3 h-3" /> Download</Button>
            <Button size="sm" variant="ghost" className="text-[10px] text-slate-500 hover:text-white h-6 gap-1"
              onClick={() => { navigator.clipboard.writeText(task.result || ''); toast.success('Copied'); }}><FileText className="w-3 h-3" /> Copy</Button>
            {onPreview && task.result.match(/\[View (?:Live Preview|Full Test Report)\]/) && (
              <Button size="sm" variant="ghost" className="text-[10px] text-teal-400 hover:text-teal-300 h-6 gap-1" onClick={onPreview}>
                <Eye className="w-3 h-3" /> Preview
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
});
