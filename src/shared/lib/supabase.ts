import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    storageKey: 'relevent-auth',
  },
})

// Helpers de tipos para usar en composables
export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row']

export type Profile = Tables<'profiles'>
export type Company = Tables<'companies'>
export type CompanyMember = Tables<'company_members'>
export type CompanyFeature = Tables<'company_features'>

export type UserRole = Database['public']['Enums']['user_role']
export type MemberRole = Database['public']['Enums']['member_role']
export type CompanyPlan = Database['public']['Enums']['company_plan']
export type FeatureName = Database['public']['Enums']['feature_name']
