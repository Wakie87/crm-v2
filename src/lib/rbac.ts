// Client-side RBAC interface - no database imports

export interface UserPermissions {
  platformRole: string;
  organizationRole?: string;
  permissions: string[];
  organizationId?: string;
}

// Permission checking utilities (client-side safe)
export function hasPermission(userPermissions: UserPermissions, requiredPermission: string): boolean {
  // Platform superadmin always has permission
  if (userPermissions.platformRole === 'superadmin') {
    return true;
  }

  // Check if user has the specific permission
  return userPermissions.permissions.includes(requiredPermission);
}

export function hasAnyPermission(userPermissions: UserPermissions, requiredPermissions: string[]): boolean {
  return requiredPermissions.some(permission => hasPermission(userPermissions, permission));
}

export function hasAllPermissions(userPermissions: UserPermissions, requiredPermissions: string[]): boolean {
  return requiredPermissions.every(permission => hasPermission(userPermissions, permission));
}

export function isSuperAdmin(userPermissions: UserPermissions): boolean {
  return userPermissions.platformRole === 'superadmin';
}

export function canBypassOrganizationCheck(userPermissions: UserPermissions): boolean {
  return isSuperAdmin(userPermissions);
}

export function canAccessOrganization(
  userPermissions: UserPermissions,
  organizationId: string
): boolean {
  // Superadmins can access any organization
  if (isSuperAdmin(userPermissions)) {
    return true;
  }
  
  // Regular users can only access their current organization
  return userPermissions.organizationId === organizationId;
}

export function canAccessResource(
  userPermissions: UserPermissions,
  resource: string,
  action: string,
  organizationId?: string
): boolean {
  const permission = `${resource}:${action}`;
  
  // Platform superadmin can access any resource regardless of organization
  if (userPermissions.platformRole === 'superadmin') {
    return true;
  }
  
  // Check if user has the required permission
  if (!hasPermission(userPermissions, permission)) {
    return false;
  }

  // If organization context is required, check if user is in the organization
  // (superadmin already handled above)
  if (organizationId && userPermissions.organizationId !== organizationId) {
    return false;
  }

  return true;
}

// Permission constants for easy reference
export const PERMISSIONS = {
  // Organization
  ORGANIZATION_READ: 'organization:read',
  ORGANIZATION_UPDATE: 'organization:update',
  ORGANIZATION_DELETE: 'organization:delete',
  ORGANIZATION_BILLING: 'organization:billing',

  // User Management
  USER_READ: 'user:read',
  USER_CREATE: 'user:create',
  USER_UPDATE: 'user:update',
  USER_DELETE: 'user:delete',
  USER_IMPERSONATE: 'user:impersonate',

  // Role Management
  ROLE_READ: 'role:read',
  ROLE_CREATE: 'role:create',
  ROLE_UPDATE: 'role:update',
  ROLE_DELETE: 'role:delete',
  ROLE_ASSIGN: 'role:assign',

  // Content
  CONTENT_READ: 'content:read',
  CONTENT_CREATE: 'content:create',
  CONTENT_UPDATE: 'content:update',
  CONTENT_DELETE: 'content:delete',
  CONTENT_PUBLISH: 'content:publish',

  // Analytics
  ANALYTICS_READ: 'analytics:read',
  ANALYTICS_EXPORT: 'analytics:export',

  // Settings
  SETTINGS_READ: 'settings:read',
  SETTINGS_UPDATE: 'settings:update',

  // Platform (for superadmin)
  PLATFORM_ORGANIZATIONS: 'platform:organizations',
  PLATFORM_USERS: 'platform:users',
  PLATFORM_BILLING: 'platform:billing',
  PLATFORM_SETTINGS: 'platform:settings'
} as const;

export type PermissionType = typeof PERMISSIONS[keyof typeof PERMISSIONS];