import { createClient } from "@supabase/supabase-js";

// Service Role 클라이언트 생성
// only for server side
const ServerSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

export default ServerSupabase;