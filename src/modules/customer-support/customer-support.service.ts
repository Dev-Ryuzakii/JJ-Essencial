import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { SupabaseConfig } from '../../config/supabase.config';

type ChatStatus = 'OPEN' | 'IN_PROGRESS' | 'CLOSED';
type ChatPriority = 'LOW' | 'MEDIUM' | 'HIGH';

export interface CreateSupportChatDto {
  subject: string;
  priority?: ChatPriority;
  initialMessage: string;
}

export interface CreateChatMessageDto {
  chatId: string;
  message: string;
  isFromSupport?: boolean;
}

export interface UpdateChatStatusDto {
  status: ChatStatus;
}

@Injectable()
export class CustomerSupportService {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = SupabaseConfig.getInstance();
  }

  async createSupportChat(userId: string, dto: CreateSupportChatDto) {
    // First create the chat
    const { data: chat, error: chatError } = await this.supabase
      .from('support_chat')
      .insert([{
        user_id: userId,
        subject: dto.subject,
        priority: dto.priority || 'MEDIUM',
        status: 'OPEN',
      }])
      .select('*, user:users(id, email, full_name)')
      .single();

    if (chatError || !chat) {
      throw new Error('Failed to create support chat');
    }

    // Then create the initial message
    const { data: message, error: messageError } = await this.supabase
      .from('chat_message')
      .insert([{
        chat_id: chat.id,
        sender_id: userId,
        message: dto.initialMessage,
        is_admin: false,
      }])
      .select('*, sender:users(id, email, full_name)')
      .single();

    if (messageError) {
      // Should probably delete the chat in this case
      throw new Error('Failed to create initial message');
    }

    return {
      ...chat,
      messages: [message],
    };
  }

  async addMessageToChat(userId: string, dto: CreateChatMessageDto) {
    // Verify chat exists and user has access
    const { data: chat, error: chatError } = await this.supabase
      .from('support_chat')
      .select('*, user:users!inner(*)')
      .eq('id', dto.chatId)
      .single();

    if (!chat || chatError) {
      throw new NotFoundException('Chat not found');
    }

    // Users can only message their own chats (unless they're support)
    if (chat.user_id !== userId && !dto.isFromSupport) {
      throw new ForbiddenException('Access denied to this chat');
    }

    const { data: message, error: messageError } = await this.supabase
      .from('chat_message')
      .insert([{
        chat_id: dto.chatId,
        sender_id: userId,
        message: dto.message,
        is_admin: dto.isFromSupport || false,
      }])
      .select('*, sender:users(id, email, full_name)')
      .single();

    if (messageError || !message) {
      throw new Error('Failed to create message');
    }

    return message;
  }

  async getUserChats(userId: string) {
    const { data: chats, error } = await this.supabase
      .from('support_chat')
      .select(`
        *,
        messages:chat_message(
          *,
          sender:users(id, email, full_name)
        ),
        messageCount:chat_message(count)
      `)
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });

    if (error) {
      throw new Error('Failed to fetch user chats');
    }

    // Transform the data to match the previous format
    return chats.map(chat => ({
      ...chat,
      messages: chat.messages.slice(0, 1), // Only keep the latest message
      _count: {
        messages: chat.messageCount,
      },
    }));
  }

  async getChatDetails(chatId: string, userId?: string) {
    const { data: chat, error } = await this.supabase
      .from('support_chat')
      .select(`
        *,
        user:users(id, email, full_name),
        messages:chat_message(
          *,
          sender:users(id, email, full_name)
        )
      `)
      .eq('id', chatId)
      .order('messages.created_at', { referencedTable: 'chat_message', ascending: true })
      .single();

    if (!chat || error) {
      throw new NotFoundException('Chat not found');
    }

    // If userId provided, check access (users can only see their own chats)
    if (userId && chat.user_id !== userId) {
      throw new ForbiddenException('Access denied to this chat');
    }

    return chat;
  }

  async updateChatStatus(chatId: string, dto: UpdateChatStatusDto) {
    const { data, error } = await this.supabase
      .from('support_chat')
      .update({ status: dto.status })
      .eq('id', chatId)
      .select('*, user:users(id, email, full_name)')
      .single();

    if (error || !data) {
      throw new Error('Failed to update chat status');
    }

    return data;
  }

  async getAllChats(
    page: number = 1,
    limit: number = 20,
    status?: ChatStatus,
    priority?: ChatPriority,
  ) {
    const start = (page - 1) * limit;
    const end = start + limit - 1;

    let query = this.supabase
      .from('support_chat')
      .select(`
        *,
        user:users(id, email, full_name),
        messages:chat_message(
          *,
          sender:users(id, email, full_name)
        ),
        messageCount:chat_message(count)
      `, { count: 'exact' });

    if (status) query = query.eq('status', status);
    if (priority) query = query.eq('priority', priority);

    query = query
      .order('updated_at', { ascending: false })
      .range(start, end);

    const { data: chats, count: total, error } = await query;

    return {
      chats,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getChatStats() {
    try {
      const [
        { count: totalChats },
        { count: openChats },
        { count: inProgressChats },
        { count: closedChats },
        { count: highPriorityChats },
        { data: priorityStats, error: priorityError },
      ] = await Promise.all([
        this.supabase
          .from('support_chat')
          .select('*', { count: 'exact', head: true }),
        this.supabase
          .from('support_chat')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'OPEN'),
        this.supabase
          .from('support_chat')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'IN_PROGRESS'),
        this.supabase
          .from('support_chat')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'CLOSED'),
        this.supabase
          .from('support_chat')
          .select('*', { count: 'exact', head: true })
          .eq('priority', 'HIGH'),
        // Get priority distribution manually
        this.supabase
          .from('support_chat')
          .select('priority')
          .not('priority', 'is', null),
      ]);

      // Safely process priority stats
      const chatsByPriority: Record<string, number> = {};
      if (priorityStats && Array.isArray(priorityStats)) {
        const priorityCounts: Record<string, number> = priorityStats.reduce((acc, chat) => {
          const priority = chat.priority || 'MEDIUM';
          acc[priority] = (acc[priority] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);
        
        // Set default values for all priorities
        chatsByPriority.LOW = priorityCounts.LOW || 0;
        chatsByPriority.MEDIUM = priorityCounts.MEDIUM || 0;
        chatsByPriority.HIGH = priorityCounts.HIGH || 0;
      } else {
        // Default values if query fails
        chatsByPriority.LOW = 0;
        chatsByPriority.MEDIUM = 0;
        chatsByPriority.HIGH = 0;
      }

      return {
        totalChats: totalChats || 0,
        openChats: openChats || 0,
        inProgressChats: inProgressChats || 0,
        closedChats: closedChats || 0,
        highPriorityChats: highPriorityChats || 0,
        chatsByPriority,
      };
    } catch (error) {
      console.error('Error getting chat stats:', error);
      // Return default stats if there's an error
      return {
        totalChats: 0,
        openChats: 0,
        inProgressChats: 0,
        closedChats: 0,
        highPriorityChats: 0,
        chatsByPriority: {
          LOW: 0,
          MEDIUM: 0,
          HIGH: 0,
        },
      };
    }
  }

  async assignChatToSupport(chatId: string, supportUserId: string) {
    const { data, error } = await this.supabase
      .from('support_chat')
      .update({
        assigned_to: supportUserId,
        status: 'IN_PROGRESS',
      })
      .eq('id', chatId)
      .select('*, user:users(id, email, full_name)')
      .single();

    if (error || !data) {
      throw new Error('Failed to assign chat to support');
    }

    return data;
  }
}
