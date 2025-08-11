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
    return this.customerSupportService.createSupportChat(
      req.user.sub,
      createDto,
    );
  }

  @Post('chat/:chatId/message')
  async addMessage(
    @Request() req,
    @Param('chatId') chatId: string,
    @Body() messageDto: { message: string },
  ) {
    return this.customerSupportService.addMessageToChat(req.user.sub, {
      chatId,
      message: messageDto.message,
      isFromSupport: req.user.role === 'ADMIN' || req.user.role === 'SUPPORT',
    });
  }

  @Get('my-chats')
  async getUserChats(@Request() req) {
    return this.customerSupportService.getUserChats(req.user.sub);
  }

  @Get('chat/:chatId')
  async getChatDetails(@Request() req, @Param('chatId') chatId: string) {
    // Regular users can only see their own chats
    const userId = req.user.role === 'ADMIN' ? undefined : req.user.sub;
    return this.customerSupportService.getChatDetails(chatId, userId);
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
    return this.customerSupportService.getAllChats(
      parseInt(page),
      parseInt(limit),
      status,
      priority,
    );
  }

  @Put('admin/chat/:chatId/status')
  @Roles('ADMIN')
  async updateChatStatus(
    @Param('chatId') chatId: string,
    @Body() updateDto: { status: ChatStatus; notes?: string },
  ) {
    return this.customerSupportService.updateChatStatus(chatId, updateDto);
  }

  @Put('admin/chat/:chatId/assign')
  @Roles('ADMIN')
  async assignChatToSupport(
    @Param('chatId') chatId: string,
    @Body() assignDto: { supportUserId: string },
  ) {
    return this.customerSupportService.assignChatToSupport(
      chatId,
      assignDto.supportUserId,
    );
  }

  @Get('admin/stats')
  @Roles('ADMIN')
  async getChatStats() {
    return this.customerSupportService.getChatStats();
  }

  @Get('admin/chat/:chatId/full')
  @Roles('ADMIN')
  async getFullChatDetails(@Param('chatId') chatId: string) {
    return this.customerSupportService.getChatDetails(chatId);
  }
}
