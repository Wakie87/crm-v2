'use client';

import { createAuthClient } from 'better-auth/react';
import { adminClient, organizationClient } from 'better-auth/client/plugins';

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL || 'http://localhost:3000',
  plugins: [
    adminClient(),
    organizationClient()
  ]
});

// Export client methods directly from authClient
export const { signIn, signUp, signOut, useSession } = authClient;
