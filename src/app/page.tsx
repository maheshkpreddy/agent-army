'use client';

import React, { useEffect, useCallback, useState, useMemo } from 'react';
import { useSkillStore } from '@/lib/skill-store';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Grid3X3, List, SlidersHorizontal, X, Sparkles, Bot, Code, Shield,
  TrendingUp, Briefcase, Megaphone, BarChart3, Users, Trophy, Palette,
  Heart, ChevronDown, BookOpen, Copy, Check, ArrowUpRight, Zap, Command,
  Filter, Tag, Eye, Star, Plus, Send, FileText, Wrench, MonitorSmartphone,
  ChevronLeft, ChevronRight, Github, ExternalLink, Clock, Hash, LayoutGrid,
  ArrowRight, Globe, Layers, Rocket
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import ReactMarkdown from 'react-markdown';
import { toast } from 'sonner';

// Category icon mapping
const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  'Bot': <Bot className="h-4 w-4" />,
  'Sparkles': <Sparkles className="h-4 w-4" />,
  'TrendingUp': <TrendingUp className="h-4 w-4" />,
  'Briefcase': <Briefcase className="h-4 w-4" />,
  'Code': <Code className="h-4 w-4" />,
  'Shield': <Shield className="h-4 w-4" />,
  'Megaphone': <Megaphone className="h-4 w-4" />,
  'BarChart3': <BarChart3 className="h-4 w-4" />,
  'Users': <Users className="h-4 w-4" />,
  'Trophy': <Trophy className="h-4 w-4" />,
  'Palette': <Palette className="h-4 w-4" />,
  'Heart': <Heart className="h-4 w-4" />,
};

function getCategoryIcon(iconName: string | null) {
  if (!iconName) return <Layers className="h-4 w-4" />;
  return CATEGORY_ICONS[iconName] || <Layers className="h-4 w-4" />;
}

// Stat counter component
function StatCounter({ value, label }: { value: number; label: string }) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let start = 0;
    const duration = 1500;
    const increment = value / (duration / 16);
    const timer = setInterval(() => {
      start += increment;
      if (start >= value) {
        setCount(value);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [value]);
  return (
    <div className="text-center">
      <div className="text-3xl md:text-4xl font-bold text-primary">{count}+</div>
      <div className="text-sm text-muted-foreground mt-1">{label}</div>
    </div>
  );
}

// Skill card component
function SkillCard({ skill, onClick, view }: { skill: any; onClick: () => void; view: 'grid' | 'list' }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(skill.content);
    setCopied(true);
    toast.success('Skill content copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  if (view === 'list') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        whileHover={{ scale: 1.005 }}
        transition={{ duration: 0.2 }}
      >
        <Card
          className="cursor-pointer hover:shadow-md hover:border-primary/30 transition-all duration-200 group"
          onClick={onClick}
        >
          <CardContent className="p-4 flex items-center gap-4">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: `${skill.category?.color || '#8B5CF6'}15` }}
            >
              <span className="text-lg" style={{ color: skill.category?.color || '#8B5CF6' }}>
                {skill.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-sm truncate">{skill.name}</h3>
                {skill.featured && (
                  <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500 flex-shrink-0" />
                )}
              </div>
              <p className="text-xs text-muted-foreground truncate mt-0.5">{skill.description}</p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <Badge variant="outline" className="text-xs px-2 py-0.5 hidden sm:inline-flex">
                {skill.category?.name}
              </Badge>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={handleCopy}
                    >
                      {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Copy SKILL.md</TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <ArrowUpRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.25 }}
      layout
    >
      <Card
        className="cursor-pointer hover:shadow-lg hover:border-primary/30 transition-all duration-300 group h-full flex flex-col"
        onClick={onClick}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: `${skill.category?.color || '#8B5CF6'}15` }}
              >
                <span className="text-lg font-bold" style={{ color: skill.category?.color || '#8B5CF6' }}>
                  {skill.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="min-w-0">
                <CardTitle className="text-base leading-tight group-hover:text-primary transition-colors truncate">
                  {skill.name}
                </CardTitle>
                <div className="flex items-center gap-1.5 mt-1">
                  {skill.featured && (
                    <Badge className="text-[10px] px-1.5 py-0 bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20 hover:bg-amber-500/20">
                      <Star className="h-2.5 w-2.5 mr-0.5 fill-amber-500" /> Featured
                    </Badge>
                  )}
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 truncate max-w-[120px]">
                    {skill.category?.name}
                  </Badge>
                </div>
              </div>
            </div>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                    onClick={handleCopy}
                  >
                    {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Copy SKILL.md</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </CardHeader>
        <CardContent className="pt-0 flex-1 flex flex-col">
          <CardDescription className="text-xs line-clamp-3 flex-1">
            {skill.description}
          </CardDescription>
          {skill.tags && skill.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-3">
              {skill.tags.slice(0, 3).map((tag: any) => (
                <span
                  key={tag.id}
                  className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground"
                >
                  #{tag.slug}
                </span>
              ))}
              {skill.tags.length > 3 && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">
                  +{skill.tags.length - 3}
                </span>
              )}
            </div>
          )}
          {skill.tools && (
            <div className="flex items-center gap-1 mt-2 text-[10px] text-muted-foreground">
              <Wrench className="h-2.5 w-2.5" />
              <span className="truncate">{skill.tools}</span>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

// Loading skeleton
function SkillCardSkeleton({ view }: { view: 'grid' | 'list' }) {
  if (view === 'list') {
    return (
      <Card>
        <CardContent className="p-4 flex items-center gap-4">
          <Skeleton className="w-10 h-10 rounded-lg" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-3 w-72" />
          </div>
        </CardContent>
      </Card>
    );
  }
  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <Skeleton className="w-10 h-10 rounded-lg" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-20" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0 flex-1 space-y-2">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-3/4" />
        <div className="flex gap-1 mt-3">
          <Skeleton className="h-4 w-12 rounded-full" />
          <Skeleton className="h-4 w-16 rounded-full" />
        </div>
      </CardContent>
    </Card>
  );
}

// Skill detail panel
function SkillDetailPanel() {
  const { selectedSkill, detailOpen, setDetailOpen } = useSkillStore();
  const [activeTab, setActiveTab] = useState('overview');
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (selectedSkill) {
      navigator.clipboard.writeText(selectedSkill.content);
      setCopied(true);
      toast.success('SKILL.md copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!selectedSkill) return null;

  return (
    <Sheet open={detailOpen} onOpenChange={setDetailOpen}>
      <SheetContent className="w-full sm:max-w-2xl p-0 overflow-hidden">
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="p-6 border-b bg-gradient-to-r from-primary/5 to-transparent">
            <SheetHeader>
              <div className="flex items-start gap-4">
                <div
                  className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: `${selectedSkill.category?.color || '#8B5CF6'}15` }}
                >
                  <span className="text-2xl font-bold" style={{ color: selectedSkill.category?.color || '#8B5CF6' }}>
                    {selectedSkill.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <SheetTitle className="text-xl">{selectedSkill.name}</SheetTitle>
                  <SheetDescription className="mt-1 text-sm">{selectedSkill.description}</SheetDescription>
                  <div className="flex flex-wrap items-center gap-2 mt-3">
                    <Badge
                      className="text-xs"
                      style={{
                        backgroundColor: `${selectedSkill.category?.color}15`,
                        color: selectedSkill.category?.color,
                        borderColor: `${selectedSkill.category?.color}30`,
                      }}
                    >
                      {getCategoryIcon(selectedSkill.category?.icon)}
                      <span className="ml-1">{selectedSkill.category?.name}</span>
                    </Badge>
                    {selectedSkill.featured && (
                      <Badge className="text-xs bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20">
                        <Star className="h-3 w-3 mr-1 fill-amber-500" /> Featured
                      </Badge>
                    )}
                    {selectedSkill.tools && (
                      <Badge variant="outline" className="text-xs">
                        <Wrench className="h-3 w-3 mr-1" /> {selectedSkill.tools}
                      </Badge>
                    )}
                    {selectedSkill.model && selectedSkill.model !== 'inherit' && (
                      <Badge variant="outline" className="text-xs">
                        <MonitorSmartphone className="h-3 w-3 mr-1" /> {selectedSkill.model}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </SheetHeader>
            <div className="flex gap-2 mt-4">
              <Button size="sm" onClick={handleCopy} className="gap-1.5">
                {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? 'Copied!' : 'Copy SKILL.md'}
              </Button>
              <Button size="sm" variant="outline" className="gap-1.5" asChild>
                <a
                  href={`https://github.com/OneWave-AI/claude-skills/tree/main/${selectedSkill.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Github className="h-3.5 w-3.5" /> Source
                </a>
              </Button>
            </div>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
            <div className="px-6 border-b">
              <TabsList className="h-10">
                <TabsTrigger value="overview" className="text-xs gap-1.5">
                  <BookOpen className="h-3.5 w-3.5" /> Overview
                </TabsTrigger>
                <TabsTrigger value="content" className="text-xs gap-1.5">
                  <FileText className="h-3.5 w-3.5" /> SKILL.md
                </TabsTrigger>
                <TabsTrigger value="usage" className="text-xs gap-1.5">
                  <Command className="h-3.5 w-3.5" /> Usage
                </TabsTrigger>
              </TabsList>
            </div>

            <div className="flex-1 overflow-hidden">
              <TabsContent value="overview" className="h-full m-0">
                <ScrollArea className="h-full">
                  <div className="p-6 space-y-6">
                    {/* Tags */}
                    {selectedSkill.tags && selectedSkill.tags.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold mb-2 flex items-center gap-1.5">
                          <Tag className="h-3.5 w-3.5" /> Tags
                        </h4>
                        <div className="flex flex-wrap gap-1.5">
                          {selectedSkill.tags.map((tag: any) => (
                            <Badge key={tag.id} variant="secondary" className="text-xs">
                              #{tag.slug}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Description */}
                    <div>
                      <h4 className="text-sm font-semibold mb-2 flex items-center gap-1.5">
                        <Eye className="h-3.5 w-3.5" /> Description
                      </h4>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {selectedSkill.description}
                      </p>
                    </div>

                    {/* Details Grid */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 rounded-lg bg-muted/50">
                        <div className="text-xs text-muted-foreground">Category</div>
                        <div className="text-sm font-medium mt-0.5">{selectedSkill.category?.name}</div>
                      </div>
                      <div className="p-3 rounded-lg bg-muted/50">
                        <div className="text-xs text-muted-foreground">Tools Required</div>
                        <div className="text-sm font-medium mt-0.5">{selectedSkill.tools || 'All (inherited)'}</div>
                      </div>
                      <div className="p-3 rounded-lg bg-muted/50">
                        <div className="text-xs text-muted-foreground">Model</div>
                        <div className="text-sm font-medium mt-0.5">{selectedSkill.model || 'Inherit session'}</div>
                      </div>
                      <div className="p-3 rounded-lg bg-muted/50">
                        <div className="text-xs text-muted-foreground">User Invocable</div>
                        <div className="text-sm font-medium mt-0.5">{selectedSkill.userInvocable ? 'Yes' : 'No'}</div>
                      </div>
                    </div>

                    {/* Skill Content Preview */}
                    <div>
                      <h4 className="text-sm font-semibold mb-2 flex items-center gap-1.5">
                        <FileText className="h-3.5 w-3.5" /> Content Preview
                      </h4>
                      <div className="rounded-lg border bg-muted/30 p-4">
                        <div className="markdown-content text-sm">
                          <ReactMarkdown>
                            {selectedSkill.content.substring(0, 800)}
                          </ReactMarkdown>
                        </div>
                        {selectedSkill.content.length > 800 && (
                          <button
                            className="text-xs text-primary hover:underline mt-2"
                            onClick={() => setActiveTab('content')}
                          >
                            Read full content →
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="content" className="h-full m-0">
                <ScrollArea className="h-full">
                  <div className="p-6">
                    <div className="rounded-lg border bg-zinc-950 text-zinc-100 p-4 overflow-x-auto">
                      <pre className="text-xs leading-relaxed font-mono whitespace-pre-wrap break-words">
                        {selectedSkill.content}
                      </pre>
                    </div>
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="usage" className="h-full m-0">
                <ScrollArea className="h-full">
                  <div className="p-6 space-y-6">
                    <div>
                      <h4 className="text-sm font-semibold mb-3 flex items-center gap-1.5">
                        <Rocket className="h-3.5 w-3.5" /> Installation
                      </h4>
                      <div className="space-y-3">
                        <div>
                          <p className="text-xs text-muted-foreground mb-1.5">Install via Claude Code CLI:</p>
                          <div className="rounded-lg border bg-muted/50 p-3 font-mono text-xs">
                            <code>claude skill install OneWave-AI/claude-skills/{selectedSkill.slug}</code>
                          </div>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1.5">Or clone the repository:</p>
                          <div className="rounded-lg border bg-muted/50 p-3 font-mono text-xs">
                            <code>git clone https://github.com/OneWave-AI/claude-skills.git ~/.claude/skills</code>
                          </div>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    <div>
                      <h4 className="text-sm font-semibold mb-3 flex items-center gap-1.5">
                        <Zap className="h-3.5 w-3.5" /> Invocation
                      </h4>
                      <p className="text-sm text-muted-foreground mb-3">
                        Skills can be invoked in two ways in Claude Code:
                      </p>
                      <div className="space-y-3">
                        <div>
                          <p className="text-xs text-muted-foreground mb-1.5">Explicit invocation with slash command:</p>
                          <div className="rounded-lg border bg-muted/50 p-3 font-mono text-xs">
                            <code>/{selectedSkill.slug}</code>
                          </div>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1.5">Auto-invocation (Claude triggers based on description match):</p>
                          <div className="rounded-lg border bg-muted/50 p-3 text-xs text-muted-foreground">
                            When your task matches the skill description, Claude Code will automatically load this skill as a system prompt.
                          </div>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    <div>
                      <h4 className="text-sm font-semibold mb-3 flex items-center gap-1.5">
                        <Wrench className="h-3.5 w-3.5" /> Required Tools
                      </h4>
                      {selectedSkill.tools ? (
                        <div className="flex flex-wrap gap-1.5">
                          {selectedSkill.tools.split(',').map((tool: string) => (
                            <Badge key={tool.trim()} variant="outline" className="text-xs">
                              {tool.trim()}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">No tool restrictions — inherits all available tools from the session.</p>
                      )}
                    </div>

                    <Separator />

                    <div>
                      <h4 className="text-sm font-semibold mb-3 flex items-center gap-1.5">
                        <Globe className="h-3.5 w-3.5" /> Source Repository
                      </h4>
                      <a
                        href={`https://github.com/OneWave-AI/claude-skills/tree/main/${selectedSkill.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
                      >
                        <Github className="h-3.5 w-3.5" />
                        View on GitHub
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  </div>
                </ScrollArea>
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </SheetContent>
    </Sheet>
  );
}

// Submit skill dialog
function SubmitSkillDialog() {
  const { submitOpen, setSubmitOpen, categories, fetchSkills } = useSkillStore();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    content: '',
    tools: '',
    model: '',
    categorySlug: '',
    tags: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!formData.name || !formData.description || !formData.content || !formData.categorySlug) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    try {
      const tags = formData.tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      const res = await fetch('/api/skills/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          tags,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to submit skill');
      }

      toast.success('Skill submitted successfully!');
      setSubmitOpen(false);
      setFormData({ name: '', description: '', content: '', tools: '', model: '', categorySlug: '', tags: '' });
      fetchSkills();
    } catch (error: any) {
      toast.error(error.message || 'Failed to submit skill');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={submitOpen} onOpenChange={setSubmitOpen}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5 text-primary" />
            Submit a New Skill
          </DialogTitle>
          <DialogDescription>
            Add a new skill to the MARQ AI Skills Platform. Your skill will be a self-contained SKILL.md file with YAML frontmatter.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="flex-1 -mx-6 px-6">
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="skill-name">Skill Name *</Label>
                <Input
                  id="skill-name"
                  placeholder="e.g. my-awesome-skill"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="skill-category">Category *</Label>
                <Select
                  value={formData.categorySlug}
                  onValueChange={(v) => setFormData({ ...formData, categorySlug: v })}
                >
                  <SelectTrigger id="skill-category">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.slug} value={cat.slug}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="skill-description">Description *</Label>
              <Input
                id="skill-description"
                placeholder="What does this skill do? When should it be triggered?"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="skill-tools">Required Tools</Label>
                <Input
                  id="skill-tools"
                  placeholder="e.g. Read, Write, Bash"
                  value={formData.tools}
                  onChange={(e) => setFormData({ ...formData, tools: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="skill-model">Model Override</Label>
                <Input
                  id="skill-model"
                  placeholder="e.g. inherit, claude-3-opus"
                  value={formData.model}
                  onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="skill-tags">Tags (comma-separated)</Label>
              <Input
                id="skill-tags"
                placeholder="e.g. ai agents, automation, coding"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="skill-content">SKILL.md Content *</Label>
              <Textarea
                id="skill-content"
                placeholder={`---\nname: my-skill\ndescription: What it does...\ntools: Read, Write, Bash\n---\n\n# Skill Instructions\n\nYour skill prompt content here...`}
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                className="min-h-[200px] font-mono text-xs"
              />
            </div>
          </div>
        </ScrollArea>
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="outline" onClick={() => setSubmitOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting} className="gap-1.5">
            {isSubmitting ? (
              <>Submitting...</>
            ) : (
              <>
                <Send className="h-3.5 w-3.5" /> Submit Skill
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Main page component
export default function Home() {
  const {
    skills, categories, searchQuery, selectedCategory, sortBy, currentPage, totalPages, total,
    isLoading, view, fetchSkills, fetchCategories, setSearchQuery, setSelectedCategory,
    setSortBy, setCurrentPage, setView, setSelectedSkill, setDetailOpen, setSubmitOpen,
  } = useSkillStore();

  const [localSearch, setLocalSearch] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [allTags, setAllTags] = useState<any[]>([]);

  // Fetch categories and tags on mount
  useEffect(() => {
    fetchCategories();
    fetch('/api/tags').then(r => r.json()).then(d => setAllTags(d.tags || [])).catch(console.error);
  }, []);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(localSearch);
    }, 300);
    return () => clearTimeout(timer);
  }, [localSearch, setSearchQuery]);

  // Fetch skills when filters change
  useEffect(() => {
    fetchSkills();
  }, [searchQuery, selectedCategory, sortBy, currentPage]);

  const handleSkillClick = (skill: any) => {
    setSelectedSkill(skill);
    setDetailOpen(true);
  };

  const featuredSkills = useMemo(() => skills.filter((s) => s.featured), [skills]);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Navigation Bar */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
                <Zap className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-lg font-bold tracking-tight">
                  MARQ <span className="text-primary">AI Skills</span>
                </h1>
              </div>
            </div>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-6">
              <a href="#browse" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Browse
              </a>
              <a href="#categories" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Categories
              </a>
              <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setSubmitOpen(true)}>
                <Plus className="h-3.5 w-3.5" /> Submit Skill
              </Button>
              <Button variant="ghost" size="icon" asChild>
                <a href="https://github.com/pmkshar/marqaiskills" target="_blank" rel="noopener noreferrer">
                  <Github className="h-4 w-4" />
                </a>
              </Button>
            </nav>

            {/* Mobile menu */}
            <div className="flex md:hidden items-center gap-2">
              <Button variant="ghost" size="icon" asChild>
                <a href="https://github.com/pmkshar/marqaiskills" target="_blank" rel="noopener noreferrer">
                  <Github className="h-4 w-4" />
                </a>
              </Button>
              <Button variant="outline" size="sm" className="gap-1" onClick={() => setSubmitOpen(true)}>
                <Plus className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden border-b">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-3xl mx-auto"
          >
            <Badge variant="outline" className="mb-4 gap-1.5 px-3 py-1 text-primary border-primary/30">
              <Sparkles className="h-3 w-3" /> Production-Ready AI Skills
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-4">
              Build Faster with{' '}
              <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                MARQ AI Skills
              </span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-8 leading-relaxed">
              170+ production-ready skills for AI agents — from sales automation to code review,
              security auditing to creative design. Browse, discover, and deploy instantly.
            </p>

            {/* Stats */}
            <div className="flex items-center justify-center gap-8 md:gap-12 mb-8">
              <StatCounter value={174} label="Skills" />
              <StatCounter value={12} label="Categories" />
              <StatCounter value={23} label="Tags" />
            </div>

            {/* Search Bar */}
            <div className="relative max-w-2xl mx-auto">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search skills by name, description, or category..."
                value={localSearch}
                onChange={(e) => setLocalSearch(e.target.value)}
                className="pl-12 pr-4 h-12 text-base rounded-xl border-primary/20 focus-visible:border-primary shadow-sm"
              />
              {localSearch && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8"
                  onClick={() => { setLocalSearch(''); setSearchQuery(''); }}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Category Filter Strip */}
      <section id="categories" className="border-b bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollArea className="w-full whitespace-nowrap py-3">
            <div className="flex items-center gap-2 inline-flex min-w-full">
              <Button
                variant={selectedCategory === '' ? 'default' : 'outline'}
                size="sm"
                className="gap-1.5 rounded-full flex-shrink-0"
                onClick={() => setSelectedCategory('')}
              >
                <LayoutGrid className="h-3.5 w-3.5" /> All
              </Button>
              {categories.map((cat) => (
                <Button
                  key={cat.slug}
                  variant={selectedCategory === cat.slug ? 'default' : 'outline'}
                  size="sm"
                  className="gap-1.5 rounded-full flex-shrink-0"
                  onClick={() => setSelectedCategory(selectedCategory === cat.slug ? '' : cat.slug)}
                  style={selectedCategory === cat.slug ? {
                    backgroundColor: cat.color || undefined,
                    borderColor: cat.color || undefined,
                  } : {}}
                >
                  {getCategoryIcon(cat.icon)}
                  <span className="hidden sm:inline">{cat.name}</span>
                  <span className="sm:hidden">{cat.name.split(' ')[0]}</span>
                  <span className="text-[10px] opacity-70">({cat._count?.skills || 0})</span>
                </Button>
              ))}
            </div>
          </ScrollArea>
        </div>
      </section>

      {/* Main Content */}
      <main id="browse" className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Toolbar */}
        <div className="flex items-center justify-between mb-6 gap-4">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold hidden sm:block">
              {selectedCategory
                ? categories.find((c) => c.slug === selectedCategory)?.name || 'Skills'
                : 'All Skills'}
            </h2>
            <Badge variant="secondary" className="text-xs">
              {total} skill{total !== 1 ? 's' : ''}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[140px] h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="featured">Featured First</SelectItem>
                <SelectItem value="name">Name (A-Z)</SelectItem>
                <SelectItem value="newest">Newest</SelectItem>
              </SelectContent>
            </Select>
            <div className="hidden sm:flex items-center border rounded-md">
              <Button
                variant={view === 'grid' ? 'secondary' : 'ghost'}
                size="icon"
                className="h-8 w-8 rounded-r-none"
                onClick={() => setView('grid')}
              >
                <Grid3X3 className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant={view === 'list' ? 'secondary' : 'ghost'}
                size="icon"
                className="h-8 w-8 rounded-l-none"
                onClick={() => setView('list')}
              >
                <List className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>

        {/* Active Filters */}
        {(searchQuery || selectedCategory) && (
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            {searchQuery && (
              <Badge variant="secondary" className="gap-1 px-2.5 py-1">
                <Search className="h-3 w-3" /> &quot;{searchQuery}&quot;
                <X className="h-3 w-3 cursor-pointer" onClick={() => { setLocalSearch(''); setSearchQuery(''); }} />
              </Badge>
            )}
            {selectedCategory && (
              <Badge variant="secondary" className="gap-1 px-2.5 py-1">
                {categories.find((c) => c.slug === selectedCategory)?.name}
                <X className="h-3 w-3 cursor-pointer" onClick={() => setSelectedCategory('')} />
              </Badge>
            )}
            <Button variant="ghost" size="sm" className="text-xs h-6" onClick={() => { setLocalSearch(''); setSearchQuery(''); setSelectedCategory(''); }}>
              Clear all
            </Button>
          </div>
        )}

        {/* Skills Grid / List */}
        {isLoading ? (
          <div className={view === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4' : 'space-y-2'}>
            {Array.from({ length: 8 }).map((_, i) => (
              <SkillCardSkeleton key={i} view={view} />
            ))}
          </div>
        ) : skills.length === 0 ? (
          <div className="text-center py-16">
            <Search className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No skills found</h3>
            <p className="text-muted-foreground mb-4">
              Try adjusting your search or filter criteria
            </p>
            <Button variant="outline" onClick={() => { setLocalSearch(''); setSearchQuery(''); setSelectedCategory(''); }}>
              Clear filters
            </Button>
          </div>
        ) : (
          <motion.div
            className={view === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4' : 'space-y-2'}
            layout
          >
            <AnimatePresence mode="popLayout">
              {skills.map((skill) => (
                <SkillCard
                  key={skill.id}
                  skill={skill}
                  onClick={() => handleSkillClick(skill)}
                  view={view}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-8">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage(currentPage - 1)}
              className="gap-1"
            >
              <ChevronLeft className="h-4 w-4" /> Previous
            </Button>
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                let pageNum: number;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                return (
                  <Button
                    key={pageNum}
                    variant={currentPage === pageNum ? 'default' : 'outline'}
                    size="sm"
                    className="w-8 h-8 p-0"
                    onClick={() => setCurrentPage(pageNum)}
                  >
                    {pageNum}
                  </Button>
                );
              })}
            </div>
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage(currentPage + 1)}
              className="gap-1"
            >
              Next <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t bg-muted/30 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center">
                  <Zap className="h-4 w-4 text-primary-foreground" />
                </div>
                <span className="font-bold">MARQ AI Skills</span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                A comprehensive platform of 170+ production-ready AI skills for business,
                engineering, marketing, and more. Built on the claude-skills framework.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-sm mb-3">Resources</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <a href="https://github.com/OneWave-AI/claude-skills" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors inline-flex items-center gap-1">
                    <Github className="h-3 w-3" /> Source Repository
                  </a>
                </li>
                <li>
                  <a href="https://github.com/pmkshar/marqaiskills" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors inline-flex items-center gap-1">
                    <Github className="h-3 w-3" /> MARQ AI Skills Repo
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-foreground transition-colors inline-flex items-center gap-1">
                    <BookOpen className="h-3 w-3" /> Documentation
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-sm mb-3">Categories</h4>
              <div className="flex flex-wrap gap-1.5">
                {categories.slice(0, 6).map((cat) => (
                  <Badge
                    key={cat.slug}
                    variant="outline"
                    className="text-xs cursor-pointer hover:bg-muted"
                    onClick={() => setSelectedCategory(cat.slug)}
                  >
                    {cat.name}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
          <Separator className="my-6" />
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <p>&copy; 2025 MARQ AI Skills Platform. Based on OneWave AI claude-skills.</p>
            <p className="hidden sm:block">MIT License</p>
          </div>
        </div>
      </footer>

      {/* Skill Detail Panel */}
      <SkillDetailPanel />

      {/* Submit Skill Dialog */}
      <SubmitSkillDialog />
    </div>
  );
}
