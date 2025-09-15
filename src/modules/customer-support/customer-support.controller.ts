import {
  Controller,
  Get,
  Post,
  Put,
  Param,
  Body,
  Query,
  UseGuards,
  Request,
  BadRequestException,
  Logger,
  InternalServerErrorException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { CustomerSupportService } from './customer-support.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

type ChatStatus = 'OPEN' | 'IN_PROGRESS' | 'CLOSED';
type ChatPriority = 'LOW' | 'MEDIUM' | 'HIGH';

@Controller('customer-support')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CustomerSupportController {
  private readonly logger = new Logger(CustomerSupportController.name);

  constructor(
    private readonly customerSupportService: CustomerSupportService,
  ) {}

  @Post('chat')
  async createSupportChat(
    @Request() req,
    @Body()
    createDto: {
      subject: string;
      priority?: ChatPriority;
      initialMessage: string;
    },
  ) {
    this.logger.log(`Creating support chat for user: ${req.user?.sub}`);
    this.logger.log(`Full user object: ${JSON.stringify(req.user)}`);
    
    // Use id if available, otherwise use sub
    const userId = req.user?.id || req.user?.sub;
    
    if (!req.user || !userId) {
      this.logger.error('User not authenticated or missing user ID');
      throw new BadRequestException('User not authenticated');
    }
    
    try {
      return await this.customerSupportService.createSupportChat(userId, createDto);
    } catch (error) {
      this.logger.error('Error creating support chat:', error);
      // Re-throw all exceptions as-is to preserve proper HTTP status codes
      throw error;
    }
  }

  @Post('chat/:chatId/message')
  async addMessage(
    @Request() req,
    @Param('chatId') chatId: string,
    @Body() messageDto: { message: string },
  ) {
    this.logger.log(`Adding message to chat: ${chatId} by user: ${req.user?.sub}`);
    this.logger.log(`Full user object: ${JSON.stringify(req.user)}`);
    
    // Use id if available, otherwise use sub
    const userId = req.user?.id || req.user?.sub;
    
    if (!req.user || !userId) {
      this.logger.error('User not authenticated or missing user ID');
      throw new BadRequestException('User not authenticated');
    }
    
    try {
      return await this.customerSupportService.addMessageToChat(userId, {
        chatId,
        message: messageDto.message,
        isFromSupport: req.user.role === 'ADMIN' || req.user.role === 'SUPPORT',
      });
    } catch (error) {
      this.logger.error('Error adding message to chat:', error);
      // Re-throw all exceptions as-is to preserve proper HTTP status codes
      throw error;
    }
  }

  @Get('my-chats')
  async getUserChats(@Request() req) {
    this.logger.log(`Fetching chats for user: ${req.user?.sub}`);
    this.logger.log(`Full user object: ${JSON.stringify(req.user)}`);
    
    // Use id if available, otherwise use sub
    const userId = req.user?.id || req.user?.sub;
    
    if (!req.user || !userId) {
      this.logger.error('User not authenticated or missing user ID');
      throw new BadRequestException('User not authenticated');
    }
    
    try {
      return await this.customerSupportService.getUserChats(userId);
    } catch (error) {
      this.logger.error('Error fetching user chats:', error);
      // Re-throw all exceptions as-is to preserve proper HTTP status codes
      throw error;
    }
  }

  @Get('chat/:chatId')
  async getChatDetails(@Request() req, @Param('chatId') chatId: string) {
    this.logger.log(`Fetching chat details: ${chatId} for user: ${req.user?.sub || req.user?.id}`);
    this.logger.log(`Full user object: ${JSON.stringify(req.user)}`);
    
    if (!req.user) {
      this.logger.error('User not authenticated');
      throw new BadRequestException('User not authenticated');
    }
    
    // Use id if available, otherwise use sub, fallback to email if needed
    const userId = req.user?.id || req.user?.sub || req.user?.email;
    
    if (!userId) {
      this.logger.error('User ID not found in user object');
      throw new BadRequestException('Unable to identify user');
    }
    
    try {
      // Regular users can only see their own chats
      const userAccessId = req.user.role === 'ADMIN' ? undefined : userId;
      return await this.customerSupportService.getChatDetails(chatId, userAccessId);
    } catch (error) {
      this.logger.error('Error fetching chat details:', error);
      // Re-throw all exceptions as-is to preserve proper HTTP status codes
      throw error;
    }
  }

  // Admin endpoints
  @Get('admin/chats')
  @Roles('ADMIN')
  async getAllChats(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
    @Query('status') status?: ChatStatus,
    @Query('priority') priority?: ChatPriority,
  ) {
    this.logger.log(`Admin fetching all chats - page: ${page}, limit: ${limit}`);
    try {
      return await this.customerSupportService.getAllChats(
        parseInt(page),
        parseInt(limit),
        status,
        priority,
      );
    } catch (error) {
      this.logger.error('Error fetching all chats:', error);
      // Re-throw all exceptions as-is to preserve proper HTTP status codes
      throw error;
    }
  }

  @Put('admin/chat/:chatId/status')
  @Roles('ADMIN')
  async updateChatStatus(
    @Param('chatId') chatId: string,
    @Body() updateDto: { status: ChatStatus; notes?: string },
  ) {
    this.logger.log(`Admin updating chat status: ${chatId}`);
    try {
      return await this.customerSupportService.updateChatStatus(chatId, updateDto);
    } catch (error) {
      this.logger.error('Error updating chat status:', error);
      // Re-throw all exceptions as-is to preserve proper HTTP status codes
      throw error;
    }
  }

  @Put('admin/chat/:chatId/assign')
  @Roles('ADMIN')
  async assignChatToSupport(
    @Param('chatId') chatId: string,
    @Body() assignDto: { supportUserId: string },
  ) {
    this.logger.log(`Admin assigning chat: ${chatId} to user: ${assignDto.supportUserId}`);
    try {
      return await this.customerSupportService.assignChatToSupport(
        chatId,
        assignDto.supportUserId,
      );
    } catch (error) {
      this.logger.error('Error assigning chat to support:', error);
      // Re-throw all exceptions as-is to preserve proper HTTP status codes
      throw error;
    }
  }

  @Get('admin/stats')
  @Roles('ADMIN')
  async getChatStats() {
    this.logger.log('Admin fetching chat stats');
    try {
      return await this.customerSupportService.getChatStats();
    } catch (error) {
      this.logger.error('Error fetching chat stats:', error);
      // Re-throw all exceptions as-is to preserve proper HTTP status codes
      throw error;
    }
  }

  @Get('admin/chat/:chatId/full')
  @Roles('ADMIN')
  async getFullChatDetails(@Param('chatId') chatId: string) {
    this.logger.log(`Admin fetching full chat details: ${chatId}`);
    try {
      return await this.customerSupportService.getChatDetails(chatId);
    } catch (error) {
      this.logger.error('Error fetching full chat details:', error);
      // Re-throw all exceptions as-is to preserve proper HTTP status codes
      throw error;
    }
  }
}