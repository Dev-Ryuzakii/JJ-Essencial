import { createClient } from '@supabase/supabase-js';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';

export class SupabaseConfig {
  private static instance: ReturnType<typeof createClient>;
  private static readonly logger = new Logger('SupabaseConfig');

  static getInstance(configService?: ConfigService) {
    if (!SupabaseConfig.instance) {
      // Try getting from nested config
      let supabaseUrl = configService?.get('supabase.url');
      let supabaseKey = configService?.get('supabase.serviceRoleKey');
      
      // If not found, try direct environment variable access
      if (!supabaseUrl) supabaseUrl = configService?.get('SUPABASE_URL') || process.env.SUPABASE_URL;
      if (!supabaseKey) supabaseKey = configService?.get('SUPABASE_SERVICE_ROLE_KEY') || process.env.SUPABASE_SERVICE_ROLE_KEY;

      SupabaseConfig.logger.log(`Supabase URL: ${supabaseUrl ? 'Found' : 'Not found'}`);
      SupabaseConfig.logger.log(`Supabase Key: ${supabaseKey ? 'Found' : 'Not found'}`);

      if (!supabaseUrl || !supabaseKey) {
        SupabaseConfig.logger.error('Supabase URL or Service Role Key is missing');
        throw new Error('Supabase URL and Service Role Key are required');
      }

      SupabaseConfig.logger.log('Initializing Supabase client with service role key');
      SupabaseConfig.instance = createClient(supabaseUrl, supabaseKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      });
    }
    return SupabaseConfig.instance;
  }

  static getAnonClient(configService?: ConfigService) {
    const supabaseUrl = configService?.get('SUPABASE_URL') || process.env.SUPABASE_URL;
    const supabaseAnonKey = configService?.get('SUPABASE_ANON_KEY') || process.env.SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Supabase URL and Anon Key are required');
    }

    return createClient(supabaseUrl, supabaseAnonKey);
  }
}
