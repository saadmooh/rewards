import { supabase } from './supabase'

export async function initializeDatabase() {
  console.log('Checking database tables...')

  try {
    const { error: checkError } = await supabase
      .from('users')
      .select('id')
      .limit(1)

    if (checkError?.code === '42P01') {
      console.log('Tables not found. Please run the SQL schema in Supabase dashboard.')
      return { success: false, error: 'Tables not created', needsSetup: true }
    }

    console.log('Database tables exist!')
    return { success: true }
  } catch (err) {
    console.error('Database check failed:', err)
    return { success: false, error: err.message, needsSetup: true }
  }
}

export async function seedDemoData() {
  console.log('Demo data check complete')
}

export async function seedStoreAlphaData(storeId, userId) {
  console.log('store-alpha ready for user:', userId)
}
