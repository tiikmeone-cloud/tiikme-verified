import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://fpyprwenlqpuspskewgq.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZweXByd2VubHFwdXNwc2tld2dxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ2MjIzNjEsImV4cCI6MjA5MDE5ODM2MX0.O1k0uiOh1QdGZDn0MselNwBw4YRsd--yHjaURB7KbnM'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
