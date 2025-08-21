import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

export class SupabaseConfig {
  private static instance: SupabaseClient;

  static getInstance(configService?: ConfigService): SupabaseClient {
    if (!SupabaseConfig.instance) {
      const supabaseUrl = configService?.get('SUPABASE_URL') || process.env.SUPABASE_URL;
      const supabaseKey = configService?.get('SUPABASE_KEY') || process.env.SUPABASE_KEY;

      if (!supabaseUrl || !supabaseKey) {
        throw new Error('Supabase configuration is missing. Please check your environment variables.');
      }

      SupabaseConfig.instance = createClient(supabaseUrl, supabaseKey, {
        auth: {
          persistSession: false // Since this is server-side
        },
        db: {
          schema: 'public'
        }
      });
    }
    return SupabaseConfig.instance;
  }

  static async disconnect(): Promise<void> {
    // Supabase client doesn't require explicit disconnection
    SupabaseConfig.instance = null;
  }
}
