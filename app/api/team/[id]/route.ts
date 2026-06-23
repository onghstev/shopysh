import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

// PATCH /api/team/[id] - Update a team member (role, active status)
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.tenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!['TENANT_ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const member = await prisma.user.findFirst({
      where: { id: params.id, tenantId: session.user.tenantId },
    });
    if (!member) return NextResponse.json({ error: 'Member not found' }, { status: 404 });

    // Prevent self-demotion or deactivation
    if (member.id === session.user.id) {
      return NextResponse.json({ error: 'You cannot modify your own account here' }, { status: 400 });
    }

    // Cannot modify other TENANT_ADMINs or SUPER_ADMINs
    if (['TENANT_ADMIN', 'SUPER_ADMIN'].includes(member.role)) {
      return NextResponse.json({ error: 'Cannot modify admin accounts' }, { status: 403 });
    }

    const body = await req.json();
    const updateData: any = {};

    if (body.role !== undefined) {
      const validRoles = ['TENANT_MANAGER', 'TENANT_USER'];
      if (!validRoles.includes(body.role)) {
        return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
      }
      updateData.role = body.role;
    }

    if (body.isActive !== undefined) {
      updateData.isActive = Boolean(body.isActive);
    }

    const updated = await prisma.user.update({
      where: { id: params.id },
      data: updateData,
      select: {
        id: true, email: true, firstName: true, lastName: true, name: true,
        role: true, isActive: true, createdAt: true, lastLoginAt: true,
      },
    });

    return NextResponse.json({ member: updated });
  } catch (error: any) {
    console.error('Team PATCH error:', error);
    return NextResponse.json({ error: 'Failed to update member' }, { status: 500 });
  }
}

// DELETE /api/team/[id] - Remove a team member (soft delete)
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.tenantId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!['TENANT_ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const member = await prisma.user.findFirst({
      where: { id: params.id, tenantId: session.user.tenantId },
    });
    if (!member) return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    if (member.id === session.user.id) {
      return NextResponse.json({ error: 'You cannot remove yourself' }, { status: 400 });
    }
    if (['TENANT_ADMIN', 'SUPER_ADMIN'].includes(member.role)) {
      return NextResponse.json({ error: 'Cannot remove admin accounts' }, { status: 403 });
    }

    await prisma.user.update({
      where: { id: params.id },
      data: { deletedAt: new Date(), isActive: false },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Team DELETE error:', error);
    return NextResponse.json({ error: 'Failed to remove member' }, { status: 500 });
  }
}
