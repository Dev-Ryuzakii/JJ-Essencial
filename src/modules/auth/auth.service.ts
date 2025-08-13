import { Injectable, UnauthorizedException, ConflictException, NotFoundException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaClient } from '@prisma/client';
import { ConfigService } from '@nestjs/config';
import { SupabaseConfig } from '../../config/supabase.config';
import { DatabaseConfig } from '../../config/database.config';
import { EmailService } from '../email/email.service';
import { SignUpDto, SignInDto, AuthResponseDto, ResetPasswordDto, AdminSignInDto } from './dto/auth.dto';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
  private supabase;
  private prisma: PrismaClient;
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
    private emailService: EmailService,
  ) {
    try {
      this.logger.log('Auth Service initializing...');
      
      // Log available configuration
      this.logger.log(`SUPABASE_URL in env: ${process.env.SUPABASE_URL ? 'Found' : 'Not found'}`);
      this.logger.log(`SUPABASE_SERVICE_ROLE_KEY in env: ${process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Found' : 'Not found'}`);
      this.logger.log(`supabase.url in config: ${this.configService.get('supabase.url') ? 'Found' : 'Not found'}`);
      this.logger.log(`supabase.serviceRoleKey in config: ${this.configService.get('supabase.serviceRoleKey') ? 'Found' : 'Not found'}`);
      
      // Initialize Supabase client
      this.supabase = SupabaseConfig.getInstance(this.configService);
      this.logger.log('Supabase client initialized successfully');
      
      // Initialize Prisma client
      this.prisma = DatabaseConfig.getInstance(this.configService);
      this.logger.log('Prisma client initialized successfully');
    } catch (error) {
      this.logger.error(`Error initializing services: ${error.message}`);
    }
  }

  async signUp(signUpDto: SignUpDto): Promise<AuthResponseDto> {
    const { email, password, fullName } = signUpDto;

    // Check if user already exists in our database
    const existingProfile = await this.prisma.profile.findUnique({
      where: { email },
    });

    // Also check if user exists in Supabase Auth
    const { data: supabaseUser, error: searchError } = await this.supabase.auth.admin.listUsers({
      filter: {
        email: email,
      },
    });

    this.logger.log(`Checking if user exists in Supabase: ${email}`);
    this.logger.log(`Supabase users found: ${supabaseUser?.users?.length || 0}`);
    
    const existsInSupabase = supabaseUser?.users?.length > 0;
    
    if (existingProfile) {
      // User exists in our database
      this.logger.log(`User exists in local database: ${email}`);
      
      if (!existsInSupabase) {
        // User exists in our database but not in Supabase - this is an inconsistency
        this.logger.warn(`Inconsistency detected: User ${email} exists in local database but not in Supabase Auth`);
        
        // Option: You could automatically create the user in Supabase here
        // or you could delete the local profile to maintain consistency
      }
      
      throw new ConflictException('User with this email already exists');
    }
    
    if (existsInSupabase) {
      // User exists in Supabase Auth but not in our database - this is an inconsistency
      this.logger.warn(`Inconsistency detected: User ${email} exists in Supabase Auth but not in local database`);
      
      // Option: You could automatically create the local profile here
      // or you could delete the Supabase auth user to maintain consistency
      
      throw new ConflictException('User with this email already exists in authentication system');
    }

    try {
      // Create user in Supabase Auth
      this.logger.log('Creating user in Supabase Auth...');
      const { data: authData, error: authError } = await this.supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true, // Auto-confirm for development
      });

      if (authError) {
        this.logger.error('Supabase Auth Error:', authError);
        throw new ConflictException(`Failed to create user: ${authError.message}`);
      }

      if (!authData || !authData.user) {
        this.logger.error('Supabase Auth returned no user data');
        throw new ConflictException('Failed to create user: No user data returned');
      }

      this.logger.log('User created in Supabase Auth:', authData.user.id);

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
    } catch (error) {
      console.error('Sign-up error:', error);
      if (error instanceof ConflictException) {
        throw error;
      }
      throw new ConflictException(`Failed to create user: ${error.message}`);
    }
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

  async adminSignIn(adminSignInDto: AdminSignInDto): Promise<AuthResponseDto> {
    const { email, password } = adminSignInDto;
    const adminEmail = this.configService.get('ADMIN_EMAIL') || 'admin@jjessential.com';
    const adminPassword = this.configService.get('ADMIN_PASSWORD') || 'admin123';

    // Check if credentials match the admin credentials
    if (email !== adminEmail || password !== adminPassword) {
      throw new UnauthorizedException('Invalid admin credentials');
    }

    try {
      // Try to check if admin exists in the database
      let adminProfile = await this.prisma.profile.findUnique({
        where: { email },
      });

      // If admin doesn't exist in the database, create it
      if (!adminProfile) {
        try {
          // Create user in Supabase Auth
          const { data: authData, error: authError } = await this.supabase.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
          });

          if (authError) {
            throw new ConflictException(`Failed to create admin: ${authError.message}`);
          }

          // Create admin profile in our database
          adminProfile = await this.prisma.profile.create({
            data: {
              id: authData.user.id,
              email,
              fullName: 'Admin User',
              role: 'ADMIN',
            },
          });
        } catch (error) {
          // If there's a database error or admin exists in Supabase but not in our database
          // Generate a temporary admin session
          const adminId = 'admin-' + Date.now(); // Generate a temporary ID
          const payload = { 
            sub: adminId, 
            email: email, 
            role: 'ADMIN' 
          };
          
          const access_token = this.jwtService.sign(payload);

          return {
            access_token,
            user: {
              id: adminId,
              email: email,
              fullName: 'Admin User',
              role: 'ADMIN',
            },
          };
        }
      }

      // Ensure the profile has ADMIN role
      if (adminProfile.role !== 'ADMIN') {
        // Update the role to ADMIN if it's not
        adminProfile = await this.prisma.profile.update({
          where: { id: adminProfile.id },
          data: { role: 'ADMIN' },
        });
      }

      // Generate JWT token
      const payload = { 
        sub: adminProfile.id, 
        email: adminProfile.email, 
        role: adminProfile.role 
      };
      
      const access_token = this.jwtService.sign(payload);

      return {
        access_token,
        user: {
          id: adminProfile.id,
          email: adminProfile.email,
          fullName: adminProfile.fullName,
          role: adminProfile.role,
        },
      };
    } catch (error) {
      // If there's a database error, still generate a token for the admin
      console.log('Database error during admin login:', error.message);
      
      const adminId = 'admin-' + Date.now(); // Generate a temporary ID
      const payload = { 
        sub: adminId, 
        email: email, 
        role: 'ADMIN' 
      };
      
      const access_token = this.jwtService.sign(payload);

      return {
        access_token,
        user: {
          id: adminId,
          email: email,
          fullName: 'Admin User',
          role: 'ADMIN',
        },
      };
    }
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
  
  /**
   * Utility method to check and fix inconsistencies between Supabase Auth and local database
   * This is useful for debugging and fixing user registration issues
   */
  async syncUsers(fixInconsistencies = false) {
    this.logger.log('Starting user synchronization check...');
    
    // Get all users from Supabase Auth
    const { data: supabaseData, error: supabaseError } = await this.supabase.auth.admin.listUsers();
    
    if (supabaseError) {
      this.logger.error('Error fetching users from Supabase:', supabaseError);
      throw new Error('Failed to fetch Supabase users');
    }
    
    // Get all users from local database
    const dbUsers = await this.prisma.profile.findMany();
    
    // Map users by email for easier comparison
    const supabaseUsersByEmail = {};
    supabaseData.users.forEach(user => {
      if (user.email) {
        supabaseUsersByEmail[user.email] = user;
      }
    });
    
    const dbUsersByEmail = {};
    dbUsers.forEach(user => {
      dbUsersByEmail[user.email] = user;
    });
    
    // Find users in Supabase but not in DB
    const onlyInSupabase = [];
    Object.keys(supabaseUsersByEmail).forEach(email => {
      if (!dbUsersByEmail[email]) {
        onlyInSupabase.push(email);
      }
    });
    
    // Find users in DB but not in Supabase
    const onlyInDb = [];
    Object.keys(dbUsersByEmail).forEach(email => {
      if (!supabaseUsersByEmail[email]) {
        onlyInDb.push(email);
      }
    });
    
    this.logger.log(`Found ${supabaseData.users.length} users in Supabase`);
    this.logger.log(`Found ${dbUsers.length} users in local database`);
    this.logger.log(`Found ${onlyInSupabase.length} users only in Supabase: ${onlyInSupabase.join(', ')}`);
    this.logger.log(`Found ${onlyInDb.length} users only in database: ${onlyInDb.join(', ')}`);
    
    // Fix inconsistencies if requested
    if (fixInconsistencies) {
      // Option 1: Create missing local profiles for Supabase users
      for (const email of onlyInSupabase) {
        const supabaseUser = supabaseUsersByEmail[email];
        this.logger.log(`Creating local profile for Supabase user: ${email}`);
        
        try {
          await this.prisma.profile.create({
            data: {
              id: supabaseUser.id,
              email: supabaseUser.email,
              fullName: supabaseUser.user_metadata?.full_name || 'Unknown',
              role: 'USER',
            },
          });
          this.logger.log(`Created local profile for ${email}`);
        } catch (error) {
          this.logger.error(`Failed to create local profile for ${email}:`, error);
        }
      }
      
      // Option 2: Delete local profiles that don't exist in Supabase
      for (const email of onlyInDb) {
        this.logger.log(`Deleting local profile without Supabase user: ${email}`);
        
        try {
          await this.prisma.profile.delete({
            where: { email },
          });
          this.logger.log(`Deleted local profile for ${email}`);
        } catch (error) {
          this.logger.error(`Failed to delete local profile for ${email}:`, error);
        }
      }
    }
    
    return {
      totalSupabaseUsers: supabaseData.users.length,
      totalDbUsers: dbUsers.length,
      onlyInSupabase,
      onlyInDb,
    };
  }
}
