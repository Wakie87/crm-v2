import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';

export default async function Dashboard() {
  const session = await auth.api.getSession({
    headers: await headers()
  });

  if (!session) {
    return redirect('/auth/sign-in');
  } else {
    redirect('/dashboard/overview');
  }
}
