import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://xwekiffneeprrukrxhqi.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh3ZWtpZmZuZWVwcnJ1a3J4aHFpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk2MzAxNzUsImV4cCI6MjA3NTIwNjE3NX0.x3vXM5_yuHVBy3h5Aexp9jehtZSHT1SfTL6FASRmaiI'

// Validate URL format
if (!supabaseUrl.startsWith('http://') && !supabaseUrl.startsWith('https://')) {
  throw new Error(`Invalid supabaseUrl: ${supabaseUrl}`)
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// For server-side operations (optional)
export const supabaseAdmin = createClient(
  supabaseUrl,
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh3ZWtpZmZuZWVwcnJ1a3J4aHFpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTYzMDE3NSwiZXhwIjoyMDc1MjA2MTc1fQ.k-jBmdXvM1pwPwu9EY55VlyI77y_BD5HHeV9BN1Lmbs'
)
