import { Breadcrumbs } from '@/components/breadcrumbs';
import PageContainer from '@/components/layout/page-container';
import { UsersTable } from '@/components/tables/users-table';
import { UserRoleCheck } from '@/components/user-role-check';
import { buttonVariants } from '@/components/ui/button';
import { Heading } from '@/components/ui/heading';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { Plus } from 'lucide-react';
import Link from 'next/link';

export default function UsersPage() {
  return (
    <PageContainer scrollable>
      <div className="flex flex-1 flex-col space-y-4">

        <div className="flex items-start justify-between">
          <Heading
            title="Users Management"
            description="Manage user accounts, roles, and permissions"
          />

          <Link
            href="/dashboard/users/new"
            className={cn(buttonVariants({ variant: 'default' }))}
          >
            <Plus className="mr-2 h-4 w-4" /> Add User
          </Link>
        </div>
        <Separator />
        <UserRoleCheck />
        <UsersTable />
      </div>
    </PageContainer>
  );
}