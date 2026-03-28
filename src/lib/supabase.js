import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Missing Supabase configuration')
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key'
)

export const testConnection = async () => {
  try {
    const { data, error } = await supabase.from('users').select('count').single()
    if (error) throw error
    return { success: true, data }
  } catch (err) {
    console.error('Supabase connection error:', err.message)
    return { success: false, error: err.message }
  }
}
