import jwt from 'jsonwebtoken';
import { NextRequest } from 'next/server';

const SECRET = process.env.NEXTAUTH_SECRET || 'fallback-secret';

export interface CustomerTokenPayload {
  customerId: string;
  tenantId: string;
  phone: string;
  email?: string;
  name?: string;
}

export function signCustomerToken(payload: CustomerTokenPayload): string {
  return jwt.sign(payload, SECRET, { expiresIn: '30d' });
}

export function verifyCustomerToken(token: string): CustomerTokenPayload | null {
  try {
    return jwt.verify(token, SECRET) as CustomerTokenPayload;
  } catch {
    return null;
  }
}

export function getCustomerFromRequest(req: NextRequest): CustomerTokenPayload | null {
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  const token = authHeader.slice(7);
  return verifyCustomerToken(token);
}
