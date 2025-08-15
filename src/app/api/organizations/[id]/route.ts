import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { organization, organizationMember } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { getUserPermissions } from '@/lib/rbac-server';
import { hasPermission, PERMISSIONS } from '@/lib/rbac';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const organizationId = id;

    // Check if user is a member of the organization
    const membership = await db
      .select()
      .from(organizationMember)
      .where(
        and(
          eq(organizationMember.userId, session.user.id),
          eq(organizationMember.organizationId, organizationId),
          eq(organizationMember.status, 'active')
        )
      )
      .limit(1);

    if (membership.length === 0) {
      return NextResponse.json({ error: 'Not a member of this organization' }, { status: 403 });
    }

    // Get organization data
    const [orgData] = await db
      .select()
      .from(organization)
      .where(eq(organization.id, organizationId));

    if (!orgData) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    return NextResponse.json(orgData);
  } catch (error) {
    console.error('Error fetching organization:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const organizationId = id;

    // Check permissions
    const userPermissions = await getUserPermissions(session.user.id, organizationId);
    
    if (!hasPermission(userPermissions, PERMISSIONS.ORGANIZATION_UPDATE)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const { name, description, website } = await request.json();

    // Update organization
    const [updatedOrg] = await db
      .update(organization)
      .set({
        name,
        description,
        website,
        updatedAt: new Date()
      })
      .where(eq(organization.id, organizationId))
      .returning();

    return NextResponse.json(updatedOrg);
  } catch (error) {
    console.error('Error updating organization:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}