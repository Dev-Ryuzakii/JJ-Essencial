import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

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
  private prisma = new PrismaClient();

  async createSupportChat(userId: string, dto: CreateSupportChatDto) {
    return this.prisma.supportChat.create({
      data: {
        userId,
        subject: dto.subject,
        priority: dto.priority || 'MEDIUM',
        status: 'OPEN',
        messages: {
          create: {
            senderId: userId,
            message: dto.initialMessage,
            isAdmin: false,
          },
        },
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            fullName: true,
          },
        },
        messages: {
          orderBy: { createdAt: 'asc' },
          include: {
            sender: {
              select: {
                id: true,
                email: true,
                fullName: true,
              },
            },
          },
        },
      },
    });
  }

  async addMessageToChat(userId: string, dto: CreateChatMessageDto) {
    // Verify chat exists and user has access
    const chat = await this.prisma.supportChat.findUnique({
      where: { id: dto.chatId },
      include: { user: true },
    });

    if (!chat) {
      throw new NotFoundException('Chat not found');
    }

    // Users can only message their own chats (unless they're support)
    if (chat.userId !== userId && !dto.isFromSupport) {
      throw new ForbiddenException('Access denied to this chat');
    }

    const message = await this.prisma.chatMessage.create({
      data: {
        chatId: dto.chatId,
        senderId: userId,
        message: dto.message,
        isAdmin: dto.isFromSupport || false,
      },
      include: {
        sender: {
          select: {
            id: true,
            email: true,
            fullName: true,
          },
        },
      },
    });

    return message;
  }

  async getUserChats(userId: string) {
    return this.prisma.supportChat.findMany({
      where: { userId },
      include: {
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1, // Only get the latest message for preview
          include: {
            sender: {
              select: {
                id: true,
                email: true,
                fullName: true,
              },
            },
          },
        },
        _count: {
          select: { messages: true },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async getChatDetails(chatId: string, userId?: string) {
    const chat = await this.prisma.supportChat.findUnique({
      where: { id: chatId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            fullName: true,
          },
        },
        messages: {
          orderBy: { createdAt: 'asc' },
          include: {
            sender: {
              select: {
                id: true,
                email: true,
                fullName: true,
              },
            },
          },
        },
      },
    });

    if (!chat) {
      throw new NotFoundException('Chat not found');
    }

    // If userId provided, check access (users can only see their own chats)
    if (userId && chat.userId !== userId) {
      throw new ForbiddenException('Access denied to this chat');
    }

    return chat;
  }

  async updateChatStatus(chatId: string, dto: UpdateChatStatusDto) {
    return this.prisma.supportChat.update({
      where: { id: chatId },
      data: {
        status: dto.status,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            fullName: true,
          },
        },
      },
    });
  }

  async getAllChats(
    page: number = 1,
    limit: number = 20,
    status?: ChatStatus,
    priority?: ChatPriority,
  ) {
    const skip = (page - 1) * limit;
    const where: any = {};

    if (status) where.status = status;
    if (priority) where.priority = priority;

    const [chats, total] = await Promise.all([
      this.prisma.supportChat.findMany({
        where,
        skip,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              fullName: true,
            },
          },
          messages: {
            orderBy: { createdAt: 'desc' },
            take: 1,
            include: {
              sender: {
                select: {
                  id: true,
                  email: true,
                  fullName: true,
                },
              },
            },
          },
          _count: {
            select: { messages: true },
          },
        },
        orderBy: { updatedAt: 'desc' },
      }),
      this.prisma.supportChat.count({ where }),
    ]);

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
    const [
      totalChats,
      openChats,
      inProgressChats,
      closedChats,
      highPriorityChats,
    ] = await Promise.all([
      this.prisma.supportChat.count(),
      this.prisma.supportChat.count({
        where: { status: 'OPEN' },
      }),
      this.prisma.supportChat.count({
        where: { status: 'IN_PROGRESS' },
      }),
      this.prisma.supportChat.count({
        where: { status: 'CLOSED' },
      }),
      this.prisma.supportChat.count({
        where: { priority: 'HIGH' },
      }),
    ]);

    const chatsByPriority = await this.getChatsByPriorityStats();

    return {
      totalChats,
      openChats,
      inProgressChats,
      closedChats,
      highPriorityChats,
      chatsByPriority,
    };
  }

  private async getChatsByPriorityStats() {
    const priorityCounts = await this.prisma.supportChat.groupBy({
      by: ['priority'],
      _count: {
        priority: true,
      },
    });

    return priorityCounts.reduce((acc, curr) => {
      acc[curr.priority] = curr._count.priority;
      return acc;
    }, {} as Record<string, number>);
  }

  async assignChatToSupport(chatId: string, supportUserId: string) {
    return this.prisma.supportChat.update({
      where: { id: chatId },
      data: {
        assignedTo: supportUserId,
        status: 'IN_PROGRESS',
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            fullName: true,
          },
        },
      },
    });
  }
}
