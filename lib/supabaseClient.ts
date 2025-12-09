// lib/supabaseClient.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// フロント用：anon key、読み取り＆自分のアラート条件の書き込みだけ
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
