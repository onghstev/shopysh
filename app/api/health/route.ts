import { NextResponse } from 'next/server';

// Lightweight health check endpoint — no auth, no DB
// Used by Docker healthcheck to verify the app is running
export async function GET() {
  return NextResponse.json({ status: 'ok', timestamp: Date.now() }, { status: 200 });
}
