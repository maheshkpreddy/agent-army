'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Code2, TestTube2, BarChart3, Target, Rocket, TrendingUp,
  Shield, Headphones, Send, Bot, Activity, Clock, CheckCircle2,
  AlertCircle, Loader2, ChevronRight, Sparkles, Zap, Users,
  ArrowRight, Play, MessageSquare, ListTodo, X, Terminal,
  Server, Database, Wrench, Bug, FileText, GitBranch,
  MonitorSmartphone, RefreshCw
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

// Agent type config
const TYPE_CONFIG: Record<string, { icon: React.ReactNode; gradient: string; bgClass: string; label: string }> = {
  'development': { icon: <Code2 className="h-5 w-5" />, gradient: 'from-emerald-500 to-teal-600', bgClass: 'bg-emerald-500/10 border-emerald-500/20', label: 'Development' },
  'testing': { icon: <TestTube2 className="h-5 w-5" />, gradient: 'from-violet-500 to-purple-600', bgClass: 'bg-violet-500/10 border-violet-500/20', label: 'Testing' },
  'business-analysis': { icon: <BarChart3 className="h-5 w-5" />, gradient: 'from-amber-500 to-orange-600', bgClass: 'bg-amber-500/10 border-amber-500/20', label: 'Business Analysis' },
  'sales': { icon: <Target className="h-5 w-5" />, gradient: 'from-red-500 to-rose-600', bgClass: 'bg-red-500/10 border-red-500/20', label: 'Sales' },
  'implementation': { icon: <Rocket className="h-5 w-5" />, gradient: 'from-cyan-500 to-blue-600', bgClass: 'bg-cyan-500/10 border-cyan-500/20', label: 'Implementation' },
  'data-analysis': { icon: <TrendingUp className="h-5 w-5" />, gradient: 'from-blue-500 to-indigo-600', bgClass: 'bg-blue-500/10 border-blue-500/20', label: 'Data Analysis' },
  'system-admin': { icon: <Shield className="h-5 w-5" />, gradient: 'from-slate-500 to-gray-600', bgClass: 'bg-slate-500/10 border-slate-500/20', label: 'System Admin' },
  'support': { icon: <Headphones className="h-5 w-5" />, gradient: 'from-pink-500 to-rose-600', bgClass: 'bg-pink-500/10 border-pink-500/20', label: 'Support' },
};

const STATUS_CONFIG: Record<string, { icon: React.ReactNode; color: string; label: string }> = {
  'idle': { icon: <CheckCircle2 className="h-3.5 w-3.5" />, color: 'text-emerald-500', label: 'Ready' },
  'busy': { icon: <Loader2 className="h-3.5 w-3.5 animate-spin" />, color: 'text-amber-500', label: 'Working' },
  'error': { icon: <AlertCircle className="h-3.5 w-3.5" />, color: 'text-red-500', label: 'Error' },
};

const PRIORITY_CONFIG: Record<string, { color: string; label: string }> = {
  'low': { color: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300', label: 'Low' },
  'medium': { color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300', label: 'Medium' },
  'high': { color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300', label: 'High' },
  'critical': { color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300', label: 'Critical' },
};

export default function AgentArmyPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [taskPriority, setTaskPriority] = useState('medium');
  const [taskSubmitting, setTaskSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [tasks, setTasks] = useState<Task[]>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Fetch agents
  const fetchAgents = useCallback(async () => {
    try {
      const res = await fetch('/api/agents');
      const data = await res.json();
      if (data.agents) {
        setAgents(data.agents);
        // Update selected agent if it exists
        if (selectedAgent) {
          const updated = data.agents.find((a: Agent) => a.id === selectedAgent.id);
          if (updated) setSelectedAgent(updated);
        }
      }
    } catch (err) {
      console.error('Failed to fetch agents:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedAgent]);

  // Fetch chat messages
  const fetchChat = useCallback(async (agentId: string) => {
    try {
      const res = await fetch(`/api/agents/chat?agentId=${agentId}`);
      const data = await res.json();
      if (data.messages) setChatMessages(data.messages);
    } catch (err) {
      console.error('Failed to fetch chat:', err);
    }
  }, []);

  // Fetch tasks
  const fetchTasks = useCallback(async () => {
    try {
      const res = await fetch('/api/agents/tasks');
      const data = await res.json();
      if (data.tasks) setTasks(data.tasks);
    } catch (err) {
      console.error('Failed to fetch tasks:', err);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchAgents();
    fetchTasks();
  }, [fetchAgents, fetchTasks]);

  // Auto-refresh
  useEffect(() => {
    const interval = setInterval(() => {
      fetchAgents();
      fetchTasks();
    }, 5000);
    return () => clearInterval(interval);
  }, [fetchAgents, fetchTasks]);

  // Scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // Select agent
  const handleSelectAgent = useCallback((agent: Agent) => {
    setSelectedAgent(agent);
    setActiveTab('chat');
    fetchChat(agent.id);
  }, [fetchChat]);

  // Send chat message
  const handleSendChat = useCallback(async () => {
    if (!chatInput.trim() || !selectedAgent || chatLoading) return;
    const msg = chatInput.trim();
    setChatInput('');
    setChatLoading(true);

    // Optimistic UI
    const tempUserMsg: ChatMessage = {
      id: `temp-${Date.now()}`,
      role: 'user',
      content: msg,
      agentId: selectedAgent.id,
      createdAt: new Date().toISOString(),
    };
    setChatMessages(prev => [...prev, tempUserMsg]);

    try {
      const res = await fetch('/api/agents/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentId: selectedAgent.id, content: msg }),
      });
      const data = await res.json();
      if (data.message) {
        setChatMessages(prev => [...prev, data.message]);
      }
    } catch (err) {
      toast.error('Failed to send message');
    } finally {
      setChatLoading(false);
    }
  }, [chatInput, selectedAgent, chatLoading]);

  // Assign task
  const handleAssignTask = useCallback(async () => {
    if (!taskTitle.trim() || !selectedAgent || taskSubmitting) return;
    setTaskSubmitting(true);
    try {
      const res = await fetch('/api/agents/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentId: selectedAgent.id,
          title: taskTitle.trim(),
          description: taskDesc.trim(),
          priority: taskPriority,
        }),
      });
      const data = await res.json();
      if (data.task) {
        toast.success(`Task assigned to ${selectedAgent.name}!`);
        setTaskTitle('');
        setTaskDesc('');
        setTaskPriority('medium');
        fetchAgents();
        fetchTasks();
      }
    } catch (err) {
      toast.error('Failed to assign task');
    } finally {
      setTaskSubmitting(false);
    }
  }, [taskTitle, taskDesc, taskPriority, selectedAgent, taskSubmitting, fetchAgents, fetchTasks]);

  // Stats
  const totalTasksCompleted = agents.reduce((sum, a) => sum + a.tasksCompleted, 0);
  const busyAgents = agents.filter(a => a.status === 'busy').length;
  const idleAgents = agents.filter(a => a.status === 'idle').length;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          className="h-12 w-12 rounded-full border-4 border-primary border-t-transparent"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-500 to-cyan-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                  <Zap className="h-5 w-5 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-emerald-400 animate-pulse" />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight">Agent Army</h1>
                <p className="text-xs text-muted-foreground">Your AI workforce, deployed and ready</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="hidden sm:flex items-center gap-3">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                        <span className="text-sm font-medium text-emerald-700 dark:text-emerald-400">{idleAgents} Ready</span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>Agents available for work</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20">
                        <Activity className="h-3.5 w-3.5 text-amber-500" />
                        <span className="text-sm font-medium text-amber-700 dark:text-amber-400">{busyAgents} Active</span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>Agents currently working</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/20">
                        <ListTodo className="h-3.5 w-3.5 text-primary" />
                        <span className="text-sm font-medium text-primary">{totalTasksCompleted} Done</span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>Total tasks completed</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => { fetchAgents(); fetchTasks(); }}
                className="gap-1.5"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Refresh
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Hero Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
        >
          <Card className="border-0 bg-gradient-to-br from-emerald-500/10 to-teal-500/5">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Agents</p>
                  <p className="text-2xl font-bold">{agents.length}</p>
                </div>
                <Users className="h-8 w-8 text-emerald-500/50" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 bg-gradient-to-br from-amber-500/10 to-orange-500/5">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active Now</p>
                  <p className="text-2xl font-bold">{busyAgents}</p>
                </div>
                <Activity className="h-8 w-8 text-amber-500/50" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 bg-gradient-to-br from-blue-500/10 to-indigo-500/5">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Tasks Completed</p>
                  <p className="text-2xl font-bold">{totalTasksCompleted}</p>
                </div>
                <CheckCircle2 className="h-8 w-8 text-blue-500/50" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 bg-gradient-to-br from-violet-500/10 to-purple-500/5">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pending Tasks</p>
                  <p className="text-2xl font-bold">{tasks.filter(t => t.status === 'running' || t.status === 'pending').length}</p>
                </div>
                <Clock className="h-8 w-8 text-violet-500/50" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <div className="grid lg:grid-cols-12 gap-6">
          {/* Agent Grid */}
          <div className="lg:col-span-5 xl:col-span-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Your Agents</h2>
              <Badge variant="secondary" className="text-xs">{agents.length} Deployed</Badge>
            </div>
            <ScrollArea className="h-[calc(100vh-320px)]">
              <div className="space-y-3 pr-3">
                <AnimatePresence mode="popLayout">
                  {agents.map((agent, idx) => {
                    const config = TYPE_CONFIG[agent.type] || TYPE_CONFIG['development'];
                    const statusConfig = STATUS_CONFIG[agent.status] || STATUS_CONFIG['idle'];
                    const isSelected = selectedAgent?.id === agent.id;

                    return (
                      <motion.div
                        key={agent.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ delay: idx * 0.05 }}
                      >
                        <Card
                          className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                            isSelected
                              ? 'ring-2 ring-primary shadow-lg'
                              : 'hover:border-primary/30'
                          }`}
                          onClick={() => handleSelectAgent(agent)}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-start gap-3">
                              <div className={`h-11 w-11 rounded-xl bg-gradient-to-br ${config.gradient} flex items-center justify-center text-white text-lg shrink-0 shadow-lg`}>
                                {agent.avatar}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <h3 className="font-semibold text-sm truncate">{agent.name}</h3>
                                  <div className={`flex items-center gap-1 ${statusConfig.color}`}>
                                    {statusConfig.icon}
                                    <span className="text-xs font-medium">{statusConfig.label}</span>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <Badge variant="outline" className="text-[10px] h-5 px-1.5">
                                    {config.label}
                                  </Badge>
                                  <span className="text-xs text-muted-foreground">
                                    {agent.tasksCompleted} tasks done
                                  </span>
                                </div>
                                <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2">
                                  {agent.description}
                                </p>
                                <div className="flex flex-wrap gap-1 mt-2">
                                  {agent.capabilities.split(',').slice(0, 3).map(cap => (
                                    <span
                                      key={cap}
                                      className="text-[10px] px-1.5 py-0.5 rounded-md bg-muted text-muted-foreground"
                                    >
                                      {cap}
                                    </span>
                                  ))}
                                  {agent.capabilities.split(',').length > 3 && (
                                    <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-muted text-muted-foreground">
                                      +{agent.capabilities.split(',').length - 3}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <ChevronRight className={`h-4 w-4 shrink-0 transition-colors ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} />
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            </ScrollArea>
          </div>

          {/* Agent Detail / Chat / Tasks */}
          <div className="lg:col-span-7 xl:col-span-8">
            {selectedAgent ? (
              <AgentDetail
                agent={selectedAgent}
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                chatMessages={chatMessages}
                chatInput={chatInput}
                setChatInput={setChatInput}
                chatLoading={chatLoading}
                onSendChat={handleSendChat}
                taskTitle={taskTitle}
                setTaskTitle={setTaskTitle}
                taskDesc={taskDesc}
                setTaskDesc={setTaskDesc}
                taskPriority={taskPriority}
                setTaskPriority={setTaskPriority}
                taskSubmitting={taskSubmitting}
                onAssignTask={handleAssignTask}
                tasks={tasks.filter(t => t.agentId === selectedAgent.id)}
                chatEndRef={chatEndRef}
              />
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center h-[calc(100vh-320px)] text-center"
              >
                <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 flex items-center justify-center mb-6">
                  <Bot className="h-10 w-10 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Select an Agent</h3>
                <p className="text-muted-foreground max-w-md">
                  Choose an agent from the left panel to start chatting, assign tasks, or view their capabilities. Each agent specializes in a different domain.
                </p>
                <div className="grid grid-cols-4 gap-3 mt-8">
                  {Object.entries(TYPE_CONFIG).map(([type, config]) => (
                    <div key={type} className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-muted/50">
                      <div className={`h-8 w-8 rounded-lg bg-gradient-to-br ${config.gradient} flex items-center justify-center text-white`}>
                        {config.icon}
                      </div>
                      <span className="text-[10px] text-muted-foreground text-center">{config.label}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Recent Activity</h2>
            <Badge variant="secondary" className="text-xs">{tasks.length} Total Tasks</Badge>
          </div>
          <Card>
            <CardContent className="p-0">
              {tasks.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <ListTodo className="h-10 w-10 text-muted-foreground/30 mb-3" />
                  <p className="text-sm text-muted-foreground">No tasks yet. Select an agent and assign work!</p>
                </div>
              ) : (
                <div className="divide-y">
                  {tasks.slice(0, 10).map((task, idx) => {
                    const agent = agents.find(a => a.id === task.agentId);
                    const config = agent ? TYPE_CONFIG[agent.type] : TYPE_CONFIG['development'];
                    const priorityConfig = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG['medium'];
                    const isComplete = task.status === 'completed';
                    const isRunning = task.status === 'running';

                    return (
                      <motion.div
                        key={task.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.03 }}
                        className="flex items-center gap-4 px-4 py-3 hover:bg-muted/30 transition-colors"
                      >
                        <div className={`h-8 w-8 rounded-lg bg-gradient-to-br ${config.gradient} flex items-center justify-center text-white text-xs shrink-0`}>
                          {agent?.avatar || '🤖'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium truncate">{task.title}</p>
                            <Badge className={`text-[10px] h-5 px-1.5 ${priorityConfig.color}`}>
                              {priorityConfig.label}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {agent?.name} • {new Date(task.createdAt).toLocaleTimeString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {isComplete && (
                            <Badge variant="outline" className="text-emerald-600 border-emerald-200 dark:text-emerald-400 dark:border-emerald-800">
                              <CheckCircle2 className="h-3 w-3 mr-1" />Done
                            </Badge>
                          )}
                          {isRunning && (
                            <Badge variant="outline" className="text-amber-600 border-amber-200 dark:text-amber-400 dark:border-amber-800">
                              <Loader2 className="h-3 w-3 mr-1 animate-spin" />Running
                            </Badge>
                          )}
                          {task.status === 'pending' && (
                            <Badge variant="outline" className="text-muted-foreground">
                              <Clock className="h-3 w-3 mr-1" />Pending
                            </Badge>
                          )}
                          {task.status === 'failed' && (
                            <Badge variant="outline" className="text-red-600 border-red-200 dark:text-red-400 dark:border-red-800">
                              <AlertCircle className="h-3 w-3 mr-1" />Failed
                            </Badge>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t mt-12 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Agent Army</span>
              <span className="text-xs text-muted-foreground">— Your AI Workforce</span>
            </div>
            <p className="text-xs text-muted-foreground">
              {agents.length} agents deployed • {totalTasksCompleted} tasks completed • All systems operational
            </p>
          </div>
        </div>
      </footer>
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
  onSendChat,
  taskTitle,
  setTaskTitle,
  taskDesc,
  setTaskDesc,
  taskPriority,
  setTaskPriority,
  taskSubmitting,
  onAssignTask,
  tasks,
  chatEndRef,
}: {
  agent: Agent;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  chatMessages: ChatMessage[];
  chatInput: string;
  setChatInput: (val: string) => void;
  chatLoading: boolean;
  onSendChat: () => void;
  taskTitle: string;
  setTaskTitle: (val: string) => void;
  taskDesc: string;
  setTaskDesc: (val: string) => void;
  taskPriority: string;
  setTaskPriority: (val: string) => void;
  taskSubmitting: boolean;
  onAssignTask: () => void;
  tasks: Task[];
  chatEndRef: React.RefObject<HTMLDivElement | null>;
}) {
  const config = TYPE_CONFIG[agent.type] || TYPE_CONFIG['development'];
  const statusConfig = STATUS_CONFIG[agent.status] || STATUS_CONFIG['idle'];
  const capabilities = agent.capabilities.split(',');

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      {/* Agent Header */}
      <Card className="overflow-hidden">
        <div className={`h-2 bg-gradient-to-r ${config.gradient}`} />
        <CardContent className="p-5">
          <div className="flex items-start gap-4">
            <div className={`h-14 w-14 rounded-2xl bg-gradient-to-br ${config.gradient} flex items-center justify-center text-2xl shrink-0 shadow-lg`}>
              {agent.avatar}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-bold">{agent.name}</h2>
                <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${statusConfig.color} bg-opacity-10`}>
                  {statusConfig.icon}
                  {statusConfig.label}
                </div>
                <Badge variant="outline" className="text-xs">{config.label}</Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-1">{agent.description}</p>
              <div className="flex items-center gap-4 mt-3">
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>{agent.tasksCompleted} completed</span>
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <ListTodo className="h-3.5 w-3.5" />
                  <span>{tasks.length} tasks</span>
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>{capabilities.length} capabilities</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="chat" className="gap-1.5">
            <MessageSquare className="h-3.5 w-3.5" />
            Chat
          </TabsTrigger>
          <TabsTrigger value="tasks" className="gap-1.5">
            <ListTodo className="h-3.5 w-3.5" />
            Tasks
          </TabsTrigger>
          <TabsTrigger value="overview" className="gap-1.5">
            <Bot className="h-3.5 w-3.5" />
            Overview
          </TabsTrigger>
        </TabsList>

        {/* Chat Tab */}
        <TabsContent value="chat" className="mt-4">
          <Card className="flex flex-col" style={{ height: '420px' }}>
            <CardHeader className="pb-3 pt-4 px-4">
              <CardTitle className="text-sm flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-primary" />
                Chat with {agent.name}
              </CardTitle>
            </CardHeader>
            <Separator />
            <ScrollArea className="flex-1 px-4">
              <div className="space-y-4 py-4">
                {chatMessages.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <Bot className="h-8 w-8 text-muted-foreground/30 mb-2" />
                    <p className="text-sm text-muted-foreground">Start a conversation with {agent.name}</p>
                    <p className="text-xs text-muted-foreground mt-1">Ask about anything in their domain</p>
                  </div>
                )}
                {chatMessages.map((msg, idx) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.03 }}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
                      msg.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    }`}>
                      {msg.role === 'agent' && (
                        <div className="flex items-center gap-1.5 mb-1.5">
                          <span className="text-xs">{agent.avatar}</span>
                          <span className="text-xs font-medium text-muted-foreground">{agent.name}</span>
                        </div>
                      )}
                      <p className="leading-relaxed">{msg.content}</p>
                      <p className={`text-[10px] mt-1 ${msg.role === 'user' ? 'text-primary-foreground/60' : 'text-muted-foreground'}`}>
                        {new Date(msg.createdAt).toLocaleTimeString()}
                      </p>
                    </div>
                  </motion.div>
                ))}
                {chatLoading && (
                  <div className="flex justify-start">
                    <div className="bg-muted rounded-2xl px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                        <span className="text-sm text-muted-foreground">{agent.name} is thinking...</span>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>
            </ScrollArea>
            <Separator />
            <div className="p-3 flex gap-2">
              <Input
                placeholder={`Ask ${agent.name} anything...`}
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && onSendChat()}
                disabled={chatLoading}
                className="flex-1"
              />
              <Button
                onClick={onSendChat}
                disabled={chatLoading || !chatInput.trim()}
                size="icon"
                className="shrink-0"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </Card>
        </TabsContent>

        {/* Tasks Tab */}
        <TabsContent value="tasks" className="mt-4">
          <div className="grid md:grid-cols-2 gap-4">
            {/* Assign Task Form */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Play className="h-4 w-4 text-primary" />
                  Assign New Task
                </CardTitle>
                <CardDescription>Give {agent.name} a new assignment</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Task Title</label>
                  <Input
                    placeholder="e.g., Review authentication module"
                    value={taskTitle}
                    onChange={(e) => setTaskTitle(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Description</label>
                  <Textarea
                    placeholder="Describe what needs to be done..."
                    value={taskDesc}
                    onChange={(e) => setTaskDesc(e.target.value)}
                    rows={3}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Priority</label>
                  <div className="flex gap-2">
                    {['low', 'medium', 'high', 'critical'].map(p => (
                      <Button
                        key={p}
                        variant={taskPriority === p ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setTaskPriority(p)}
                        className="text-xs capitalize"
                      >
                        {p}
                      </Button>
                    ))}
                  </div>
                </div>
                <Button
                  onClick={onAssignTask}
                  disabled={taskSubmitting || !taskTitle.trim()}
                  className="w-full gap-2"
                >
                  {taskSubmitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Rocket className="h-4 w-4" />
                  )}
                  {taskSubmitting ? 'Assigning...' : 'Assign Task'}
                </Button>
              </CardContent>
            </Card>

            {/* Task List */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <ListTodo className="h-4 w-4 text-primary" />
                  Task History
                </CardTitle>
                <CardDescription>{tasks.length} tasks for {agent.name}</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[280px]">
                  {tasks.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center px-4">
                      <ListTodo className="h-8 w-8 text-muted-foreground/30 mb-2" />
                      <p className="text-sm text-muted-foreground">No tasks yet</p>
                      <p className="text-xs text-muted-foreground">Assign a task to get started</p>
                    </div>
                  ) : (
                    <div className="divide-y px-4">
                      {tasks.map((task, idx) => {
                        const priorityConfig = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG['medium'];
                        return (
                          <motion.div
                            key={task.id}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: idx * 0.03 }}
                            className="py-3"
                          >
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-medium">{task.title}</p>
                              <Badge className={`text-[10px] h-5 px-1.5 ${priorityConfig.color}`}>
                                {priorityConfig.label}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              {task.status === 'completed' && (
                                <span className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                                  <CheckCircle2 className="h-3 w-3" /> Completed
                                </span>
                              )}
                              {task.status === 'running' && (
                                <span className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
                                  <Loader2 className="h-3 w-3 animate-spin" /> In Progress
                                </span>
                              )}
                              {task.status === 'pending' && (
                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                  <Clock className="h-3 w-3" /> Pending
                                </span>
                              )}
                              {task.status === 'failed' && (
                                <span className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
                                  <AlertCircle className="h-3 w-3" /> Failed
                                </span>
                              )}
                              <span className="text-xs text-muted-foreground">
                                {new Date(task.createdAt).toLocaleString()}
                              </span>
                            </div>
                            {task.result && (
                              <p className="text-xs text-muted-foreground mt-1.5 bg-muted/50 rounded-md p-2 line-clamp-2">
                                {task.result}
                              </p>
                            )}
                          </motion.div>
                        );
                      })}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Overview Tab */}
        <TabsContent value="overview" className="mt-4">
          <div className="grid md:grid-cols-2 gap-4">
            {/* Capabilities */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  Capabilities
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2">
                  {capabilities.map(cap => {
                    const capIcons: Record<string, React.ReactNode> = {
                      'code-generation': <Code2 className="h-3.5 w-3.5" />,
                      'code-review': <GitBranch className="h-3.5 w-3.5" />,
                      'debugging': <Bug className="h-3.5 w-3.5" />,
                      'unit-testing': <TestTube2 className="h-3.5 w-3.5" />,
                      'deployment': <Rocket className="h-3.5 w-3.5" />,
                      'monitoring': <Activity className="h-3.5 w-3.5" />,
                      'database-ops': <Database className="h-3.5 w-3.5" />,
                      'server': <Server className="h-3.5 w-3.5" />,
                    };
                    return (
                      <div key={cap} className={`flex items-center gap-2 p-2.5 rounded-lg ${config.bgClass} border`}>
                        {capIcons[cap] || <Wrench className="h-3.5 w-3.5" />}
                        <span className="text-xs font-medium capitalize">{cap.replace(/-/g, ' ')}</span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* System Prompt / Personality */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Terminal className="h-4 w-4 text-primary" />
                  Agent Personality
                </CardTitle>
                <CardDescription>How {agent.name} approaches work</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-muted/50 rounded-lg p-4">
                  <p className="text-sm leading-relaxed text-muted-foreground italic">
                    {agent.systemPrompt || 'Default agent personality — adaptable and helpful.'}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Performance */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-primary" />
                  Performance
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-muted-foreground">Tasks Completed</span>
                    <span className="text-xs font-medium">{agent.tasksCompleted}</span>
                  </div>
                  <Progress value={Math.min(100, agent.tasksCompleted * 10)} className="h-2" />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-muted-foreground">Current Status</span>
                    <span className="text-xs font-medium capitalize">{agent.status}</span>
                  </div>
                  <Progress value={agent.status === 'busy' ? 65 : agent.status === 'idle' ? 100 : 30} className="h-2" />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-muted-foreground">Active Tasks</span>
                    <span className="text-xs font-medium">{tasks.filter(t => t.status === 'running').length}</span>
                  </div>
                  <Progress value={tasks.filter(t => t.status === 'running').length * 25} className="h-2" />
                </div>
                <Separator />
                <div className="grid grid-cols-2 gap-3 text-center">
                  <div className="p-2 rounded-lg bg-muted/50">
                    <p className="text-lg font-bold">{agent.tasksCompleted}</p>
                    <p className="text-[10px] text-muted-foreground">Completed</p>
                  </div>
                  <div className="p-2 rounded-lg bg-muted/50">
                    <p className="text-lg font-bold">{tasks.filter(t => t.status === 'running').length}</p>
                    <p className="text-[10px] text-muted-foreground">In Progress</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Zap className="h-4 w-4 text-primary" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  variant="outline"
                  className="w-full justify-start gap-2"
                  onClick={() => setActiveTab('chat')}
                >
                  <MessageSquare className="h-4 w-4" />
                  Start Chat
                  <ArrowRight className="h-3 w-3 ml-auto" />
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start gap-2"
                  onClick={() => setActiveTab('tasks')}
                >
                  <Play className="h-4 w-4" />
                  Assign Task
                  <ArrowRight className="h-3 w-3 ml-auto" />
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start gap-2"
                  onClick={() => {
                    setTaskTitle('Full system review');
                    setTaskDesc('Perform a comprehensive review of all systems and identify areas for improvement');
                    setTaskPriority('high');
                    setActiveTab('tasks');
                  }}
                >
                  <MonitorSmartphone className="h-4 w-4" />
                  System Review
                  <ArrowRight className="h-3 w-3 ml-auto" />
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start gap-2"
                  onClick={() => {
                    setTaskTitle('Generate report');
                    setTaskDesc('Create a detailed status report with metrics and recommendations');
                    setTaskPriority('medium');
                    setActiveTab('tasks');
                  }}
                >
                  <FileText className="h-4 w-4" />
                  Generate Report
                  <ArrowRight className="h-3 w-3 ml-auto" />
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}
