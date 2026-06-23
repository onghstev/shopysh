import { NextResponse } from 'next/server';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-Widget-Session',
  'Access-Control-Max-Age': '86400',
};

export function corsResponse(data: any, status = 200) {
  return NextResponse.json(data, { status, headers: CORS_HEADERS });
}

export function corsOptions() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

export function corsError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status, headers: CORS_HEADERS });
}
