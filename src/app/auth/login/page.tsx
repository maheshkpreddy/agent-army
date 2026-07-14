'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield, Eye, EyeOff, LogIn, Users, Bot, Zap,
  ArrowRight, Lock, Mail, AlertCircle, Loader2, Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

const ROLE_PREVIEW = [
  { role: 'admin', label: 'Administrator', desc: 'Full access to all agents + user management', color: '#EF4444', icon: '👑' },
  { role: 'manager', label: 'Manager', desc: 'Access to all agents, analytics & reporting', color: '#F59E0B', icon: '📋' },
  { role: 'developer', label: 'Developer', desc: 'Dev, Test & Data agents', color: '#10B981', icon: '💻' },
  { role: 'analyst', label: 'Analyst', desc: 'BA, Data & Sales agents', color: '#3B82F6', icon: '📊' },
  { role: 'operator', label: 'Operator', desc: 'Impl, SysAdmin & Support agents', color: '#06B6D4', icon: '🔧' },
  { role: 'viewer', label: 'Viewer', desc: 'Read-only access to all agents', color: '#64748B', icon: '👁️' },
];

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [seeding, setSeeding] = useState(false);

  useEffect(() => {
    // Auto-seed users on first visit
    seedUsers();
  }, []);

  const seedUsers = async () => {
    try {
      setSeeding(true);
      await fetch('/api/auth/seed', { method: 'POST' });
    } catch (e) {
      // Users may already exist
    } finally {
      setSeeding(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/callback/credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          email,
          password,
          callbackUrl: '/',
          json: 'true',
        }),
      });

      const data = await res.json();

      if (data.error) {
        setError('Invalid email or password. Please try again.');
        toast.error('Login failed', { description: 'Invalid credentials' });
      } else if (data.url) {
        toast.success('Welcome to MARQ AI Agent TRIBE!');
        window.location.href = data.url || '/';
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
      toast.error('Login error');
    } finally {
      setLoading(false);
    }
  };

  const quickLogin = (roleEmail: string, rolePassword: string) => {
    setEmail(roleEmail);
    setPassword(rolePassword);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-teal-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute w-[600px] h-[600px] rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #0d9488 0%, transparent 70%)', top: '-200px', right: '-100px' }}
          animate={{ scale: [1, 1.2, 1], opacity: [0.05, 0.12, 0.05] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute w-[500px] h-[500px] rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #06b6d4 0%, transparent 70%)', bottom: '-150px', left: '-100px' }}
          animate={{ scale: [1.1, 1, 1.1], opacity: [0.08, 0.14, 0.08] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute w-[300px] h-[300px] rounded-full opacity-8"
          style={{ background: 'radial-gradient(circle, #f59e0b 0%, transparent 70%)', top: '40%', left: '10%' }}
          animate={{ scale: [1, 1.15, 1], opacity: [0.04, 0.1, 0.04] }}
          transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
        />
        {/* Grid lines */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }} />
      </div>

      <div className="relative z-10 w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left: Branding */}
        <motion.div
          initial={{ opacity: 0, x: -40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="flex flex-col justify-center space-y-8"
        >
          {/* Logo & Title */}
          <div className="space-y-4">
            <motion.div
              className="flex items-center gap-3"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-teal-500/25">
                <Bot className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white tracking-tight">
                  MARQ <span className="text-teal-400">AI</span>
                </h1>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <h2 className="text-5xl font-black text-white leading-tight">
                Agent <span className="bg-gradient-to-r from-teal-400 via-cyan-400 to-emerald-400 bg-clip-text text-transparent">TRIBE</span>
              </h2>
              <p className="text-lg text-slate-400 mt-3 leading-relaxed">
                Your AI workforce, deployed and ready. 8 specialized agents working across development, testing, business analysis, and more.
              </p>
            </motion.div>
          </div>

          {/* Stats */}
          <motion.div
            className="grid grid-cols-3 gap-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            {[
              { icon: Bot, label: '8 Agents', value: 'Ready' },
              { icon: Zap, label: '24/7', value: 'Active' },
              { icon: Users, label: '6 Roles', value: 'Secure' },
            ].map((stat, i) => (
              <div key={i} className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 text-center">
                <stat.icon className="w-5 h-5 text-teal-400 mx-auto mb-2" />
                <p className="text-white font-semibold text-sm">{stat.label}</p>
                <p className="text-teal-400 text-xs">{stat.value}</p>
              </div>
            ))}
          </motion.div>

          {/* Role Preview */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="space-y-2"
          >
            <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Role-Based Access</p>
            <div className="grid grid-cols-2 gap-2">
              {ROLE_PREVIEW.map((rp) => (
                <div key={rp.role} className="flex items-center gap-2 bg-white/5 border border-white/5 rounded-lg px-3 py-2">
                  <span className="text-base">{rp.icon}</span>
                  <div>
                    <p className="text-white text-xs font-medium">{rp.label}</p>
                    <p className="text-slate-500 text-[10px]">{rp.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </motion.div>

        {/* Right: Login Form */}
        <motion.div
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <Card className="bg-slate-900/80 backdrop-blur-xl border-slate-700/50 shadow-2xl shadow-teal-500/5">
            <CardHeader className="pb-4 pt-8 px-8">
              <div className="text-center space-y-2">
                <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-teal-500/25 mb-4">
                  <Shield className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-white">Welcome Back</h3>
                <p className="text-slate-400 text-sm">Sign in to MARQ AI Agent TRIBE</p>
              </div>
            </CardHeader>

            <CardContent className="px-8 pb-8 space-y-6">
              {/* Error message */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 flex items-center gap-2"
                  >
                    <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                    <p className="text-red-400 text-sm">{error}</p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Login Form */}
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm text-slate-300 font-medium flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5" />
                    Email Address
                  </label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@marq.ai"
                    className="bg-slate-800/50 border-slate-600/50 text-white placeholder:text-slate-500 h-11 focus:ring-teal-500/50 focus:border-teal-500/50"
                    autoComplete="email"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm text-slate-300 font-medium flex items-center gap-2">
                    <Lock className="w-3.5 h-3.5" />
                    Password
                  </label>
                  <div className="relative">
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      className="bg-slate-800/50 border-slate-600/50 text-white placeholder:text-slate-500 h-11 pr-10 focus:ring-teal-500/50 focus:border-teal-500/50"
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={loading || seeding}
                  className="w-full h-11 bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 text-white font-semibold shadow-lg shadow-teal-500/25 transition-all duration-200"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    <>
                      <LogIn className="w-4 h-4 mr-2" />
                      Sign In to TRIBE
                    </>
                  )}
                </Button>
              </form>

              {/* Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-700/50" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-slate-900 px-3 text-slate-500">Quick Access</span>
                </div>
              </div>

              {/* Quick Login Buttons */}
              <div className="space-y-2">
                <p className="text-xs text-slate-500 mb-2">Click to auto-fill credentials:</p>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: 'Admin', email: 'admin@marq.ai', password: 'MARQ@admin2024', icon: '👑', color: 'from-red-500/20 to-red-600/20 border-red-500/30' },
                    { label: 'Manager', email: 'manager@marq.ai', password: 'MARQ@manager2024', icon: '📋', color: 'from-amber-500/20 to-amber-600/20 border-amber-500/30' },
                    { label: 'Developer', email: 'developer@marq.ai', password: 'MARQ@dev2024', icon: '💻', color: 'from-emerald-500/20 to-emerald-600/20 border-emerald-500/30' },
                    { label: 'Analyst', email: 'analyst@marq.ai', password: 'MARQ@analyst2024', icon: '📊', color: 'from-blue-500/20 to-blue-600/20 border-blue-500/30' },
                    { label: 'Operator', email: 'operator@marq.ai', password: 'MARQ@operator2024', icon: '🔧', color: 'from-cyan-500/20 to-cyan-600/20 border-cyan-500/30' },
                    { label: 'Viewer', email: 'viewer@marq.ai', password: 'MARQ@viewer2024', icon: '👁️', color: 'from-slate-500/20 to-slate-600/20 border-slate-500/30' },
                  ].map((ql) => (
                    <button
                      key={ql.label}
                      type="button"
                      onClick={() => quickLogin(ql.email, ql.password)}
                      className={`bg-gradient-to-r ${ql.color} border rounded-lg px-3 py-2 flex items-center gap-2 hover:scale-[1.02] transition-transform`}
                    >
                      <span className="text-sm">{ql.icon}</span>
                      <span className="text-white text-xs font-medium">{ql.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Footer */}
              <div className="text-center pt-2">
                <p className="text-[11px] text-slate-600">
                  MARQ AI Agent TRIBE v1.0 — Secure Role-Based Access
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
