import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getUserPermissions } from '@/lib/rbac-server';

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { organizationId } = await request.json();
    
    const permissions = await getUserPermissions(
      session.user.id,
      organizationId || undefined
    );

    return NextResponse.json(permissions);
  } catch (error) {
    console.error('Error getting user permissions:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}