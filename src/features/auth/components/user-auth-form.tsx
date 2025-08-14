'use client';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { signIn, signUp } from '@/lib/auth-client';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import * as z from 'zod';
import GithubSignInButton from './github-auth-button';

const signinSchema = z.object({
  email: z.string().email({ message: 'Enter a valid email address' }),
  password: z
    .string()
    .min(6, { message: 'Password must be at least 6 characters' })
});

const signupSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters' }),
  email: z.string().email({ message: 'Enter a valid email address' }),
  password: z
    .string()
    .min(6, { message: 'Password must be at least 6 characters' })
});

type SignInFormValue = z.infer<typeof signinSchema>;
type SignUpFormValue = z.infer<typeof signupSchema>;

interface UserAuthFormProps {
  mode: 'signin' | 'signup';
}

export function UserAuthForm({ mode }: UserAuthFormProps) {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl');
  const router = useRouter();
  const [loading, startTransition] = useTransition();

  const isSignUp = mode === 'signup';
  const schema = isSignUp ? signupSchema : signinSchema;

  const defaultValues = isSignUp
    ? { name: '', email: '', password: '' }
    : { email: '', password: '' };

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues
  });

  const onSubmit = async (data: SignInFormValue | SignUpFormValue) => {
    startTransition(async () => {
      try {
        if (isSignUp) {
          const signUpData = data as SignUpFormValue;
          const result = await signUp.email({
            email: signUpData.email,
            password: signUpData.password,
            name: signUpData.name
          });

          if (result.data) {
            toast.success('Account created successfully!');
            router.push(callbackUrl || '/dashboard');
          }
        } else {
          const signInData = data as SignInFormValue;
          const result = await signIn.email({
            email: signInData.email,
            password: signInData.password
          });

          if (result.data) {
            toast.success('Signed in successfully!');
            router.push(callbackUrl || '/dashboard');
          }
        }
      } catch (error) {
        toast.error(
          isSignUp ? 'Failed to create account' : 'Failed to sign in'
        );
        console.error('Auth error:', error);
      }
    });
  };

  return (
    <>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className='w-full space-y-2'
        >
          {isSignUp && (
            <FormField
              control={form.control}
              name='name'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input
                      type='text'
                      placeholder='Enter your name...'
                      disabled={loading}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          <FormField
            control={form.control}
            name='email'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input
                    type='email'
                    placeholder='Enter your email...'
                    disabled={loading}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name='password'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <Input
                    type='password'
                    placeholder='Enter your password...'
                    disabled={loading}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button
            disabled={loading}
            className='mt-2 ml-auto w-full'
            type='submit'
          >
            {isSignUp ? 'Create Account' : 'Sign In'}
          </Button>
        </form>
      </Form>
      <div className='relative'>
        <div className='absolute inset-0 flex items-center'>
          <span className='w-full border-t' />
        </div>
        <div className='relative flex justify-center text-xs uppercase'>
          <span className='bg-background text-muted-foreground px-2'>
            Or continue with
          </span>
        </div>
      </div>
      <GithubSignInButton />
    </>
  );
}
