import { createClient } from '@supabase/supabase-js';
import { ConfigService } from '@nestjs/config';

export class SupabaseConfig {
  private static instance: ReturnType<typeof createClient>;

  static getInstance(configService?: ConfigService) {
    if (!SupabaseConfig.instance) {
      const supabaseUrl = configService?.get('SUPABASE_URL') || process.env.SUPABASE_URL;
      const supabaseKey = configService?.get('SUPABASE_SERVICE_ROLE_KEY') || process.env.SUPABASE_SERVICE_ROLE_KEY;

      if (!supabaseUrl || !supabaseKey) {
        throw new Error('Supabase URL and Service Role Key are required');
      }

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
