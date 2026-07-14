import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { isVercel, memoryStore } from '@/lib/memory-store';

let db: any = null;
try {
  if (!isVercel()) {
    const { db: prismaDb } = require('@/lib/db');
    db = prismaDb;
  }
} catch (e) {}

// For Vercel: simple password check (no bcrypt on serverless with in-memory)
const SIMPLE_CREDENTIALS: Record<string, { password: string; name: string; role: string; avatar: string; department: string }> = {
  'admin@marq.ai': { password: 'MARQ@admin2024', name: 'MARQ Admin', role: 'admin', avatar: '👑', department: 'Executive' },
  'manager@marq.ai': { password: 'MARQ@manager2024', name: 'Sarah Mitchell', role: 'manager', avatar: '📋', department: 'Operations' },
  'developer@marq.ai': { password: 'MARQ@dev2024', name: 'Alex Chen', role: 'developer', avatar: '💻', department: 'Engineering' },
  'analyst@marq.ai': { password: 'MARQ@analyst2024', name: 'Priya Sharma', role: 'analyst', avatar: '📊', department: 'Analytics' },
  'operator@marq.ai': { password: 'MARQ@operator2024', name: 'James Rodriguez', role: 'operator', avatar: '🔧', department: 'Infrastructure' },
  'viewer@marq.ai': { password: 'MARQ@viewer2024', name: 'Emily Watson', role: 'viewer', avatar: '👁️', department: 'Stakeholder' },
};

export async function POST() {
  try {
    if (isVercel() || !db) {
      const count = memoryStore.seedUsers();
      return NextResponse.json({
        message: 'Users seeded successfully (in-memory)',
        count,
        users: Object.entries(SIMPLE_CREDENTIALS).map(([email, data]) => ({
          email,
          name: data.name,
          role: data.role,
          department: data.department,
        })),
      });
    }

    const existing = await db.user.count();
    if (existing > 0) {
      return NextResponse.json({
        message: 'Users already seeded',
        count: existing,
      });
    }

    const DEFAULT_USERS = [
      { email: 'admin@marq.ai', name: 'MARQ Admin', password: 'MARQ@admin2024', role: 'admin', avatar: '👑', department: 'Executive' },
      { email: 'manager@marq.ai', name: 'Sarah Mitchell', password: 'MARQ@manager2024', role: 'manager', avatar: '📋', department: 'Operations' },
      { email: 'developer@marq.ai', name: 'Alex Chen', password: 'MARQ@dev2024', role: 'developer', avatar: '💻', department: 'Engineering' },
      { email: 'analyst@marq.ai', name: 'Priya Sharma', password: 'MARQ@analyst2024', role: 'analyst', avatar: '📊', department: 'Analytics' },
      { email: 'operator@marq.ai', name: 'James Rodriguez', password: 'MARQ@operator2024', role: 'operator', avatar: '🔧', department: 'Infrastructure' },
      { email: 'viewer@marq.ai', name: 'Emily Watson', password: 'MARQ@viewer2024', role: 'viewer', avatar: '👁️', department: 'Stakeholder' },
    ];

    const hashedPasswords = await Promise.all(
      DEFAULT_USERS.map((u) => bcrypt.hash(u.password, 12))
    );

    await db.user.createMany({
      data: DEFAULT_USERS.map((u, i) => ({
        email: u.email,
        name: u.name,
        password: hashedPasswords[i],
        role: u.role,
        avatar: u.avatar,
        department: u.department,
        isActive: true,
      })),
    });

    return NextResponse.json({
      message: 'Users seeded successfully',
      count: DEFAULT_USERS.length,
      users: DEFAULT_USERS.map((u) => ({ email: u.email, name: u.name, role: u.role, department: u.department })),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET() {
  try {
    if (isVercel() || !db) {
      const users = memoryStore.getAllUsers();
      return NextResponse.json({ users });
    }

    const users = await db.user.findMany({
      select: {
        id: true, email: true, name: true, role: true,
        avatar: true, department: true, isActive: true,
        lastLogin: true, createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json({ users });
  } catch (error: any) {
    const users = memoryStore.getAllUsers();
    return NextResponse.json({ users });
  }
}
