import { Breadcrumbs } from '@/components/breadcrumbs';
import PageContainer from '@/components/layout/page-container';
import { NewUserForm } from '@/components/forms/new-user-form';
import { Heading } from '@/components/ui/heading';
import { Separator } from '@/components/ui/separator';

const breadcrumbItems = [
  { title: 'Dashboard', link: '/dashboard' },
  { title: 'Users', link: '/dashboard/users' },
  { title: 'New User', link: '/dashboard/users/new' }
];

export default function NewUserPage() {
  return (
    <PageContainer scrollable>
      <div className="space-y-4">
        <Breadcrumbs />

        <div className="flex items-start justify-between">
          <Heading
            title="Create New User"
            description="Add a new user to the system"
          />
        </div>
        <Separator />
        <NewUserForm />
      </div>
    </PageContainer>
  );
}