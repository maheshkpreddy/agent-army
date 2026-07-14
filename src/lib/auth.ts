import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { isVercel, memoryStore } from './memory-store';

let db: any = null;
try {
  if (!isVercel()) {
    const { db: prismaDb } = require('@/lib/db');
    db = prismaDb;
  }
} catch (e) {}

// Simple credentials for Vercel (in-memory mode)
const SIMPLE_CREDENTIALS: Record<string, { password: string; name: string; role: string; avatar: string; department: string }> = {
  'admin@marq.ai': { password: 'MARQ@admin2024', name: 'MARQ Admin', role: 'admin', avatar: '👑', department: 'Executive' },
  'manager@marq.ai': { password: 'MARQ@manager2024', name: 'Sarah Mitchell', role: 'manager', avatar: '📋', department: 'Operations' },
  'developer@marq.ai': { password: 'MARQ@dev2024', name: 'Alex Chen', role: 'developer', avatar: '💻', department: 'Engineering' },
  'analyst@marq.ai': { password: 'MARQ@analyst2024', name: 'Priya Sharma', role: 'analyst', avatar: '📊', department: 'Analytics' },
  'operator@marq.ai': { password: 'MARQ@operator2024', name: 'James Rodriguez', role: 'operator', avatar: '🔧', department: 'Infrastructure' },
  'viewer@marq.ai': { password: 'MARQ@viewer2024', name: 'Emily Watson', role: 'viewer', avatar: '👁️', department: 'Stakeholder' },
};

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email and password are required');
        }

        // Vercel mode: simple credential check
        if (isVercel() || !db) {
          const cred = SIMPLE_CREDENTIALS[credentials.email];
          if (!cred || cred.password !== credentials.password) {
            throw new Error('Invalid credentials');
          }

          return {
            id: `user_${credentials.email.split('@')[0]}`,
            email: credentials.email,
            name: cred.name,
            role: cred.role,
            avatar: cred.avatar,
            department: cred.department,
          };
        }

        // Database mode
        try {
          const user = await db.user.findUnique({
            where: { email: credentials.email },
          });

          if (!user || !user.isActive) {
            throw new Error('Invalid credentials or account disabled');
          }

          const isValid = await bcrypt.compare(credentials.password, user.password);
          if (!isValid) {
            throw new Error('Invalid credentials');
          }

          await db.user.update({
            where: { id: user.id },
            data: { lastLogin: new Date() },
          });

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            avatar: user.avatar,
            department: user.department,
          };
        } catch (error: any) {
          if (error.message === 'Invalid credentials' || error.message === 'Invalid credentials or account disabled') {
            throw error;
          }
          // Fallback to simple credentials if DB fails
          const cred = SIMPLE_CREDENTIALS[credentials.email];
          if (!cred || cred.password !== credentials.password) {
            throw new Error('Invalid credentials');
          }
          return {
            id: `user_${credentials.email.split('@')[0]}`,
            email: credentials.email,
            name: cred.name,
            role: cred.role,
            avatar: cred.avatar,
            department: cred.department,
          };
        }
      },
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60,
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role;
        token.avatar = (user as any).avatar;
        token.department = (user as any).department;
        token.userId = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).role = token.role;
        (session.user as any).avatar = token.avatar;
        (session.user as any).department = token.department;
        (session.user as any).id = token.userId;
      }
      return session;
    },
  },
  pages: {
    signIn: '/auth/login',
  },
  secret: process.env.NEXTAUTH_SECRET || 'marq-ai-agent-tribe-secret-key-2024',
};

// Role-based access control for agent types
export const ROLE_AGENT_ACCESS: Record<string, string[]> = {
  admin: ['development', 'testing', 'business-analysis', 'sales', 'implementation', 'data-analysis', 'system-admin', 'support'],
  manager: ['development', 'testing', 'business-analysis', 'sales', 'implementation', 'data-analysis', 'system-admin', 'support'],
  developer: ['development', 'testing', 'data-analysis'],
  analyst: ['business-analysis', 'data-analysis', 'sales'],
  operator: ['implementation', 'system-admin', 'support'],
  viewer: ['development', 'testing', 'business-analysis', 'sales', 'implementation', 'data-analysis', 'system-admin', 'support'],
};

export const ROLE_PERMISSIONS: Record<string, {
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

export const ROLE_LABELS: Record<string, string> = {
  admin: 'Administrator',
  manager: 'Manager',
  developer: 'Developer',
  analyst: 'Analyst',
  operator: 'Operator',
  viewer: 'Viewer',
};

export const ROLE_COLORS: Record<string, string> = {
  admin: '#EF4444',
  manager: '#F59E0B',
  developer: '#10B981',
  analyst: '#3B82F6',
  operator: '#06B6D4',
  viewer: '#64748B',
};
