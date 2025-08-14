'use client';

import { createAuthClient } from 'better-auth/react';

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL || 'http://localhost:3001'
});

// Export client methods directly from authClient
export const { signIn, signUp, signOut, useSession } = authClient;
