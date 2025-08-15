// Load environment variables silently
require('dotenv').config({ debug: false });

async function createSuperAdmin() {
  try {
    console.log('🔄 Creating super admin using Better Auth API...');

    // Use Better Auth's sign-up endpoint to create the admin user
    const signUpUrl = `${process.env.BETTER_AUTH_URL || 'http://localhost:3000'}/api/auth/sign-up/email`;

    const response = await fetch(signUpUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'admin@example.com',
        password: 'password123',
        name: 'Super Admin'
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Failed to create admin user: ${response.status} ${response.statusText}\n${errorText}`
      );
    }

    const result = await response.json();

    console.log('✅ Super Admin user created successfully via Better Auth!');
    console.log('📧 Email: admin@example.com');
    console.log('🔑 Password: password123');
    console.log('🆔 User ID:', result.user.id);
    console.log('🎫 Auth Token:', result.token);
    console.log('\n📝 User Details:', {
      id: result.user.id,
      email: result.user.email,
      name: result.user.name,
      emailVerified: result.user.emailVerified,
      createdAt: result.user.createdAt
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes('409')) {
      console.log('ℹ️ Admin user already exists with email: admin@example.com');
      console.log('📧 Email: admin@example.com');
      console.log('🔑 Password: password123');
    } else {
      console.error(
        '❌ Error creating super admin:',
        error instanceof Error ? error.message : error
      );
    }
  }
}

createSuperAdmin();
