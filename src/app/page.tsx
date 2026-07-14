'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Code2, TestTube2, BarChart3, Target, Rocket, TrendingUp,
  Shield, Headphones, Send, Bot, Activity, Clock, CheckCircle2,
  AlertCircle, Loader2, ChevronRight, Sparkles, Zap, Users,
  ArrowRight, Play, MessageSquare, ListTodo, X, Terminal,
  Server, Database, Wrench, Bug, FileText, GitBranch,
  MonitorSmartphone, RefreshCw, LogOut, Lock, Eye, UserCog,
  Crown, ShieldCheck, BarChart2, WrenchIcon, EyeIcon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { toast } from 'sonner';

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
  admin: 'Administrator',
  manager: 'Manager',
  developer: 'Developer',
  analyst: 'Analyst',
  operator: 'Operator',
  viewer: 'Viewer',
};

const ROLE_COLORS: Record<string, string> = {
  admin: '#EF4444',
  manager: '#F59E0B',
  developer: '#10B981',
  analyst: '#3B82F6',
  operator: '#06B6D4',
  viewer: '#64748B',
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
const TYPE_CONFIG: Record<string, { icon: React.ReactNode; gradient: string; label: string }> = {
  'development': { icon: <Code2 className="w-5 h-5" />, gradient: 'from-emerald-500 to-green-600', label: 'Development' },
  'testing': { icon: <TestTube2 className="w-5 h-5" />, gradient: 'from-violet-500 to-purple-600', label: 'Testing' },
  'business-analysis': { icon: <BarChart3 className="w-5 h-5" />, gradient: 'from-amber-500 to-yellow-600', label: 'Business Analysis' },
  'sales': { icon: <Target className="w-5 h-5" />, gradient: 'from-red-500 to-rose-600', label: 'Sales' },
  'implementation': { icon: <Rocket className="w-5 h-5" />, gradient: 'from-cyan-500 to-teal-600', label: 'Implementation' },
  'data-analysis': { icon: <TrendingUp className="w-5 h-5" />, gradient: 'from-blue-500 to-indigo-600', label: 'Data Analysis' },
  'system-admin': { icon: <Shield className="w-5 h-5" />, gradient: 'from-slate-500 to-gray-600', label: 'System Admin' },
  'support': { icon: <Headphones className="w-5 h-5" />, gradient: 'from-pink-500 to-rose-600', label: 'Support' },
};

const STATUS_CONFIG: Record<string, { color: string; label: string; icon: React.ReactNode }> = {
  idle: { color: 'bg-emerald-500', label: 'Ready', icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
  busy: { color: 'bg-amber-500', label: 'Working', icon: <Activity className="w-3.5 h-3.5" /> },
  error: { color: 'bg-red-500', label: 'Error', icon: <AlertCircle className="w-3.5 h-3.5" /> },
};

const PRIORITY_CONFIG: Record<string, { color: string; label: string }> = {
  low: { color: 'bg-slate-500', label: 'Low' },
  medium: { color: 'bg-blue-500', label: 'Medium' },
  high: { color: 'bg-amber-500', label: 'High' },
  critical: { color: 'bg-red-500', label: 'Critical' },
};

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
  const [activeTab, setActiveTab] = useState('chat');
  const [user, setUser] = useState<UserInfo | null>(null);
  const [userLoading, setUserLoading] = useState(true);
  const chatEndRef = useRef<HTMLDivElement>(null);

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
        setChatMessages(data.messages);
      }
    } catch (error) {
      console.error('Failed to fetch chat:', error);
    }
  }, []);

  useEffect(() => {
    fetchSession();
  }, [fetchSession]);

  useEffect(() => {
    if (user) {
      fetchAgents();
      fetchTasks();
      const interval = setInterval(() => {
        fetchAgents();
        fetchTasks();
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [user, fetchAgents, fetchTasks]);

  useEffect(() => {
    if (selectedAgent) {
      fetchChat(selectedAgent.id);
    }
  }, [selectedAgent, fetchChat]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const handleSendChat = async () => {
    if (!chatInput.trim() || !selectedAgent || !user) return;
    const perms = ROLE_PERMISSIONS[user.role];
    if (!perms.canChat) {
      toast.error('Access Denied', { description: 'Your role does not permit chat access' });
      return;
    }

    const msg = chatInput.trim();
    setChatInput('');
    setChatLoading(true);

    setChatMessages(prev => [...prev, {
      id: 'temp-' + Date.now(),
      role: 'user',
      content: msg,
      agentId: selectedAgent.id,
      createdAt: new Date().toISOString(),
    }]);

    try {
      const res = await fetch('/api/agents/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentId: selectedAgent.id, content: msg }),
      });
      if (res.ok) {
        const data = await res.json();
        setChatMessages(prev => [...prev, data.message]);
      }
    } catch (error) {
      toast.error('Failed to send message');
    } finally {
      setChatLoading(false);
    }
  };

  const handleAssignTask = async () => {
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
        body: JSON.stringify({
          agentId: selectedAgent.id,
          title: taskTitle,
          description: taskDesc,
          priority: taskPriority,
        }),
      });
      if (res.ok) {
        toast.success(`Task assigned to ${selectedAgent.name}`, {
          description: 'The agent will start working on it immediately.',
        });
        setTaskTitle('');
        setTaskDesc('');
        setTaskPriority('medium');
        fetchAgents();
        fetchTasks();
      }
    } catch (error) {
      toast.error('Failed to assign task');
    } finally {
      setTaskLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/callback/credentials', { method: 'POST' });
    } catch {}
    // Clear session by redirecting to sign out
    window.location.href = '/api/auth/signout?callbackUrl=/auth/login';
  };

  const handleSelectAgent = (agent: Agent) => {
    if (!user) return;
    const allowedTypes = ROLE_AGENT_ACCESS[user.role] || [];
    if (!allowedTypes.includes(agent.type)) {
      toast.error('Access Restricted', {
        description: `Your ${ROLE_LABELS[user.role]} role does not have access to ${TYPE_CONFIG[agent.type]?.label || agent.type} agents`,
      });
      return;
    }
    setSelectedAgent(agent);
    setActiveTab('chat');
  };

  // Filter agents based on role
  const getAccessibleAgents = () => {
    if (!user) return [];
    const allowedTypes = ROLE_AGENT_ACCESS[user.role] || [];
    return agents.filter(a => allowedTypes.includes(a.type));
  };

  const getRestrictedAgents = () => {
    if (!user) return [];
    const allowedTypes = ROLE_AGENT_ACCESS[user.role] || [];
    return agents.filter(a => !allowedTypes.includes(a.type));
  };

  const accessibleAgents = getAccessibleAgents();
  const restrictedAgents = getRestrictedAgents();
  const permissions = user ? ROLE_PERMISSIONS[user.role] : null;

  // Stats
  const totalAgents = agents.length;
  const activeAgents = agents.filter(a => a.status === 'busy').length;
  const completedTasks = tasks.filter(t => t.status === 'completed').length;
  const pendingTasks = tasks.filter(t => t.status === 'running' || t.status === 'pending').length;

  // Loading state
  if (userLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-teal-950 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center space-y-4"
        >
          <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center animate-pulse">
            <Bot className="w-8 h-8 text-white" />
          </div>
          <p className="text-slate-400 text-sm">Loading MARQ AI Agent TRIBE...</p>
        </motion.div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-teal-950">
      {/* Header */}
      <header className="border-b border-white/10 bg-slate-950/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-white leading-tight">
                  MARQ <span className="text-teal-400">AI</span> <span className="text-cyan-300">Agent TRIBE</span>
                </h1>
                <p className="text-[10px] text-slate-500 uppercase tracking-widest">AI Workforce Platform</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Stats badges */}
              <div className="hidden md:flex items-center gap-2">
                <Badge variant="outline" className="bg-teal-500/10 border-teal-500/30 text-teal-400 text-xs">
                  <Zap className="w-3 h-3 mr-1" /> {activeAgents} Active
                </Badge>
                <Badge variant="outline" className="bg-emerald-500/10 border-emerald-500/30 text-emerald-400 text-xs">
                  <CheckCircle2 className="w-3 h-3 mr-1" /> {completedTasks} Done
                </Badge>
                <Badge variant="outline" className="bg-amber-500/10 border-amber-500/30 text-amber-400 text-xs">
                  <Clock className="w-3 h-3 mr-1" /> {pendingTasks} Pending
                </Badge>
              </div>

              <Separator orientation="vertical" className="h-8 hidden md:block" />

              {/* User info */}
              <div className="flex items-center gap-2">
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-medium text-white">{user.name}</p>
                  <div className="flex items-center gap-1 justify-end">
                    <span style={{ color: ROLE_COLORS[user.role] }}>
                      {ROLE_ICONS[user.role]}
                    </span>
                    <span className="text-xs" style={{ color: ROLE_COLORS[user.role] }}>
                      {ROLE_LABELS[user.role]}
                    </span>
                  </div>
                </div>
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center text-lg"
                  style={{ background: `${ROLE_COLORS[user.role]}20`, border: `1px solid ${ROLE_COLORS[user.role]}40` }}
                >
                  {user.avatar || '👤'}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                  className="text-slate-400 hover:text-red-400 hover:bg-red-500/10"
                >
                  <LogOut className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-[1600px] mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Hero Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4"
        >
          {[
            { label: 'Total Agents', value: totalAgents, icon: Bot, color: 'from-teal-500 to-cyan-500' },
            { label: 'Active Now', value: activeAgents, icon: Activity, color: 'from-amber-500 to-yellow-500' },
            { label: 'Tasks Done', value: completedTasks, icon: CheckCircle2, color: 'from-emerald-500 to-green-500' },
            { label: 'Pending', value: pendingTasks, icon: Clock, color: 'from-blue-500 to-indigo-500' },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <Card className="bg-slate-900/50 border-slate-800/50 hover:border-slate-700/50 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-slate-500 uppercase tracking-wider">{stat.label}</span>
                    <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${stat.color} flex items-center justify-center opacity-80`}>
                      <stat.icon className="w-4 h-4 text-white" />
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-white">{stat.value}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* Access Level Notice */}
        {user.role !== 'admin' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl p-4 flex items-center gap-3"
            style={{
              background: `${ROLE_COLORS[user.role]}08`,
              border: `1px solid ${ROLE_COLORS[user.role]}20`,
            }}
          >
            <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${ROLE_COLORS[user.role]}20` }}>
              <span style={{ color: ROLE_COLORS[user.role] }}>{ROLE_ICONS[user.role]}</span>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium" style={{ color: ROLE_COLORS[user.role] }}>
                Access Level: {ROLE_LABELS[user.role]}
              </p>
              <p className="text-xs text-slate-400 mt-0.5">
                You have access to {accessibleAgents.length} of {totalAgents} agents
                {!permissions?.canChat && ' • Chat disabled'}
                {!permissions?.canAssignTasks && ' • Task assignment disabled'}
                {permissions?.canManageUsers && ' • User management enabled'}
              </p>
            </div>
          </motion.div>
        )}

        {/* Agent Grid + Detail Panel */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Agent Grid */}
          <div className="lg:col-span-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-teal-400" />
                TRIBE Agents
              </h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => { fetchAgents(); fetchTasks(); }}
                className="text-slate-400 hover:text-teal-400"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </Button>
            </div>

            {/* Accessible Agents */}
            <div className="space-y-2">
              {accessibleAgents.map((agent, i) => (
                <motion.div
                  key={agent.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Card
                    className={`cursor-pointer transition-all duration-200 hover:scale-[1.01] ${
                      selectedAgent?.id === agent.id
                        ? 'border-teal-500/50 bg-teal-500/5 shadow-lg shadow-teal-500/10'
                        : 'bg-slate-900/50 border-slate-800/50 hover:border-slate-700/50'
                    }`}
                    onClick={() => handleSelectAgent(agent)}
                  >
                    <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${TYPE_CONFIG[agent.type]?.gradient || 'from-gray-500 to-gray-600'} flex items-center justify-center shadow-lg`}>
                        <span className="text-lg">{agent.avatar}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-white text-sm">{agent.name}</p>
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0" style={{
                            borderColor: `${agent.color}40`,
                            color: agent.color,
                            background: `${agent.color}10`,
                          }}>
                            {TYPE_CONFIG[agent.type]?.label}
                          </Badge>
                        </div>
                        <p className="text-xs text-slate-400 truncate">{agent.description}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1.5">
                          <div className={`w-2 h-2 rounded-full ${STATUS_CONFIG[agent.status]?.color || 'bg-gray-500'}`} />
                          <span className="text-xs text-slate-400">{STATUS_CONFIG[agent.status]?.label}</span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-600" />
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <div className="flex items-center gap-1 text-xs text-slate-500">
                        <CheckCircle2 className="w-3 h-3" />
                        {agent.tasksCompleted} tasks
                      </div>
                      {agent._count?.tasks > 0 && (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-amber-500/10 border-amber-500/30 text-amber-400">
                          {agent._count.tasks} active
                        </Badge>
                      )}
                    </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            {/* Restricted Agents (locked) */}
            {restrictedAgents.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs text-slate-600 uppercase tracking-wider font-semibold flex items-center gap-1">
                  <Lock className="w-3 h-3" /> Restricted — Upgrade access to unlock
                </p>
                {restrictedAgents.map((agent) => (
                  <Card key={agent.id} className="bg-slate-900/20 border-slate-800/20 opacity-50 cursor-not-allowed">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-800/50 flex items-center justify-center relative">
                          <span className="text-lg grayscale">{agent.avatar}</span>
                          <Lock className="w-3 h-3 text-slate-500 absolute -bottom-0.5 -right-0.5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-slate-500 text-sm">{agent.name}</p>
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-slate-700/30 text-slate-600">
                              {TYPE_CONFIG[agent.type]?.label}
                            </Badge>
                          </div>
                          <p className="text-xs text-slate-600 truncate">{agent.description}</p>
                        </div>
                        <Lock className="w-4 h-4 text-slate-700" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Agent Detail Panel */}
          <div className="lg:col-span-7">
            {selectedAgent ? (
              <AgentDetail
                agent={selectedAgent}
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                chatMessages={chatMessages}
                chatInput={chatInput}
                setChatInput={setChatInput}
                chatLoading={chatLoading}
                taskTitle={taskTitle}
                setTaskTitle={setTaskTitle}
                taskDesc={taskDesc}
                setTaskDesc={setTaskDesc}
                taskPriority={taskPriority}
                setTaskPriority={setTaskPriority}
                taskLoading={taskLoading}
                handleSendChat={handleSendChat}
                handleAssignTask={handleAssignTask}
                chatEndRef={chatEndRef}
                permissions={permissions}
                userRole={user.role}
              />
            ) : (
              <Card className="bg-slate-900/50 border-slate-800/50 h-full min-h-[500px] flex items-center justify-center">
                <CardContent className="text-center space-y-4 py-20">
                  <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-teal-500/20 to-cyan-500/20 flex items-center justify-center">
                    <Bot className="w-10 h-10 text-teal-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-white">Select an Agent</h3>
                  <p className="text-slate-400 text-sm max-w-md">
                    Choose an agent from the TRIBE to start chatting, assign tasks, or view their capabilities.
                    Each agent specializes in a different domain.
                  </p>
                  <div className="flex items-center justify-center gap-2 text-teal-400 text-sm">
                    <ArrowRight className="w-4 h-4" />
                    <span>Pick an agent to get started</span>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <Card className="bg-slate-900/50 border-slate-800/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-base flex items-center gap-2">
              <Activity className="w-4 h-4 text-teal-400" />
              Recent TRIBE Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {tasks.length === 0 ? (
                <p className="text-slate-500 text-sm text-center py-8">No activity yet. Assign a task to get started!</p>
              ) : (
                tasks.slice(0, 10).map((task) => {
                  const agent = agents.find(a => a.id === (task as any).agentId);
                  return (
                    <div key={task.id} className="flex items-center gap-3 py-2 px-3 rounded-lg bg-slate-800/30 hover:bg-slate-800/50 transition-colors">
                      <div className="flex items-center gap-2 text-sm text-slate-300 min-w-0 flex-1">
                        <span>{agent?.avatar || '🤖'}</span>
                        <span className="font-medium">{agent?.name || 'Agent'}</span>
                        <ArrowRight className="w-3 h-3 text-slate-600 shrink-0" />
                        <span className="truncate">{task.title}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Badge variant="outline" className="text-[10px]" style={{
                          borderColor: task.status === 'completed' ? '#10B98140' : task.status === 'running' ? '#F59E0B40' : '#3B82F640',
                          color: task.status === 'completed' ? '#10B981' : task.status === 'running' ? '#F59E0B' : '#3B82F6',
                          background: task.status === 'completed' ? '#10B98110' : task.status === 'running' ? '#F59E0B10' : '#3B82F610',
                        }}>
                          {task.status}
                        </Badge>
                        <Badge variant="outline" className="text-[10px]" style={{
                          borderColor: `${(PRIORITY_CONFIG[task.priority]?.color || '#64748B').replace('bg-', '')}`,
                        }}>
                          {task.priority}
                        </Badge>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <footer className="text-center py-4 border-t border-white/5">
          <p className="text-xs text-slate-600">
            MARQ AI Agent TRIBE v1.0 — Role-Based AI Workforce Platform
          </p>
        </footer>
      </main>
    </div>
  );
}

// Agent Detail Component
function AgentDetail({
  agent,
  activeTab,
  setActiveTab,
  chatMessages,
  chatInput,
  setChatInput,
  chatLoading,
  taskTitle,
  setTaskTitle,
  taskDesc,
  setTaskDesc,
  taskPriority,
  setTaskPriority,
  taskLoading,
  handleSendChat,
  handleAssignTask,
  chatEndRef,
  permissions,
  userRole,
}: {
  agent: Agent;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  chatMessages: ChatMessage[];
  chatInput: string;
  setChatInput: (v: string) => void;
  chatLoading: boolean;
  taskTitle: string;
  setTaskTitle: (v: string) => void;
  taskDesc: string;
  setTaskDesc: (v: string) => void;
  taskPriority: string;
  setTaskPriority: (v: string) => void;
  taskLoading: boolean;
  handleSendChat: () => void;
  handleAssignTask: () => void;
  chatEndRef: React.RefObject<HTMLDivElement>;
  permissions: { canChat: boolean; canAssignTasks: boolean; canManageUsers: boolean; canViewAnalytics: boolean; canConfigureAgents: boolean } | null;
  userRole: string;
}) {
  const capabilities = agent.capabilities.split(',').filter(Boolean);
  const typeConf = TYPE_CONFIG[agent.type];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="bg-slate-900/50 border-slate-800/50 overflow-hidden">
        {/* Agent Header */}
        <div className={`bg-gradient-to-r ${typeConf?.gradient || 'from-gray-500 to-gray-600'} p-6`}>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-3xl shadow-lg">
              {agent.avatar}
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-white">{agent.name}</h2>
              <p className="text-white/80 text-sm mt-1">{agent.description}</p>
              <div className="flex items-center gap-3 mt-2">
                <Badge className="bg-white/20 text-white border-0 text-xs">
                  {typeConf?.label}
                </Badge>
                <div className="flex items-center gap-1.5 text-white/80 text-xs">
                  <div className={`w-2 h-2 rounded-full ${STATUS_CONFIG[agent.status]?.color || 'bg-gray-400'}`} />
                  {STATUS_CONFIG[agent.status]?.label}
                </div>
                <div className="text-white/60 text-xs">
                  {agent.tasksCompleted} tasks completed
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="p-0">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <div className="border-b border-slate-800/50 px-6">
              <TabsList className="bg-transparent border-0 h-12 gap-4">
                <TabsTrigger value="chat" className="data-[state=active]:text-teal-400 data-[state=active]:border-b-2 data-[state=active]:border-teal-400 rounded-none px-0">
                  <MessageSquare className="w-4 h-4 mr-1.5" />
                  Chat
                  {!permissions?.canChat && <Lock className="w-3 h-3 ml-1 text-slate-500" />}
                </TabsTrigger>
                <TabsTrigger value="tasks" className="data-[state=active]:text-teal-400 data-[state=active]:border-b-2 data-[state=active]:border-teal-400 rounded-none px-0">
                  <ListTodo className="w-4 h-4 mr-1.5" />
                  Tasks
                  {!permissions?.canAssignTasks && <Lock className="w-3 h-3 ml-1 text-slate-500" />}
                </TabsTrigger>
                <TabsTrigger value="overview" className="data-[state=active]:text-teal-400 data-[state=active]:border-b-2 data-[state=active]:border-teal-400 rounded-none px-0">
                  <Eye className="w-4 h-4 mr-1.5" />
                  Overview
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Chat Tab */}
            <TabsContent value="chat" className="p-0">
              {!permissions?.canChat ? (
                <div className="p-12 text-center">
                  <Lock className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                  <h3 className="text-white font-semibold">Chat Access Restricted</h3>
                  <p className="text-slate-400 text-sm mt-1">
                    Your {ROLE_LABELS[userRole]} role does not include chat permissions.
                    Contact an administrator to upgrade your access.
                  </p>
                </div>
              ) : (
                <div className="flex flex-col h-[450px]">
                  <ScrollArea className="flex-1 p-4">
                    <div className="space-y-3">
                      {chatMessages.length === 0 && (
                        <div className="text-center py-8">
                          <Bot className="w-8 h-8 text-teal-400/50 mx-auto mb-2" />
                          <p className="text-slate-500 text-sm">Start a conversation with {agent.name}</p>
                        </div>
                      )}
                      {chatMessages.map((msg) => (
                        <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[80%] rounded-xl px-4 py-2.5 ${
                            msg.role === 'user'
                              ? 'bg-teal-600 text-white'
                              : 'bg-slate-800 text-slate-200'
                          }`}>
                            <p className="text-sm leading-relaxed">{msg.content}</p>
                          </div>
                        </div>
                      ))}
                      {chatLoading && (
                        <div className="flex justify-start">
                          <div className="bg-slate-800 rounded-xl px-4 py-2.5">
                            <div className="flex items-center gap-1.5">
                              <Loader2 className="w-3.5 h-3.5 text-teal-400 animate-spin" />
                              <span className="text-xs text-slate-400">{agent.name} is thinking...</span>
                            </div>
                          </div>
                        </div>
                      )}
                      <div ref={chatEndRef} />
                    </div>
                  </ScrollArea>
                  <div className="p-4 border-t border-slate-800/50">
                    <div className="flex gap-2">
                      <Input
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendChat()}
                        placeholder={`Message ${agent.name}...`}
                        className="bg-slate-800/50 border-slate-700/50 text-white placeholder:text-slate-500"
                      />
                      <Button
                        onClick={handleSendChat}
                        disabled={!chatInput.trim() || chatLoading}
                        className="bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 text-white shrink-0"
                      >
                        <Send className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </TabsContent>

            {/* Tasks Tab */}
            <TabsContent value="tasks" className="p-0">
              {!permissions?.canAssignTasks ? (
                <div className="p-12 text-center">
                  <Lock className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                  <h3 className="text-white font-semibold">Task Assignment Restricted</h3>
                  <p className="text-slate-400 text-sm mt-1">
                    Your {ROLE_LABELS[userRole]} role does not include task assignment permissions.
                    Contact an administrator to upgrade your access.
                  </p>
                </div>
              ) : (
                <div className="p-6 space-y-6">
                  {/* Assign Task Form */}
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                      <Play className="w-4 h-4 text-teal-400" />
                      Assign New Task
                    </h3>
                    <Input
                      value={taskTitle}
                      onChange={(e) => setTaskTitle(e.target.value)}
                      placeholder="Task title..."
                      className="bg-slate-800/50 border-slate-700/50 text-white placeholder:text-slate-500"
                    />
                    <Textarea
                      value={taskDesc}
                      onChange={(e) => setTaskDesc(e.target.value)}
                      placeholder="Task description (optional)..."
                      className="bg-slate-800/50 border-slate-700/50 text-white placeholder:text-slate-500 resize-none"
                      rows={2}
                    />
                    <div className="flex items-center gap-3">
                      <select
                        value={taskPriority}
                        onChange={(e) => setTaskPriority(e.target.value)}
                        className="bg-slate-800/50 border border-slate-700/50 text-white text-sm rounded-md px-3 py-1.5"
                      >
                        <option value="low">Low Priority</option>
                        <option value="medium">Medium Priority</option>
                        <option value="high">High Priority</option>
                        <option value="critical">Critical Priority</option>
                      </select>
                      <Button
                        onClick={handleAssignTask}
                        disabled={!taskTitle.trim() || taskLoading}
                        className="bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 text-white"
                      >
                        {taskLoading ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <Zap className="w-4 h-4 mr-1.5" />}
                        Assign Task
                      </Button>
                    </div>
                  </div>

                  <Separator className="bg-slate-800/50" />

                  {/* Task History */}
                  <div className="space-y-2">
                    <h3 className="text-sm font-semibold text-white">Task History</h3>
                    {agent.tasks.length === 0 ? (
                      <p className="text-slate-500 text-sm text-center py-4">No tasks yet for this agent</p>
                    ) : (
                      agent.tasks.map((task) => (
                        <div key={task.id} className="bg-slate-800/30 rounded-lg p-3 space-y-1">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-white">{task.title}</p>
                            <Badge variant="outline" className="text-[10px]" style={{
                              borderColor: task.status === 'completed' ? '#10B98140' : task.status === 'running' ? '#F59E0B40' : '#3B82F640',
                              color: task.status === 'completed' ? '#10B981' : task.status === 'running' ? '#F59E0B' : '#3B82F6',
                            }}>
                              {task.status}
                            </Badge>
                          </div>
                          {task.description && <p className="text-xs text-slate-400">{task.description}</p>}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </TabsContent>

            {/* Overview Tab */}
            <TabsContent value="tasks" className="p-0" />
            <TabsContent value="overview" className="p-0">
              <div className="p-6 space-y-6">
                {/* Capabilities */}
                <div>
                  <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-teal-400" />
                    Capabilities
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {capabilities.map((cap) => (
                      <Badge key={cap} variant="outline" className="text-xs border-slate-700/50 text-slate-300 bg-slate-800/50">
                        {cap}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* System Prompt / Personality */}
                {agent.systemPrompt && (
                  <div>
                    <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                      <Terminal className="w-4 h-4 text-teal-400" />
                      Agent Personality
                    </h3>
                    <div className="bg-slate-800/30 rounded-lg p-4 border border-slate-700/30">
                      <p className="text-sm text-slate-300 leading-relaxed">{agent.systemPrompt}</p>
                    </div>
                  </div>
                )}

                {/* Performance */}
                <div>
                  <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                    <Activity className="w-4 h-4 text-teal-400" />
                    Performance
                  </h3>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-slate-800/30 rounded-lg p-3 text-center">
                      <p className="text-xl font-bold text-white">{agent.tasksCompleted}</p>
                      <p className="text-xs text-slate-400">Completed</p>
                    </div>
                    <div className="bg-slate-800/30 rounded-lg p-3 text-center">
                      <p className="text-xl font-bold text-amber-400">{agent._count?.tasks || 0}</p>
                      <p className="text-xs text-slate-400">Active</p>
                    </div>
                    <div className="bg-slate-800/30 rounded-lg p-3 text-center">
                      <p className="text-xl font-bold text-teal-400">{agent.tasksCompleted > 0 ? '98%' : '—'}</p>
                      <p className="text-xs text-slate-400">Success Rate</p>
                    </div>
                  </div>
                </div>

                {/* Your Access */}
                <div>
                  <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                    <Shield className="w-4 h-4 text-teal-400" />
                    Your Access Rights
                  </h3>
                  <div className="bg-slate-800/30 rounded-lg p-4 border border-slate-700/30 space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-400">Chat with Agent</span>
                      <span className={permissions?.canChat ? 'text-emerald-400' : 'text-red-400'}>
                        {permissions?.canChat ? '✓ Allowed' : '✗ Restricted'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-400">Assign Tasks</span>
                      <span className={permissions?.canAssignTasks ? 'text-emerald-400' : 'text-red-400'}>
                        {permissions?.canAssignTasks ? '✓ Allowed' : '✗ Restricted'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-400">Configure Agent</span>
                      <span className={permissions?.canConfigureAgents ? 'text-emerald-400' : 'text-red-400'}>
                        {permissions?.canConfigureAgents ? '✓ Allowed' : '✗ Restricted'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-400">View Analytics</span>
                      <span className={permissions?.canViewAnalytics ? 'text-emerald-400' : 'text-red-400'}>
                        {permissions?.canViewAnalytics ? '✓ Allowed' : '✗ Restricted'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </Card>
    </motion.div>
  );
}
