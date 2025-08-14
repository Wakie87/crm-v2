'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';
import { signIn } from '@/lib/auth-client';
import { toast } from 'sonner';

export default function GithubSignInButton() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl');
  const router = useRouter();

  const handleGithubSignIn = async () => {
    try {
      const result = await signIn.social({
        provider: 'github',
        callbackURL: callbackUrl || '/dashboard'
      });

      if (result.data) {
        toast.success('Signed in successfully!');
        router.push(callbackUrl || '/dashboard');
      }
    } catch (error) {
      toast.error('Failed to sign in with GitHub');
      console.error('GitHub auth error:', error);
    }
  };

  return (
    <Button
      className='w-full'
      variant='outline'
      type='button'
      onClick={handleGithubSignIn}
    >
      <Icons.github className='mr-2 h-4 w-4' />
      Continue with Github
    </Button>
  );
}
