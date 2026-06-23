import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';
import bcrypt from 'bcryptjs';

export const dynamic = 'force-dynamic';

// GET /api/team - List team members for tenant
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.tenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!['TENANT_ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const members = await prisma.user.findMany({
      where: { tenantId: session.user.tenantId, deletedAt: null },
      select: {
        id: true, email: true, firstName: true, lastName: true, name: true,
        role: true, isActive: true, phone: true, lastLoginAt: true, createdAt: true,
        image: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json({ members });
  } catch (error: any) {
    console.error('Team GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch team' }, { status: 500 });
  }
}

// POST /api/team - Invite a new team member
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.tenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!['TENANT_ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Only admins can invite team members' }, { status: 403 });
    }

    const body = await req.json();
    const { email, firstName, lastName, role, password } = body;

    if (!email || !firstName || !password) {
      return NextResponse.json({ error: 'Email, first name, and password are required' }, { status: 400 });
    }

    const validRoles = ['TENANT_MANAGER', 'TENANT_USER'];
    if (!validRoles.includes(role)) {
      return NextResponse.json({ error: 'Invalid role. Must be TENANT_MANAGER or TENANT_USER' }, { status: 400 });
    }

    // Check if user already exists in this tenant
    const existing = await prisma.user.findFirst({
      where: { email, tenantId: session.user.tenantId },
    });
    if (existing) {
      return NextResponse.json({ error: 'A user with this email already exists in your team' }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const member = await prisma.user.create({
      data: {
        tenantId: session.user.tenantId,
        email,
        firstName,
        lastName: lastName ?? '',
        name: `${firstName} ${lastName ?? ''}`.trim(),
        role,
        passwordHash,
        isActive: true,
        emailVerified: true,
      },
      select: {
        id: true, email: true, firstName: true, lastName: true, name: true,
        role: true, isActive: true, createdAt: true,
      },
    });

    return NextResponse.json({ member }, { status: 201 });
  } catch (error: any) {
    console.error('Team POST error:', error);
    return NextResponse.json({ error: 'Failed to invite team member' }, { status: 500 });
  }
}
