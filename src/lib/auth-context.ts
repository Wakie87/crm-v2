'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useSession } from './auth-client';
import { UserPermissions } from './rbac';

interface AuthContextType {
  user: any;
  session: any;
  permissions: UserPermissions | null;
  currentOrganizationId: string | null;
  isLoading: boolean;
  switchOrganization: (organizationId: string) => Promise<void>;
  refreshPermissions: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { data: session, isPending } = useSession();
  const [permissions, setPermissions] = useState<UserPermissions | null>(null);
  const [currentOrganizationId, setCurrentOrganizationId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshPermissions = async () => {
    if (session?.user?.id) {
      try {
        const response = await fetch('/api/auth/permissions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            organizationId: currentOrganizationId,
          }),
        });

        if (response.ok) {
          const userPermissions = await response.json();
          setPermissions(userPermissions);
        } else {
          setPermissions(null);
        }
      } catch (error) {
        console.error('Failed to refresh permissions:', error);
        setPermissions(null);
      }
    } else {
      setPermissions(null);
    }
    setIsLoading(false);
  };

  const switchOrganization = async (organizationId: string) => {
    setIsLoading(true);
    setCurrentOrganizationId(organizationId);
    
    if (session?.user?.id) {
      try {
        await fetch('/api/auth/switch-organization', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ organizationId }),
        });
        
        await refreshPermissions();
      } catch (error) {
        console.error('Failed to switch organization:', error);
        setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    if (!isPending) {
      if (session?.user) {
        const orgId = (session.user as any).currentOrganizationId || null;
        setCurrentOrganizationId(orgId);
        refreshPermissions();
      } else {
        setPermissions(null);
        setCurrentOrganizationId(null);
        setIsLoading(false);
      }
    }
  }, [session, isPending]);

  useEffect(() => {
    refreshPermissions();
  }, [currentOrganizationId]);

  const contextValue = {
    user: session?.user || null,
    session,
    permissions,
    currentOrganizationId,
    isLoading,
    switchOrganization,
    refreshPermissions,
  };

  return React.createElement(
    AuthContext.Provider,
    { value: contextValue },
    children
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function usePermissions() {
  const { permissions } = useAuth();
  return permissions;
}

export function useCurrentOrganization() {
  const { currentOrganizationId } = useAuth();
  return currentOrganizationId;
}