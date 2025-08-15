#!/usr/bin/env tsx
import { config } from 'dotenv';
config();

import { auth } from '../src/lib/auth';

async function testLogin() {
  try {
    console.log('🔐 Testing login with seeded user...');
    
    // Test the superadmin login
    const result = await auth.api.signInEmail({
      body: {
        email: 'admin@example.com',
        password: 'password123'
      }
    });

    if (result.user) {
      console.log('✅ Login successful!');
      console.log(`User: ${result.user.name} (${result.user.email})`);
      console.log(`Role: ${result.user.role}`);
    } else {
      console.log('❌ Login failed - no user returned');
    }
  } catch (error) {
    console.error('❌ Login test failed:', error);
  }
}

testLogin();