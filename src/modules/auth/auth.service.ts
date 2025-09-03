import { Injectable, UnauthorizedException, ConflictException, NotFoundException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { SupabaseConfig } from '../../config/supabase.config';
import { EmailService } from '../email/email.service';
import { SignUpDto, SignInDto, AuthResponseDto, ResetPasswordDto, AdminSignInDto } from './dto/auth.dto';

@Injectable()
export class AuthService {
  private supabase;
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
    } catch (error) {
      this.logger.error(`Error initializing services: ${error.message}`);
    }
  }

  async signUp(signUpDto: SignUpDto): Promise<AuthResponseDto> {
    const { email, password, fullName } = signUpDto;
    
    this.logger.log(`Starting signup process for: ${email}`);

    // Check if user already exists in our database
    const { data: existingProfile, error: profileError } = await this.supabase
      .from('profile')
      .select()
      .eq('email', email)
      .single();

    if (existingProfile) {
      this.logger.log(`User already exists in database: ${email}`);
      throw new ConflictException('User with this email already exists');
    }
    
    if (profileError && profileError.code !== 'PGRST116') {
      this.logger.error(`Database error checking profile: ${profileError.message}`);
      throw new ConflictException('Error checking user existence');
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

      // Check if profile was created by trigger
      let { data: profile, error: profileError } = await this.supabase
        .from('profile')
        .select()
        .eq('id', authData.user.id)
        .single();

      if (!profile) {
        // Profile wasn't created by trigger, create it manually
        const { data: newProfile, error: createError } = await this.supabase
          .from('profile')
          .insert([{
            id: authData.user.id,
            email,
            full_name: fullName,
            role: 'USER',
          }])
          .select()
          .single();

        if (createError) throw new Error(createError.message);
        profile = newProfile;
      } else {
        // Update the profile with full name if it was created by trigger
        const { data: updatedProfile, error: updateError } = await this.supabase
          .from('profile')
          .update({ full_name: fullName })
          .eq('id', authData.user.id)
          .select()
          .single();

        if (updateError) throw new Error(updateError.message);
        profile = updatedProfile;
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

    try {
      // First check if user exists in our database
      const { data: profile, error: profileError } = await this.supabase
        .from('profile')
        .select()
        .eq('email', email)
        .single();

      if (!profile) {
        this.logger.error(`Profile not found for email: ${email}`);
        throw new UnauthorizedException('Invalid credentials');
      }

      // Authenticate with Supabase
      const { data: authData, error: authError } = await this.supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        this.logger.error(`Auth error for ${email}: ${authError.message}`);
        throw new UnauthorizedException('Invalid credentials');
      }

      if (!authData.user) {
        this.logger.error(`No user data returned for ${email}`);
        throw new UnauthorizedException('Invalid credentials');
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
    } catch (error) {
      console.error('Sign-in error:', error);
      throw new UnauthorizedException('Invalid credentials');
    }
  }

  async adminSignIn(adminSignInDto: AdminSignInDto): Promise<AuthResponseDto> {
    const { email, password } = adminSignInDto;

    // Get admin credentials from environment
    const adminEmail = this.configService.get('ADMIN_EMAIL') || 'jadesola0518@gmail.com';
    const adminPassword = this.configService.get('ADMIN_PASSWORD') || 'Amoke1805';

    this.logger.log(`Attempting admin login for: ${email}`);
    this.logger.log(`Expected admin email: ${adminEmail}`);

    // Check if credentials match the admin credentials
    if (email !== adminEmail || password !== adminPassword) {
      this.logger.error(`Invalid admin credentials provided`);
      throw new UnauthorizedException('Invalid admin credentials');
    }

    this.logger.log('Admin credentials validated successfully');

    // Generate JWT token with admin role
    const payload = { 
      sub: 'admin-user', // Fixed admin user ID
      email: email, 
      role: 'ADMIN' 
    };
    
    const access_token = this.jwtService.sign(payload);

    this.logger.log('Admin JWT token generated successfully');

    return {
      access_token,
      user: {
        id: 'admin-user',
        email: email,
        fullName: 'Admin User',
        role: 'ADMIN',
      },
    };
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto): Promise<{ message: string }> {
    const { email } = resetPasswordDto;

    // Check if user exists in Supabase
    const { data: profile, error: profileError } = await this.supabase
      .from('profile')
      .select()
      .eq('email', email)
      .single();

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
    // Handle special case for admin user
    if (userId === 'admin-user') {
      const adminEmail = this.configService.get('ADMIN_EMAIL');
      return {
        id: 'admin-user',
        email: adminEmail,
        fullName: 'Admin User',
        role: 'ADMIN',
      };
    }

    const { data: profile, error } = await this.supabase
      .from('profile')
      .select()
      .eq('id', userId)
      .single();

    if (!profile) {
      throw new UnauthorizedException('User not found');
    }

    return {
      id: profile.id,
      email: profile.email,
      fullName: profile.full_name,
      role: profile.role,
    };
  }

  async getUserProfile(userId: string) {
    const { data: profile, error } = await this.supabase
      .from('profile')
      .select()
      .eq('id', userId)
      .single();

    if (!profile) {
      throw new NotFoundException('User profile not found');
    }

    return {
      id: profile.id,
      email: profile.email,
      fullName: profile.full_name,
      role: profile.role,
      createdAt: profile.created_at,
      updatedAt: profile.updated_at,
    };
  }

  async updateProfile(userId: string, updateData: { fullName?: string }) {
    const { data: existingProfile, error: findError } = await this.supabase
      .from('profile')
      .select()
      .eq('id', userId)
      .single();

    if (!existingProfile) {
      throw new NotFoundException('User profile not found');
    }

    const { data: updatedProfile, error: updateError } = await this.supabase
      .from('profile')
      .update({
        full_name: updateData.fullName,
      })
      .eq('id', userId)
      .select()
      .single();

    if (updateError) throw new Error(updateError.message);

    return {
      id: updatedProfile.id,
      email: updatedProfile.email,
      fullName: updatedProfile.full_name,
      role: updatedProfile.role,
      updatedAt: updatedProfile.updated_at,
    };
  }
  
  /**
   * Utility method to check and fix inconsistencies between Supabase Auth and local database
   * This is useful for debugging and fixing user registration issues
   */
  private generateAuthResponse(profile: any): AuthResponseDto {
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
        fullName: profile.full_name,
        role: profile.role,
      },
    };
  }

  async syncUsers(fixInconsistencies = false) {
    this.logger.log('Starting user synchronization check...');
    
    // Get all users from Supabase Auth
    const { data: supabaseData, error: supabaseError } = await this.supabase.auth.admin.listUsers();
    
    if (supabaseError) {
      this.logger.error('Error fetching users from Supabase:', supabaseError);
      throw new Error('Failed to fetch Supabase users');
    }
    
    // Get all users from local database
    const { data: dbUsers, error: dbError } = await this.supabase
      .from('profile')
      .select();

    if (dbError) throw new Error(dbError.message);
    
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
          const { error: createError } = await this.supabase
            .from('profile')
            .insert([{
              id: supabaseUser.id,
              email: supabaseUser.email,
              full_name: supabaseUser.user_metadata?.full_name || 'Unknown',
              role: 'USER',
            }]);
            
          if (createError) throw createError;
          this.logger.log(`Created local profile for ${email}`);
        } catch (error) {
          this.logger.error(`Failed to create local profile for ${email}:`, error);
        }
      }
      
      // Option 2: Delete local profiles that don't exist in Supabase
      for (const email of onlyInDb) {
        this.logger.log(`Deleting local profile without Supabase user: ${email}`);
        
        try {
          const { error: deleteError } = await this.supabase
            .from('profile')
            .delete()
            .eq('email', email);
            
          if (deleteError) throw deleteError;
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
