import { Injectable, NotFoundException, ForbiddenException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
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
    // Validate userId
    if (!userId) {
      throw new BadRequestException('User ID is required');
    }

    try {
      // First create the chat
      const { data: chat, error: chatError } = await this.supabase
        .from('support_chat')
        .insert([{
          user_id: userId,
          subject: dto.subject,
          priority: dto.priority || 'MEDIUM',
          status: 'OPEN',
        }])
        .select('*, user:profile!user_id(id, email, full_name)')
        .single();

      if (chatError) {
        // Check if it's a table doesn't exist error
        if (chatError.message.includes('relation') && chatError.message.includes('does not exist')) {
          throw new InternalServerErrorException('Customer support system is not yet set up. Please contact the administrator.');
        }
        // Check for other common database errors
        if (chatError.message.includes('invalid input syntax')) {
          throw new BadRequestException('Invalid data provided for support chat creation');
        }
        throw new InternalServerErrorException(`Failed to create support chat: ${chatError.message}`);
      }

      if (!chat) {
        throw new InternalServerErrorException('Failed to create support chat');
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
        .select('*, sender:profile!sender_id(id, email, full_name)')
        .single();

      if (messageError) {
        // Should probably delete the chat in this case
        await this.supabase.from('support_chat').delete().eq('id', chat.id);
        // Check for common database errors
        if (messageError.message.includes('invalid input syntax')) {
          throw new BadRequestException('Invalid data provided for initial message');
        }
        throw new InternalServerErrorException(`Failed to create initial message: ${messageError.message}`);
      }

      return {
        ...chat,
        messages: [message],
      };
    } catch (error) {
      console.error('Error in createSupportChat:', error);
      // Re-throw NestJS exceptions as-is
      if (error instanceof BadRequestException || 
          error instanceof NotFoundException || 
          error instanceof ForbiddenException || 
          error instanceof InternalServerErrorException) {
        throw error;
      }
      // Wrap other errors
      throw new InternalServerErrorException(`Failed to create support chat: ${error.message}`);
    }
  }

  async addMessageToChat(userId: string, dto: CreateChatMessageDto) {
    // Validate userId
    if (!userId) {
      throw new BadRequestException('User ID is required');
    }

    // Verify chat exists and user has access
    const { data: chat, error: chatError } = await this.supabase
      .from('support_chat')
      .select('*, user:profile!user_id!inner(*)')
      .eq('id', dto.chatId)
      .single();

    if (!chat || chatError) {
      if (chatError && chatError.message.includes('invalid input syntax')) {
        throw new BadRequestException('Invalid chat ID provided');
      }
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
      .select('*, sender:profile!sender_id(id, email, full_name)')
      .single();

    if (messageError || !message) {
      if (messageError && messageError.message.includes('invalid input syntax')) {
        throw new BadRequestException('Invalid data provided for message');
      }
      throw new InternalServerErrorException('Failed to create message');
    }

    return message;
  }

  async getUserChats(userId: string) {
    // Validate userId
    if (!userId) {
      throw new BadRequestException('User ID is required');
    }

    try {
      const { data: chats, error } = await this.supabase
        .from('support_chat')
        .select(`
          *,
          messages:chat_message(
            *,
            sender:profile!sender_id(id, email, full_name)
          ),
          messageCount:chat_message(count)
        `)
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });

      if (error) {
        // Check if it's a table doesn't exist error
        if (error.message.includes('relation') && error.message.includes('does not exist')) {
          console.log('Customer support tables not found. Please create them using the migration script.');
          // Return empty array but with a specific error code that frontend can detect
          throw new InternalServerErrorException('Customer support system is not yet set up');
        }
        if (error.message.includes('invalid input syntax')) {
          throw new BadRequestException('Invalid user ID provided');
        }
        throw new InternalServerErrorException(`Failed to fetch user chats: ${error.message}`);
      }

      // Transform the data to match the previous format
      return chats.map(chat => ({
        ...chat,
        messages: chat.messages ? chat.messages.slice(0, 1) : [], // Only keep the latest message
        _count: {
          messages: chat.messageCount || 0,
        },
      }));
    } catch (error) {
      console.error('Error in getUserChats:', error);
      // Re-throw NestJS exceptions as-is
      if (error instanceof BadRequestException || 
          error instanceof NotFoundException || 
          error instanceof ForbiddenException || 
          error instanceof InternalServerErrorException) {
        throw error;
      }
      // Wrap other errors
      throw new InternalServerErrorException(`Failed to fetch user chats: ${error.message}`);
    }
  }

  async getChatDetails(chatId: string, userId?: string) {
    // Validate chatId
    if (!chatId) {
      throw new BadRequestException('Chat ID is required');
    }

    const { data: chat, error } = await this.supabase
      .from('support_chat')
      .select(`
        *,
        user:profile!user_id(id, email, full_name),
        messages:chat_message(
          *,
          sender:profile!sender_id(id, email, full_name)
        )
      `)
      .eq('id', chatId)
      .order('messages.created_at', { referencedTable: 'chat_message', ascending: true })
      .single();

    if (!chat || error) {
      if (error && error.message.includes('invalid input syntax')) {
        throw new BadRequestException('Invalid chat ID provided');
      }
      throw new NotFoundException('Chat not found');
    }

    // If userId provided, check access (users can only see their own chats)
    if (userId && chat.user_id !== userId) {
      throw new ForbiddenException('Access denied to this chat');
    }

    return chat;
  }

  async updateChatStatus(chatId: string, dto: UpdateChatStatusDto) {
    // Validate chatId
    if (!chatId) {
      throw new BadRequestException('Chat ID is required');
    }

    const { data, error } = await this.supabase
      .from('support_chat')
      .update({ status: dto.status })
      .eq('id', chatId)
      .select('*, user:profile!user_id(id, email, full_name)')
      .single();

    if (error || !data) {
      if (error && error.message.includes('invalid input syntax')) {
        throw new BadRequestException('Invalid data provided for chat status update');
      }
      throw new InternalServerErrorException('Failed to update chat status');
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
        user:profile!user_id(id, email, full_name),
        messages:chat_message(
          *,
          sender:profile!sender_id(id, email, full_name)
        ),
        messageCount:chat_message(count)
      `, { count: 'exact' });

    if (status) query = query.eq('status', status);
    if (priority) query = query.eq('priority', priority);

    query = query
      .order('updated_at', { ascending: false })
      .range(start, end);

    const { data: chats, count: total, error } = await query;

    if (error) {
      if (error.message.includes('relation') && error.message.includes('does not exist')) {
        throw new InternalServerErrorException('Customer support system is not yet set up');
      }
      if (error.message.includes('invalid input syntax')) {
        throw new BadRequestException('Invalid parameters provided for chat listing');
      }
      throw new InternalServerErrorException(`Failed to fetch chats: ${error.message}`);
    }

    const transformedChats = chats.map(chat => ({
      ...chat,
      messages: chat.messages ? [chat.messages[0]] : [], // Only keep the latest message
      _count: {
        messages: chat.messageCount || 0,
      },
    }));

    return {
      chats: transformedChats,
      pagination: {
        page,
        limit,
        total: total || 0,
        totalPages: Math.ceil((total || 0) / limit),
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

      if (priorityError) {
        if (priorityError.message.includes('relation') && priorityError.message.includes('does not exist')) {
          throw new InternalServerErrorException('Customer support system is not yet set up');
        }
        throw new InternalServerErrorException(`Failed to fetch chat stats: ${priorityError.message}`);
      }

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
      // Re-throw NestJS exceptions as-is
      if (error instanceof BadRequestException || 
          error instanceof NotFoundException || 
          error instanceof ForbiddenException || 
          error instanceof InternalServerErrorException) {
        throw error;
      }
      // Wrap other errors
      throw new InternalServerErrorException(`Failed to fetch chat stats: ${error.message}`);
    }
  }

  async assignChatToSupport(chatId: string, supportUserId: string) {
    // Validate parameters
    if (!chatId) {
      throw new BadRequestException('Chat ID is required');
    }
    if (!supportUserId) {
      throw new BadRequestException('Support user ID is required');
    }

    const { data, error } = await this.supabase
      .from('support_chat')
      .update({
        assigned_to: supportUserId,
        status: 'IN_PROGRESS',
      })
      .eq('id', chatId)
      .select('*, user:profile!user_id(id, email, full_name)')
      .single();

    if (error || !data) {
      if (error && error.message.includes('invalid input syntax')) {
        throw new BadRequestException('Invalid IDs provided for chat assignment');
      }
      throw new InternalServerErrorException('Failed to assign chat to support');
    }

    return data;
  }
}