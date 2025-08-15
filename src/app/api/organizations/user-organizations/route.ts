import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { organization, organizationMember, user } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is a superadmin
    const userData = await db
      .select({ role: user.role })
      .from(user)
      .where(eq(user.id, session.user.id))
      .limit(1);

    const isSuperAdmin = userData[0]?.role === 'superadmin';

    let userOrganizations;

    if (isSuperAdmin) {
      // Superadmins can see all organizations
      userOrganizations = await db
        .select({
          id: organization.id,
          name: organization.name,
          slug: organization.slug,
          description: organization.description,
          logo: organization.logo,
        })
        .from(organization)
        .where(eq(organization.isActive, true))
        .orderBy(organization.name);
    } else {
      // Regular users can only see organizations they're members of
      userOrganizations = await db
        .select({
          id: organization.id,
          name: organization.name,
          slug: organization.slug,
          description: organization.description,
          logo: organization.logo,
        })
        .from(organization)
        .innerJoin(organizationMember, eq(organization.id, organizationMember.organizationId))
        .where(
          eq(organizationMember.userId, session.user.id)
        );
    }

    return NextResponse.json(userOrganizations);
  } catch (error) {
    console.error('Error fetching user organizations:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}