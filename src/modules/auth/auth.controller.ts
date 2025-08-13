import {
  Controller,
  Post,
  Body,
  Get,
  Put,
  UseGuards,
  HttpStatus,
  HttpCode,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import {
  SignUpDto,
  SignInDto,
  AuthResponseDto,
  ResetPasswordDto,
  UpdatePasswordDto,
  AdminSignInDto,
} from './dto/auth.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser, UserId } from '../../common/decorators/user.decorator';
import { SuccessResponseDto } from '../../common/dto/common.dto';
import { Roles, AdminOnly } from '../../common/decorators/roles.decorator';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({
    status: 201,
    description: 'User successfully created',
    type: AuthResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 409, description: 'User already exists' })
  async signUp(@Body() signUpDto: SignUpDto): Promise<SuccessResponseDto<AuthResponseDto>> {
    const result = await this.authService.signUp(signUpDto);
    return new SuccessResponseDto(result, 'User registered successfully');
  }

  @Post('admin/signin')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Sign in as admin' })
  @ApiResponse({
    status: 200,
    description: 'Admin successfully signed in',
    type: AuthResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Invalid admin credentials' })
  async adminSignIn(@Body() adminSignInDto: AdminSignInDto): Promise<SuccessResponseDto<AuthResponseDto>> {
    const result = await this.authService.adminSignIn(adminSignInDto);
    return new SuccessResponseDto(result, 'Admin signed in successfully');
  }

  @Post('signin')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Sign in user' })
  @ApiResponse({
    status: 200,
    description: 'User successfully signed in',
    type: AuthResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async signIn(@Body() signInDto: SignInDto): Promise<SuccessResponseDto<AuthResponseDto>> {
    const result = await this.authService.signIn(signInDto);
    return new SuccessResponseDto(result, 'User signed in successfully');
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request password reset' })
  @ApiResponse({ status: 200, description: 'Reset email sent' })
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    const result = await this.authService.resetPassword(resetPasswordDto);
    return new SuccessResponseDto(result, 'Password reset email sent');
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'User profile retrieved' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getProfile(@UserId() userId: string) {
    const result = await this.authService.getUserProfile(userId);
    return new SuccessResponseDto(result, 'Profile retrieved successfully');
  }

  @Put('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update user profile' })
  @ApiResponse({ status: 200, description: 'Profile updated' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async updateProfile(
    @UserId() userId: string,
    @Body() updateData: { fullName?: string },
  ) {
    const result = await this.authService.updateProfile(userId, updateData);
    return new SuccessResponseDto(result, 'Profile updated successfully');
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user info' })
  @ApiResponse({ status: 200, description: 'User info retrieved' })
  async getCurrentUser(@CurrentUser() user: any) {
    return new SuccessResponseDto(user, 'User info retrieved');
  }
  
  @Get('admin/sync-users')
  @UseGuards(JwtAuthGuard)
  @AdminOnly()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Sync users between Supabase Auth and local database' })
  @ApiResponse({ status: 200, description: 'User sync status retrieved' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin only' })
  @ApiQuery({ name: 'fix', required: false, type: Boolean, description: 'Fix inconsistencies between Supabase Auth and local database' })
  async syncUsers(@Query('fix') fix: boolean = false) {
    const result = await this.authService.syncUsers(fix);
    return new SuccessResponseDto(result, 'User synchronization completed');
  }
}
