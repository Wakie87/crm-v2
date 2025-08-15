'use client';

import { Check, ChevronsUpDown, Building2 } from 'lucide-react';
import * as React from 'react';
import { useAuth } from '@/lib/auth-context';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem
} from '@/components/ui/sidebar';

interface Organization {
  id: string;
  name: string;
  slug: string;
  logo?: string | null;
}

export function OrgSwitcher() {
  const { currentOrganizationId, switchOrganization, isLoading } = useAuth();
  const [organizations, setOrganizations] = React.useState<Organization[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    async function fetchOrganizations() {
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
  }, []);

  const selectedOrganization = organizations.find(org => org.id === currentOrganizationId);

  const handleOrganizationSwitch = async (organization: Organization) => {
    await switchOrganization(organization.id);
  };

  if (loading || isLoading) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton size='lg' disabled>
            <div className='bg-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg'>
              <Building2 className='size-4' />
            </div>
            <div className='flex flex-col gap-0.5 leading-none'>
              <span className='font-semibold'>Loading...</span>
              <span className='text-xs text-muted-foreground'>Organization</span>
            </div>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    );
  }

  if (organizations.length === 0) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton size='lg' disabled>
            <div className='bg-muted flex aspect-square size-8 items-center justify-center rounded-lg'>
              <Building2 className='size-4' />
            </div>
            <div className='flex flex-col gap-0.5 leading-none'>
              <span className='font-semibold'>No Organization</span>
              <span className='text-xs text-muted-foreground'>Join an organization</span>
            </div>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    );
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size='lg'
              className='data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground'
            >
              <div className='bg-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg'>
                <Building2 className='size-4' />
              </div>
              <div className='flex flex-col gap-0.5 leading-none'>
                <span className='font-semibold'>
                  {selectedOrganization?.name || 'Select Organization'}
                </span>
                <span className='text-xs text-muted-foreground'>
                  {organizations.length} organization{organizations.length !== 1 ? 's' : ''}
                </span>
              </div>
              <ChevronsUpDown className='ml-auto' />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className='w-[--radix-dropdown-menu-trigger-width]'
            align='start'
          >
            {organizations.map((org) => (
              <DropdownMenuItem
                key={org.id}
                onSelect={() => handleOrganizationSwitch(org)}
              >
                <div className='flex items-center gap-2 w-full'>
                  <div className='flex aspect-square size-6 items-center justify-center rounded-md bg-muted'>
                    <Building2 className='size-3' />
                  </div>
                  <div className='flex-1'>
                    <div className='font-medium'>{org.name}</div>
                    <div className='text-xs text-muted-foreground'>@{org.slug}</div>
                  </div>
                  {org.id === currentOrganizationId && (
                    <Check className='size-4' />
                  )}
                </div>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
