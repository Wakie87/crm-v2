import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { user, organizationMember } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { organizationId } = await request.json();

    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID is required' }, { status: 400 });
    }

    // Get user data to check if they're a superadmin
    const userData = await db
      .select({ role: user.role })
      .from(user)
      .where(eq(user.id, session.user.id))
      .limit(1);

    const isSuperAdmin = userData[0]?.role === 'superadmin';

    // Superadmins can switch to any organization, others need membership
    if (!isSuperAdmin) {
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
        return NextResponse.json({ error: 'User is not a member of this organization' }, { status: 403 });
      }
    }

    // Update user's current organization
    await db
      .update(user)
      .set({ 
        currentOrganizationId: organizationId,
        updatedAt: new Date()
      })
      .where(eq(user.id, session.user.id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error switching organization:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}