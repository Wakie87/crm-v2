// Server-side RBAC utilities with database access
import { db } from './db';
import { user, organizationMember, role, permission } from './db/schema';
import { eq, and } from 'drizzle-orm';
import { UserPermissions } from './rbac';

export async function getUserPermissions(userId: string, organizationId?: string): Promise<UserPermissions> {
  try {
    // Get user's platform role
    const [userData] = await db.select().from(user).where(eq(user.id, userId));
    
    if (!userData) {
      throw new Error('User not found');
    }

    const result: UserPermissions = {
      platformRole: userData.role || 'user',
      permissions: []
    };

    // Platform superadmin has all permissions
    if (userData.role === 'superadmin') {
      const allPermissions = await db.select().from(permission);
      result.permissions = allPermissions.map(p => p.name);
      return result;
    }

    // If organization context is provided, get organization-specific permissions
    if (organizationId) {
      const membership = await db
        .select({
          roleId: organizationMember.roleId,
          roleName: role.name,
          rolePermissions: role.permissions,
          memberPermissions: organizationMember.permissions
        })
        .from(organizationMember)
        .innerJoin(role, eq(organizationMember.roleId, role.id))
        .where(
          and(
            eq(organizationMember.userId, userId),
            eq(organizationMember.organizationId, organizationId),
            eq(organizationMember.status, 'active')
          )
        )
        .limit(1);

      if (membership.length > 0) {
        const member = membership[0];
        result.organizationId = organizationId;
        result.organizationRole = member.roleName;
        
        // Combine role permissions with member-specific permissions
        const rolePermissions = Array.isArray(member.rolePermissions) 
          ? member.rolePermissions 
          : JSON.parse((member.rolePermissions as string) || '[]');
        
        const memberPermissions = member.memberPermissions 
          ? Object.keys(member.memberPermissions as object)
          : [];
        
        result.permissions = Array.from(new Set([...rolePermissions, ...memberPermissions]));
      }
    }

    return result;
  } catch (error) {
    console.error('Error getting user permissions:', error);
    return {
      platformRole: 'user',
      permissions: []
    };
  }
}