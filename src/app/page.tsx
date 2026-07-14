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
  FileText, ClipboardCheck, Menu, ArrowLeft
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
  description: string;
  avatar: string;
  color: string;
  capabilities: string;
  systemPrompt: string | null;
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

interface UserInfo {
  id: string;
  email: string;
  name: string;
  role: string;
  avatar: string;
  department: string;
}

// Role configuration
const ROLE_AGENT_ACCESS: Record<string, string[]> = {
  admin: ['development', 'testing', 'business-analysis', 'sales', 'implementation', 'data-analysis', 'system-admin', 'support'],
  manager: ['development', 'testing', 'business-analysis', 'sales', 'implementation', 'data-analysis', 'system-admin', 'support'],
  developer: ['development', 'testing', 'data-analysis'],
  analyst: ['business-analysis', 'data-analysis', 'sales'],
  operator: ['implementation', 'system-admin', 'support'],
  viewer: ['development', 'testing', 'business-analysis', 'sales', 'implementation', 'data-analysis', 'system-admin', 'support'],
};

const ROLE_PERMISSIONS: Record<string, {
  canChat: boolean;
  canAssignTasks: boolean;
  canManageUsers: boolean;
  canViewAnalytics: boolean;
  canConfigureAgents: boolean;
}> = {
  admin: { canChat: true, canAssignTasks: true, canManageUsers: true, canViewAnalytics: true, canConfigureAgents: true },
  manager: { canChat: true, canAssignTasks: true, canManageUsers: false, canViewAnalytics: true, canConfigureAgents: false },
  developer: { canChat: true, canAssignTasks: true, canManageUsers: false, canViewAnalytics: false, canConfigureAgents: false },
  analyst: { canChat: true, canAssignTasks: true, canManageUsers: false, canViewAnalytics: true, canConfigureAgents: false },
  operator: { canChat: true, canAssignTasks: true, canManageUsers: false, canViewAnalytics: false, canConfigureAgents: false },
  viewer: { canChat: false, canAssignTasks: false, canManageUsers: false, canViewAnalytics: false, canConfigureAgents: false },
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
  'testing': { icon: <TestTube2 className="w-4 h-4" />, color: '#8B5CF6', label: 'QA', bg: '#8B5CF615' },
  'business-analysis': { icon: <BarChart3 className="w-4 h-4" />, color: '#F59E0B', label: 'BA', bg: '#F59E0B15' },
  'sales': { icon: <Target className="w-4 h-4" />, color: '#EF4444', label: 'Sales', bg: '#EF444415' },
  'implementation': { icon: <Rocket className="w-4 h-4" />, color: '#06B6D4', label: 'Impl', bg: '#06B6D415' },
  'data-analysis': { icon: <TrendingUp className="w-4 h-4" />, color: '#3B82F6', label: 'Data', bg: '#3B82F615' },
  'system-admin': { icon: <Shield className="w-4 h-4" />, color: '#64748B', label: 'SysOps', bg: '#64748B15' },
  'support': { icon: <Headphones className="w-4 h-4" />, color: '#EC4899', label: 'Support', bg: '#EC489915' },
};

const STATUS_CONFIG: Record<string, { dotColor: string; label: string }> = {
  idle: { dotColor: '#10B981', label: 'Ready' },
  busy: { dotColor: '#F59E0B', label: 'Working' },
  error: { dotColor: '#EF4444', label: 'Error' },
};

// Memoized Agent List Item
const AgentListItem = memo(function AgentListItem({
  agent,
  isSelected,
  onClick,
}: {
  agent: Agent;
  isSelected: boolean;
  onClick: () => void;
}) {
  const typeConf = TYPE_CONFIG[agent.type];
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left transition-colors duration-150 ${
        isSelected
          ? 'bg-teal-500/10 border border-teal-500/20'
          : 'hover:bg-white/[0.03] border border-transparent'
      }`}
    >
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center text-sm shrink-0"
        style={{ background: typeConf?.bg || '#33415520' }}
      >
        {agent.avatar}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <p className="text-xs font-medium text-white truncate">{agent.name}</p>
          <span
            className="w-1.5 h-1.5 rounded-full shrink-0"
            style={{ background: STATUS_CONFIG[agent.status]?.dotColor || '#10B981' }}
          />
        </div>
        <p className="text-[10px] text-slate-600 truncate">{typeConf?.label || agent.type}</p>
      </div>
      {agent._count?.tasks > 0 && (
        <Badge className="bg-white/[0.06] text-slate-400 border-0 text-[9px] px-1.5 py-0 h-4">
          {agent._count.tasks}
        </Badge>
      )}
    </button>
  );
});

// Memoized Chat Message
const ChatMessageItem = memo(function ChatMessageItem({
  msg,
  agentAvatar,
  agentType,
}: {
  msg: ChatMessage;
  agentAvatar: string;
  agentType: string;
}) {
  const typeConf = TYPE_CONFIG[agentType];
  return (
    <div className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
      {msg.role !== 'user' && (
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center text-sm mr-2 mt-1 shrink-0"
          style={{ background: typeConf?.bg }}
        >
          {agentAvatar}
        </div>
      )}
      <div className={`max-w-[75%] rounded-2xl ${
        msg.role === 'user'
          ? 'bg-teal-600 text-white px-4 py-2.5 rounded-br-md'
          : 'bg-[#1a1a2e] text-slate-200 px-4 py-3 rounded-bl-md border border-white/[0.06]'
      }`}>
        {msg.role === 'user' ? (
          <p className="text-sm leading-relaxed">{msg.content}</p>
        ) : (
          <div className="agent-message">
            <MarkdownRenderer content={msg.content} />
          </div>
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
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewTitle, setPreviewTitle] = useState('Preview');
  const [activeView, setActiveView] = useState<'chat' | 'tasks'>('chat');
  const [searchQuery, setSearchQuery] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchSession = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/session');
      if (res.ok) {
        const data = await res.json();
        if (data.authenticated && data.user) {
          setUser(data.user);
        } else {
          window.location.href = '/auth/login';
        }
      } else {
        window.location.href = '/auth/login';
      }
    } catch {
      window.location.href = '/auth/login';
    } finally {
      setUserLoading(false);
    }
  }, []);

  const fetchAgents = useCallback(async () => {
    try {
      const res = await fetch('/api/agents');
      if (res.ok) {
        const data = await res.json();
        setAgents(data.agents);
      }
    } catch (error) {
      console.error('Failed to fetch agents:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchTasks = useCallback(async () => {
    try {
      const res = await fetch('/api/agents/tasks');
      if (res.ok) {
        const data = await res.json();
        setTasks(data.tasks);
      }
    } catch (error) {
      console.error('Failed to fetch tasks:', error);
    }
  }, []);

  const fetchChat = useCallback(async (agentId: string) => {
    try {
      const res = await fetch(`/api/agents/chat?agentId=${agentId}`);
      if (res.ok) {
        const data = await res.json();
        setChatMessages(data.messages || []);
      }
    } catch (error) {
      console.error('Failed to fetch chat:', error);
    }
  }, []);

  useEffect(() => { fetchSession(); }, [fetchSession]);

  useEffect(() => {
    if (user) {
      fetchAgents();
      fetchTasks();
      // Reduced polling: 30s instead of 5s (major network savings)
      const interval = setInterval(() => { fetchAgents(); fetchTasks(); }, 30000);
      return () => clearInterval(interval);
    }
  }, [user, fetchAgents, fetchTasks]);

  useEffect(() => {
    if (selectedAgent) fetchChat(selectedAgent.id);
  }, [selectedAgent, fetchChat]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // STREAMING chat handler - tokens appear as they arrive
  const handleSendChat = useCallback(async () => {
    if (!chatInput.trim() || !selectedAgent || !user) return;
    const perms = ROLE_PERMISSIONS[user.role];
    if (!perms.canChat) {
      toast.error('Access Denied', { description: 'Your role does not permit chat access' });
      return;
    }
    const msg = chatInput.trim();
    setChatInput('');

    // Add user message immediately
    const tempUserMsg: ChatMessage = {
      id: 'temp-' + Date.now(),
      role: 'user',
      content: msg,
      agentId: selectedAgent.id,
      createdAt: new Date().toISOString(),
    };

    // Add streaming placeholder for agent response
    const streamMsgId = 'stream-' + Date.now();
    const streamMsg: ChatMessage = {
      id: streamMsgId,
      role: 'agent',
      content: '',
      agentId: selectedAgent.id,
      createdAt: new Date().toISOString(),
      isStreaming: true,
    };

    setChatMessages(prev => [...prev, tempUserMsg, streamMsg]);
    setChatLoading(true);

    // Cancel any previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const res = await fetch('/api/agents/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentId: selectedAgent.id, content: msg, stream: true }),
        signal: controller.signal,
      });

      if (!res.ok) {
        throw new Error('Chat request failed');
      }

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('No response stream');
      }

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
                // Update the streaming message with new content
                setChatMessages(prev => prev.map(m =>
                  m.id === streamMsgId
                    ? { ...m, content: fullContent }
                    : m
                ));
              } else if (data.type === 'done') {
                actionResult = data.actionResult;
              }
            } catch {
              // Skip malformed chunks
            }
          }
        }
      }

      // Finalize the message
      setChatMessages(prev => prev.map(m =>
        m.id === streamMsgId
          ? { ...m, isStreaming: false, content: fullContent, actionResult }
          : m
      ));

      // Open preview if action result has one
      if (actionResult?.previewUrl) {
        setPreviewUrl(actionResult.previewUrl);
        setPreviewTitle(actionResult.description || 'Preview');
        setPreviewOpen(true);
      }

    } catch (error: any) {
      if (error.name === 'AbortError') return;
      console.error('Stream error:', error);

      // Fallback to non-streaming
      try {
        const res = await fetch('/api/agents/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ agentId: selectedAgent.id, content: msg, stream: false }),
        });
        if (res.ok) {
          const data = await res.json();
          setChatMessages(prev => prev.map(m =>
            m.id === streamMsgId
              ? { ...m, content: data.message?.content || 'No response', isStreaming: false, actionResult: data.actionResult }
              : m
          ));
          if (data.actionResult?.previewUrl) {
            setPreviewUrl(data.actionResult.previewUrl);
            setPreviewTitle(data.actionResult.description || 'Preview');
            setPreviewOpen(true);
          }
        }
      } catch {
        toast.error('Failed to send message');
        // Remove the failed streaming message
        setChatMessages(prev => prev.filter(m => m.id !== streamMsgId));
      }
    } finally {
      setChatLoading(false);
    }
  }, [chatInput, selectedAgent, user]);

  const handleAssignTask = useCallback(async () => {
    if (!taskTitle.trim() || !selectedAgent || !user) return;
    const perms = ROLE_PERMISSIONS[user.role];
    if (!perms.canAssignTasks) {
      toast.error('Access Denied', { description: 'Your role does not permit task assignment' });
      return;
    }
    setTaskLoading(true);
    try {
      const res = await fetch('/api/agents/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentId: selectedAgent.id, title: taskTitle, description: taskDesc, priority: taskPriority }),
      });
      if (res.ok) {
        toast.success(`Task assigned to ${selectedAgent.name}`, { description: 'The agent will start working on it.' });
        setTaskTitle(''); setTaskDesc(''); setTaskPriority('medium');
        fetchAgents(); fetchTasks();
      }
    } catch (error) {
      toast.error('Failed to assign task');
    } finally {
      setTaskLoading(false);
    }
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
  }, [user]);

  const handleLogout = useCallback(async () => {
    try { await fetch('/api/auth/callback/credentials', { method: 'POST' }); } catch {}
    window.location.href = '/api/auth/signout?callbackUrl=/auth/login';
  }, []);

  // Memoize filtered agents to avoid re-computation on every render
  const accessibleAgents = useMemo(() => {
    if (!user) return [];
    const allowedTypes = ROLE_AGENT_ACCESS[user.role] || [];
    return agents.filter(a => allowedTypes.includes(a.type));
  }, [user, agents]);

  const filteredAgents = useMemo(() => {
    if (!searchQuery) return accessibleAgents;
    const q = searchQuery.toLowerCase();
    return accessibleAgents.filter(a => a.name.toLowerCase().includes(q) || a.type.toLowerCase().includes(q));
  }, [accessibleAgents, searchQuery]);

  const permissions = useMemo(() => user ? ROLE_PERMISSIONS[user.role] : null, [user]);

  const agentTasks = useMemo(() =>
    tasks.filter(t => selectedAgent && (t as any).agentId === selectedAgent.id),
    [tasks, selectedAgent]
  );

  // Loading state - no framer-motion, pure CSS
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
      <aside
        className="h-full border-r border-white/[0.06] bg-[#0c0c14] flex flex-col shrink-0 overflow-hidden transition-[width] duration-200 ease-in-out"
        style={{ width: sidebarOpen ? 260 : 64 }}
      >
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
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search agents..."
                className="bg-white/[0.04] border-white/[0.06] text-white placeholder:text-slate-600 text-xs h-8 pl-8 rounded-lg"
              />
            </div>
          </div>
        )}

        {/* Agent List */}
        <div className="flex-1 overflow-y-auto py-2 px-1.5 space-y-0.5">
          {sidebarOpen ? (
            <>
              <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-wider px-2 mb-1.5">Agents</p>
              {filteredAgents.map((agent) => (
                <AgentListItem
                  key={agent.id}
                  agent={agent}
                  isSelected={selectedAgent?.id === agent.id}
                  onClick={() => handleSelectAgent(agent)}
                />
              ))}
            </>
          ) : (
            filteredAgents.map((agent) => (
              <button
                key={agent.id}
                onClick={() => handleSelectAgent(agent)}
                className={`w-full flex items-center justify-center p-2 rounded-lg transition-colors duration-150 ${
                  selectedAgent?.id === agent.id ? 'bg-teal-500/10' : 'hover:bg-white/[0.03]'
                }`}
                title={agent.name}
              >
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-sm"
                  style={{ background: TYPE_CONFIG[agent.type]?.bg }}
                >
                  {agent.avatar}
                </div>
              </button>
            ))
          )}
        </div>

        {/* Sidebar Footer */}
        <div className="border-t border-white/[0.06] p-3 shrink-0">
          {sidebarOpen ? (
            <div className="flex items-center gap-2">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center text-sm shrink-0"
                style={{ background: `${ROLE_COLORS[user.role]}20` }}
              >
                {user.avatar}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <p className="text-xs font-medium text-white truncate">{user.name}</p>
                  <span style={{ color: ROLE_COLORS[user.role] }}>{ROLE_ICONS[user.role]}</span>
                </div>
                <p className="text-[10px] text-slate-600 truncate">{ROLE_LABELS[user.role]}</p>
              </div>
              <Button variant="ghost" size="sm" onClick={handleLogout}
                className="text-slate-500 hover:text-red-400 hover:bg-white/5 h-7 w-7 p-0 shrink-0">
                <LogOut className="w-3.5 h-3.5" />
              </Button>
            </div>
          ) : (
            <button onClick={handleLogout}
              className="w-8 h-8 mx-auto rounded-lg flex items-center justify-center text-slate-500 hover:text-red-400 hover:bg-white/5 transition-colors">
              <LogOut className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </aside>

      {/* === MAIN CONTENT === */}
      <main className="flex-1 flex min-w-0 h-full">
        {selectedAgent ? (
          <>
            {/* Agent Detail Panel */}
            <div className="flex-1 flex flex-col min-w-0 h-full">
              {/* Agent Header */}
              <div className="h-14 border-b border-white/[0.06] flex items-center justify-between px-4 shrink-0 bg-[#0c0c14]">
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center text-lg shrink-0"
                    style={{ background: TYPE_CONFIG[selectedAgent.type]?.bg }}
                  >
                    {selectedAgent.avatar}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h2 className="text-sm font-semibold text-white">{selectedAgent.name}</h2>
                      <span className="w-1.5 h-1.5 rounded-full" style={{ background: STATUS_CONFIG[selectedAgent.status]?.dotColor }} />
                      <Badge variant="outline" className="text-[9px] h-4 px-1.5"
                        style={{ borderColor: TYPE_CONFIG[selectedAgent.type]?.color + '30', color: TYPE_CONFIG[selectedAgent.type]?.color }}>
                        {TYPE_CONFIG[selectedAgent.type]?.label}
                      </Badge>
                    </div>
                    <p className="text-[10px] text-slate-500 truncate max-w-xs">{selectedAgent.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Button variant="ghost" size="sm"
                    onClick={() => setActiveView('chat')}
                    className={`text-xs h-7 px-2.5 ${activeView === 'chat' ? 'bg-teal-500/10 text-teal-400' : 'text-slate-500 hover:text-white'}`}>
                    <MessageSquare className="w-3.5 h-3.5 mr-1" /> Chat
                  </Button>
                  <Button variant="ghost" size="sm"
                    onClick={() => setActiveView('tasks')}
                    className={`text-xs h-7 px-2.5 ${activeView === 'tasks' ? 'bg-teal-500/10 text-teal-400' : 'text-slate-500 hover:text-white'}`}>
                    <ClipboardCheck className="w-3.5 h-3.5 mr-1" /> Tasks
                  </Button>
                  <Separator orientation="vertical" className="h-5 mx-1 bg-white/[0.06]" />
                  <Button variant="ghost" size="sm" onClick={() => setPreviewOpen(!previewOpen)}
                    className={`text-xs h-7 px-2.5 ${previewOpen ? 'bg-teal-500/10 text-teal-400' : 'text-slate-500 hover:text-white'}`}>
                    <Eye className="w-3.5 h-3.5 mr-1" /> Preview
                  </Button>
                </div>
              </div>

              {/* Content Area */}
              {activeView === 'chat' ? (
                <div className="flex-1 flex flex-col min-h-0">
                  {/* Chat Messages */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {chatMessages.length === 0 && !chatLoading && (
                      <div className="text-center py-16">
                        <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-teal-500/10 to-cyan-500/10 flex items-center justify-center mb-4">
                          <Sparkles className="w-7 h-7 text-teal-400/50" />
                        </div>
                        <h3 className="text-lg font-semibold text-white mb-1">Start a conversation</h3>
                        <p className="text-slate-500 text-sm max-w-xs mx-auto mb-6">Ask {selectedAgent.name} anything — from code reviews to architecture decisions.</p>
                        <div className="flex flex-wrap justify-center gap-2 max-w-md mx-auto">
                          {(['Write a REST API with Express', 'Debug my React component', 'Review my database schema', 'Create a CI/CD pipeline']).map((suggestion) => (
                            <button
                              key={suggestion}
                              onClick={() => { setChatInput(suggestion); }}
                              className="text-xs px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-slate-400 hover:text-white hover:bg-white/[0.08] transition-colors duration-150"
                            >
                              {suggestion}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                    {chatMessages.map((msg) => (
                      <ChatMessageItem
                        key={msg.id}
                        msg={msg}
                        agentAvatar={selectedAgent.avatar}
                        agentType={selectedAgent.type}
                      />
                    ))}
                    {chatLoading && chatMessages.every(m => m.role !== 'agent' || !m.isStreaming) && (
                      <div className="flex justify-start">
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center text-sm mr-2 mt-1 shrink-0"
                          style={{ background: TYPE_CONFIG[selectedAgent.type]?.bg }}>
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

                  {/* Input Bar */}
                  {!permissions?.canChat ? (
                    <div className="border-t border-white/[0.06] p-4 text-center">
                      <Lock className="w-4 h-4 text-slate-600 mx-auto mb-1" />
                      <p className="text-xs text-slate-600">Chat access restricted for your role</p>
                    </div>
                  ) : (
                    <div className="border-t border-white/[0.06] p-3 shrink-0">
                      <div className="flex gap-2 items-end max-w-3xl mx-auto">
                        <div className="flex-1 relative">
                          <Textarea
                            value={chatInput}
                            onChange={(e) => setChatInput(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendChat(); }}}
                            placeholder={`Message ${selectedAgent.name}...`}
                            className="bg-white/[0.04] border-white/[0.08] text-white placeholder:text-slate-600 resize-none rounded-xl min-h-[44px] max-h-32 pr-12 text-sm"
                            rows={1}
                          />
                          <Button
                            onClick={handleSendChat}
                            disabled={!chatInput.trim() || chatLoading}
                            className="absolute right-1.5 bottom-1.5 bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 text-white h-8 w-8 p-0 rounded-lg shrink-0"
                          >
                            <Send className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="h-full flex flex-col">
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {/* New Task Form */}
                    {permissions?.canAssignTasks && (
                      <div className="bg-[#12121c] rounded-xl border border-white/[0.06] p-4 space-y-3 max-w-2xl">
                        <h3 className="text-xs font-semibold text-white flex items-center gap-2">
                          <Plus className="w-3.5 h-3.5 text-teal-400" /> New Task
                        </h3>
                        <Input
                          value={taskTitle}
                          onChange={(e) => setTaskTitle(e.target.value)}
                          placeholder="Task title..."
                          className="bg-white/[0.04] border-white/[0.08] text-white placeholder:text-slate-600 text-sm h-9"
                        />
                        <Textarea
                          value={taskDesc}
                          onChange={(e) => setTaskDesc(e.target.value)}
                          placeholder="Description (optional)..."
                          className="bg-white/[0.04] border-white/[0.08] text-white placeholder:text-slate-600 resize-none text-sm"
                          rows={2}
                        />
                        <div className="flex items-center gap-2">
                          <select
                            value={taskPriority}
                            onChange={(e) => setTaskPriority(e.target.value)}
                            className="bg-white/[0.04] border border-white/[0.08] text-white text-xs rounded-lg px-2.5 py-1.5 h-8"
                          >
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                            <option value="critical">Critical</option>
                          </select>
                          <Button
                            onClick={handleAssignTask}
                            disabled={!taskTitle.trim() || taskLoading}
                            className="bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 text-white text-xs h-8"
                          >
                            {taskLoading ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Zap className="w-3.5 h-3.5 mr-1.5" />}
                            Assign
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Task List */}
                    <div className="space-y-2 max-w-2xl">
                      <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-1">Task History</h3>
                      {agentTasks.length === 0 ? (
                        <div className="text-center py-12">
                          <ClipboardCheck className="w-8 h-8 text-slate-700 mx-auto mb-2" />
                          <p className="text-slate-600 text-sm">No tasks yet</p>
                        </div>
                      ) : (
                        agentTasks.map((task) => <TaskResultCard key={task.id} task={task} onPreview={() => {
                          if (task.result) {
                            const previewMatch = task.result.match(/\[View (?:Live Preview|Full Test Report)\]\(([^)]+)\)/);
                            if (previewMatch) {
                              setPreviewUrl(previewMatch[1]);
                              setPreviewTitle(task.title);
                              setPreviewOpen(true);
                            }
                          }
                        }} />)
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          /* No agent selected */
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center space-y-4">
              <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-teal-500/10 to-cyan-500/10 flex items-center justify-center">
                <Bot className="w-10 h-10 text-teal-500/50" />
              </div>
              <h2 className="text-xl font-semibold text-white">Select an Agent</h2>
              <p className="text-slate-500 text-sm max-w-sm">Choose an agent from the sidebar to start chatting or assign tasks.</p>
              <div className="flex items-center justify-center gap-2 text-teal-400/70 text-sm">
                <ArrowLeft className="w-4 h-4" />
                <span>Pick an agent to get started</span>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* === RIGHT PREVIEW PANEL === */}
      {previewOpen && (
        <aside
          className="h-full border-l border-white/[0.06] bg-[#0c0c14] flex flex-col shrink-0 overflow-hidden transition-[width,opacity] duration-200 ease-in-out"
          style={{ width: 480 }}
        >
          {/* Preview Header */}
          <div className="h-14 border-b border-white/[0.06] flex items-center justify-between px-4 shrink-0">
            <div className="flex items-center gap-2 min-w-0">
              <Eye className="w-4 h-4 text-teal-400 shrink-0" />
              <p className="text-xs font-medium text-white truncate">{previewTitle}</p>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              {previewUrl && (
                <a href={previewUrl} target="_blank" rel="noopener noreferrer"
                  className="h-7 w-7 flex items-center justify-center rounded-md text-slate-500 hover:text-white hover:bg-white/5">
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
              <Button variant="ghost" size="sm" onClick={() => setPreviewOpen(false)}
                className="text-slate-500 hover:text-white hover:bg-white/5 h-7 w-7 p-0">
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Preview Content */}
          <div className="flex-1 min-h-0 bg-[#111118]">
            {previewUrl ? (
              <iframe
                src={previewUrl}
                className="w-full h-full border-0"
                sandbox="allow-scripts allow-same-origin allow-popups"
                title="Preview"
                loading="lazy"
              />
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
            {task.status === 'running' ? (
              <Loader2 className="w-3.5 h-3.5 text-amber-400 animate-spin shrink-0" />
            ) : task.status === 'completed' ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            ) : (
              <Clock className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            )}
            <p className="text-xs font-medium text-white truncate">{task.title}</p>
            {task.status === 'completed' && task.result && (
              <Badge className="bg-emerald-500/15 text-emerald-400 border-0 text-[9px] px-1.5 py-0 h-4">Result</Badge>
            )}
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <Badge variant="outline" className="text-[9px] h-4 px-1.5" style={{
              borderColor: task.status === 'completed' ? '#10B98130' : task.status === 'running' ? '#F59E0B30' : '#3B82F630',
              color: task.status === 'completed' ? '#10B981' : task.status === 'running' ? '#F59E0B' : '#3B82F6',
            }}>
              {task.status}
            </Badge>
            {task.result && (expanded ? <ChevronUp className="w-3 h-3 text-slate-600" /> : <ChevronDown className="w-3 h-3 text-slate-600" />)}
          </div>
        </div>
        {task.description && <p className="text-[10px] text-slate-600 mt-1 ml-5.5">{task.description}</p>}
      </div>

      {expanded && task.result && (
        <div className="border-t border-white/[0.06] bg-[#0e0e18]">
          <div className="p-3 max-h-[350px] overflow-y-auto">
            <MarkdownRenderer content={task.result} />
          </div>
          <div className="px-3 py-2 border-t border-white/[0.06] flex items-center gap-2">
            <Button size="sm" variant="ghost" className="text-[10px] text-slate-500 hover:text-white h-6 gap-1"
              onClick={() => {
                const blob = new Blob([task.result || ''], { type: 'text/markdown' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url; a.download = `${task.title.replace(/\s+/g, '-').toLowerCase()}-result.md`; a.click();
                URL.revokeObjectURL(url);
              }}>
              <Download className="w-3 h-3" /> Download
            </Button>
            <Button size="sm" variant="ghost" className="text-[10px] text-slate-500 hover:text-white h-6 gap-1"
              onClick={() => { navigator.clipboard.writeText(task.result || ''); toast.success('Copied'); }}>
              <FileText className="w-3 h-3" /> Copy
            </Button>
            {onPreview && task.result.match(/\[View (?:Live Preview|Full Test Report)\]/) && (
              <Button size="sm" variant="ghost" className="text-[10px] text-teal-400 hover:text-teal-300 h-6 gap-1"
                onClick={onPreview}>
                <Eye className="w-3 h-3" /> Preview
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
});
