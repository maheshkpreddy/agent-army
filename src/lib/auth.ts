import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { db } from './db';

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

        // Update last login
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
      },
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60, // 24 hours
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
