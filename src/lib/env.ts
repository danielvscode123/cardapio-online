import { z } from 'zod';

const envSchema = z.object({
  supabaseUrl: z.url(),
  supabasePublishableKey: z.string().min(20),
});

export const env = envSchema.parse({
  supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
  supabasePublishableKey: process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
});
