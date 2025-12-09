import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  // ログイン後にホームへリダイレクト
  return NextResponse.redirect(new URL('/', request.url));
}
