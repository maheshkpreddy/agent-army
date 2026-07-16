import { NextRequest, NextResponse } from 'next/server';
import { isVercel, memoryStore } from '@/lib/memory-store';

let db: any = null;
try {
  if (!isVercel()) {
    const { db: prismaDb } = require('@/lib/db');
    db = prismaDb;
  }
} catch (e) {}

// GET /api/agents/conversations - List conversations
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const agentId = url.searchParams.get('agentId');
    const userId = url.searchParams.get('userId');
    const status = url.searchParams.get('status'); // 'active', 'archived'
    const conversationId = url.searchParams.get('conversationId');
    const adminMode = url.searchParams.get('admin') === 'true';

    // If requesting a specific conversation's messages
    if (conversationId) {
      const messages = memoryStore.getConversationMessages(conversationId);
      const conv = memoryStore.getConversationById(conversationId);
      return NextResponse.json({ conversation: conv, messages }, {
        headers: { 'Cache-Control': 'private, max-age=5' },
      });
    }

    // Admin mode: get ALL conversations + messages including deleted
    if (adminMode) {
      const allConversations = memoryStore.getAllConversations();
      const allMessages = memoryStore.getAllMessages(true); // include deleted

      // Build summary with user info
      const users = memoryStore.getAllUsers();
      const agents = memoryStore.getAgents();

      const enrichedConversations = allConversations.map(conv => {
        const user = users.find(u => u.id === conv.userId);
        const agent = agents.find(a => a.id === conv.agentId);
        const msgs = allMessages.filter(m => m.conversationId === conv.id);
        const deletedCount = msgs.filter(m => m.deletedAt).length;
        return {
          ...conv,
          userName: user?.name || 'Unknown',
          userEmail: user?.email || '',
          userRole: user?.role || '',
          agentName: agent?.name || 'Unknown',
          agentType: agent?.type || '',
          agentAvatar: agent?.avatar || '',
          totalMessages: msgs.length,
          deletedMessages: deletedCount,
        };
      });

      // Also include "orphaned" deleted conversations (messages without active conversation)
      const orphanedMessages = allMessages.filter(m => {
        const hasConv = allConversations.find(c => c.id === m.conversationId);
        return !hasConv && m.deletedAt;
      });

      const deletedConversationIds = [...new Set(orphanedMessages.map(m => m.conversationId))];
      const deletedConversations = deletedConversationIds.map(convId => {
        const msgs = orphanedMessages.filter(m => m.conversationId === convId);
        const firstMsg = msgs[0];
        const user = users.find(u => u.id === firstMsg?.userId);
        const agent = agents.find(a => a.id === firstMsg?.agentId);
        return {
          id: convId,
          agentId: firstMsg?.agentId || '',
          userId: firstMsg?.userId || '',
          title: 'Deleted Conversation',
          status: 'deleted',
          lastMessageAt: msgs[msgs.length - 1]?.createdAt || '',
          messageCount: msgs.length,
          createdAt: msgs[0]?.createdAt || '',
          updatedAt: msgs[msgs.length - 1]?.createdAt || '',
          userName: user?.name || 'Unknown',
          userEmail: user?.email || '',
          userRole: user?.role || '',
          agentName: agent?.name || 'Unknown',
          agentType: agent?.type || '',
          agentAvatar: agent?.avatar || '',
          totalMessages: msgs.length,
          deletedMessages: msgs.filter(m => m.deletedAt).length,
        };
      });

      return NextResponse.json({
        conversations: [...enrichedConversations, ...deletedConversations],
        totalActive: allConversations.filter(c => c.status === 'active').length,
        totalArchived: allConversations.filter(c => c.status === 'archived').length,
        totalDeleted: deletedConversationIds.length,
      }, {
        headers: { 'Cache-Control': 'private, max-age=5' },
      });
    }

    // Normal mode: get conversations for a specific agent/user
    const conversations = memoryStore.getConversations(agentId || undefined, userId || undefined, status || undefined);

    return NextResponse.json({ conversations }, {
      headers: { 'Cache-Control': 'private, max-age=5' },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/agents/conversations - Create a new conversation
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { agentId, userId, title } = body;

    if (!agentId || !userId) {
      return NextResponse.json({ error: 'agentId and userId are required' }, { status: 400 });
    }

    const conv = memoryStore.createConversation({
      agentId,
      userId,
      title: title || 'New Conversation',
    });

    return NextResponse.json({ conversation: conv });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH /api/agents/conversations - Archive/Unarchive/Delete
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { conversationId, action } = body; // action: 'archive' | 'unarchive' | 'delete'

    if (!conversationId || !action) {
      return NextResponse.json({ error: 'conversationId and action are required' }, { status: 400 });
    }

    if (action === 'archive') {
      const conv = memoryStore.archiveConversation(conversationId);
      if (!conv) return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
      return NextResponse.json({ conversation: conv, message: 'Conversation archived' });
    }

    if (action === 'unarchive') {
      const conv = memoryStore.unarchiveConversation(conversationId);
      if (!conv) return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
      return NextResponse.json({ conversation: conv, message: 'Conversation unarchived' });
    }

    if (action === 'delete') {
      const success = memoryStore.deleteConversation(conversationId);
      if (!success) return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
      return NextResponse.json({ message: 'Conversation deleted (admin can still recover)' });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
