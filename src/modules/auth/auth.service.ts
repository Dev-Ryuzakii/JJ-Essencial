import { Injectable, UnauthorizedException, ConflictException, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaClient } from '@prisma/client';
import { ConfigService } from '@nestjs/config';
import { SupabaseConfig } from '../../config/supabase.config';
import { DatabaseConfig } from '../../config/database.config';
import { EmailService } from '../email/email.service';
import { SignUpDto, SignInDto, AuthResponseDto, ResetPasswordDto } from './dto/auth.dto';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
  private supabase;
  private prisma: PrismaClient;

  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
    private emailService: EmailService,
  ) {
    // Initialize Supabase client
    this.supabase = SupabaseConfig.getInstance(this.configService);
    
    // Initialize Prisma client
    this.prisma = DatabaseConfig.getInstance(this.configService);
  }

  async signUp(signUpDto: SignUpDto): Promise<AuthResponseDto> {
    const { email, password, fullName } = signUpDto;

    // Check if user already exists
    const existingProfile = await this.prisma.profile.findUnique({
      where: { email },
    });

    if (existingProfile) {
      throw new ConflictException('User with this email already exists');
    }

    // Create user in Supabase Auth
    const { data: authData, error: authError } = await this.supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm for development
    });

    if (authError) {
      throw new ConflictException(`Failed to create user: ${authError.message}`);
    }

    // Create profile in our database
    const profile = await this.prisma.profile.create({
      data: {
        id: authData.user.id,
        email,
        fullName,
        role: 'USER',
      },
    });

    // Generate JWT token
    const payload = { 
      sub: profile.id, 
      email: profile.email, 
      role: profile.role 
    };
    
    const access_token = this.jwtService.sign(payload);

    return {
      access_token,
      user: {
        id: profile.id,
        email: profile.email,
        fullName: profile.fullName,
        role: profile.role,
      },
    };
  }

  async signIn(signInDto: SignInDto): Promise<AuthResponseDto> {
    const { email, password } = signInDto;

    // Authenticate with Supabase
    const { data: authData, error: authError } = await this.supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Get profile from our database
    const profile = await this.prisma.profile.findUnique({
      where: { email },
    });

    if (!profile) {
      throw new NotFoundException('User profile not found');
    }

    // Generate JWT token
    const payload = { 
      sub: profile.id, 
      email: profile.email, 
      role: profile.role 
    };
    
    const access_token = this.jwtService.sign(payload);

    return {
      access_token,
      user: {
        id: profile.id,
        email: profile.email,
        fullName: profile.fullName,
        role: profile.role,
      },
    };
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto): Promise<{ message: string }> {
    const { email } = resetPasswordDto;

    // Check if user exists
    const profile = await this.prisma.profile.findUnique({
      where: { email },
    });

    if (!profile) {
      // Don't reveal that user doesn't exist
      return { message: 'If the email exists, a reset link has been sent' };
    }

    // Send reset password email via Supabase
    const { error } = await this.supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.FRONTEND_URL}/reset-password`,
    });

    if (error) {
      throw new Error(`Failed to send reset email: ${error.message}`);
    }

    return { message: 'If the email exists, a reset link has been sent' };
  }

  async validateUser(userId: string): Promise<any> {
    const profile = await this.prisma.profile.findUnique({
      where: { id: userId },
    });

    if (!profile) {
      throw new UnauthorizedException('User not found');
    }

    return {
      id: profile.id,
      email: profile.email,
      fullName: profile.fullName,
      role: profile.role,
    };
  }

  async getUserProfile(userId: string) {
    const profile = await this.prisma.profile.findUnique({
      where: { id: userId },
    });

    if (!profile) {
      throw new NotFoundException('User profile not found');
    }

    return {
      id: profile.id,
      email: profile.email,
      fullName: profile.fullName,
      role: profile.role,
      createdAt: profile.createdAt,
      updatedAt: profile.updatedAt,
    };
  }

  async updateProfile(userId: string, updateData: { fullName?: string }) {
    const profile = await this.prisma.profile.update({
      where: { id: userId },
      data: updateData,
    });

    return {
      id: profile.id,
      email: profile.email,
      fullName: profile.fullName,
      role: profile.role,
      updatedAt: profile.updatedAt,
    };
  }
}
