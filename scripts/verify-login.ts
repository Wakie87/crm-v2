#!/usr/bin/env tsx
import { config } from 'dotenv';
config();

import { createAuthClient } from 'better-auth/client';
import { adminClient, organizationClient } from 'better-auth/client/plugins';

const authClient = createAuthClient({
  baseURL: process.env.BETTER_AUTH_URL || 'http://localhost:3000',
  plugins: [
    adminClient(),
    organizationClient()
  ]
});

async function verifyLogin() {
  try {
    console.log('🔐 Verifying login with seeded superadmin user...');
    
    const result = await authClient.signIn.email({
      email: 'admin@example.com',
      password: 'password123'
    });

    if (result.data?.user) {
      console.log('✅ Login successful!');
      console.log(`User: ${result.data.user.name} (${result.data.user.email})`);
      console.log(`Role: ${result.data.user.role}`);
      console.log(`Email Verified: ${result.data.user.emailVerified}`);
    } else if (result.error) {
      console.log('❌ Login failed:', result.error.message);
    } else {
      console.log('❌ Login failed - unknown error');
    }
  } catch (error) {
    console.error('❌ Login verification failed:', error);
  }
}

verifyLogin();