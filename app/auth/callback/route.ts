import { NextResponse, type NextRequest } from 'next/server';
import { getServerSupabase } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const next = url.searchParams.get('next') ?? '/';

  if (!code) {
    return NextResponse.redirect(`${url.origin}/login?error=missing_code`);
  }

  const supabase = await getServerSupabase();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    return NextResponse.redirect(`${url.origin}/login?error=auth_failed`);
  }

  return NextResponse.redirect(`${url.origin}${next.startsWith('/') ? next : '/'}`);
}
