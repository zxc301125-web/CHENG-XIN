import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://bbjubksufcicvpfnczhv.supabase.co'
const SUPABASE_KEY = 'sb_publishable_p2rmidkJG6v4IphQWFy4jQ_Qx-O3cM8'

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)


