'use client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useSession } from '@/lib/auth-client';

export default function ProfileViewPage() {
  const { data: session } = useSession();

  if (!session?.user) {
    return <div>Loading...</div>;
  }

  return (
    <div className='flex w-full flex-col p-4'>
      <Card>
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div>
            <label className='text-sm font-medium'>Name</label>
            <div className='mt-1 text-sm text-gray-600'>
              {session.user.name}
            </div>
          </div>
          <div>
            <label className='text-sm font-medium'>Email</label>
            <div className='mt-1 text-sm text-gray-600'>
              {session.user.email}
            </div>
          </div>
          <div>
            <label className='text-sm font-medium'>Email Verified</label>
            <div className='mt-1 text-sm text-gray-600'>
              {session.user.emailVerified ? 'Yes' : 'No'}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
