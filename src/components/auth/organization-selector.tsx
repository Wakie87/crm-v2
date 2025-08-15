'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Building2 } from 'lucide-react';

interface Organization {
  id: string;
  name: string;
  slug: string;
}

export function OrganizationSelector() {
  const { user, currentOrganizationId, switchOrganization, isLoading } = useAuth();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchOrganizations() {
      if (!user) return;

      try {
        const response = await fetch('/api/organizations/user-organizations');
        if (response.ok) {
          const data = await response.json();
          setOrganizations(data);
        }
      } catch (error) {
        console.error('Failed to fetch organizations:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchOrganizations();
  }, [user]);

  const handleOrganizationChange = async (organizationId: string) => {
    await switchOrganization(organizationId);
  };

  if (!user || loading || isLoading) {
    return (
      <div className="flex items-center space-x-2 px-3 py-2">
        <Building2 className="h-4 w-4" />
        <span className="text-sm">Loading...</span>
      </div>
    );
  }

  if (organizations.length === 0) {
    return (
      <div className="flex items-center space-x-2 px-3 py-2">
        <Building2 className="h-4 w-4" />
        <span className="text-sm text-muted-foreground">No organizations</span>
      </div>
    );
  }

  return (
    <div className="px-3 py-2">
      <Select
        value={currentOrganizationId || ''}
        onValueChange={handleOrganizationChange}
      >
        <SelectTrigger className="w-full">
          <div className="flex items-center space-x-2">
            <Building2 className="h-4 w-4" />
            <SelectValue placeholder="Select organization" />
          </div>
        </SelectTrigger>
        <SelectContent>
          {organizations.map((org) => (
            <SelectItem key={org.id} value={org.id}>
              {org.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}