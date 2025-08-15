'use client';

import { usePermissions } from '@/lib/auth-context';
import { hasPermission, hasAnyPermission, hasAllPermissions, isSuperAdmin, canAccessOrganization, PermissionType } from '@/lib/rbac';

interface PermissionGuardProps {
  children: React.ReactNode;
  permission?: PermissionType;
  permissions?: PermissionType[];
  requireAll?: boolean;
  fallback?: React.ReactNode;
  organizationId?: string;
}

export function PermissionGuard({
  children,
  permission,
  permissions,
  requireAll = false,
  fallback = null,
  organizationId
}: PermissionGuardProps) {
  const userPermissions = usePermissions();

  if (!userPermissions) {
    return <>{fallback}</>;
  }

  // Check organization context if required (superadmin bypasses this check)
  if (organizationId && userPermissions.platformRole !== 'superadmin' && userPermissions.organizationId !== organizationId) {
    return <>{fallback}</>;
  }

  let hasAccess = false;

  if (permission) {
    hasAccess = hasPermission(userPermissions, permission);
  } else if (permissions) {
    hasAccess = requireAll 
      ? hasAllPermissions(userPermissions, permissions)
      : hasAnyPermission(userPermissions, permissions);
  } else {
    // No permission specified, allow access
    hasAccess = true;
  }

  return hasAccess ? <>{children}</> : <>{fallback}</>;
}

// Convenience components for common use cases
export function AdminOnly({ children, fallback }: { children: React.ReactNode; fallback?: React.ReactNode }) {
  const userPermissions = usePermissions();
  
  if (userPermissions?.platformRole === 'superadmin') {
    return <>{children}</>;
  }
  
  return <>{fallback}</>;
}

export function SuperAdminOnly({ children, fallback }: { children: React.ReactNode; fallback?: React.ReactNode }) {
  return (
    <AdminOnly fallback={fallback}>
      {children}
    </AdminOnly>
  );
}

// Hook for checking permissions in components
export function useHasPermission(permission: PermissionType): boolean {
  const userPermissions = usePermissions();
  return userPermissions ? hasPermission(userPermissions, permission) : false;
}

export function useHasAnyPermission(permissions: PermissionType[]): boolean {
  const userPermissions = usePermissions();
  return userPermissions ? hasAnyPermission(userPermissions, permissions) : false;
}

export function useHasAllPermissions(permissions: PermissionType[]): boolean {
  const userPermissions = usePermissions();
  return userPermissions ? hasAllPermissions(userPermissions, permissions) : false;
}

export function useIsSuperAdmin(): boolean {
  const userPermissions = usePermissions();
  return userPermissions ? isSuperAdmin(userPermissions) : false;
}

export function useCanAccessOrganization(organizationId: string): boolean {
  const userPermissions = usePermissions();
  return userPermissions ? canAccessOrganization(userPermissions, organizationId) : false;
}