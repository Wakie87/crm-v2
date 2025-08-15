import { config } from 'dotenv';
config(); // Load environment variables

import { createAuthClient } from 'better-auth/client';
import { adminClient, organizationClient } from 'better-auth/client/plugins';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { eq, and } from 'drizzle-orm';
import * as schema from '../src/lib/db/schema';

// Create auth client for seeding
const authClient = createAuthClient({
  baseURL: process.env.BETTER_AUTH_URL || 'http://localhost:3000',
  plugins: [
    adminClient(),
    organizationClient()
  ]
});

// Database connection
const connectionString = process.env.DATABASE_URL!;
if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is not set');
}
const client = postgres(connectionString, { prepare: false });
const db = drizzle(client, { schema });

// Permissions data
const permissions = [
  // Organization Management
  { name: 'organization:read', description: 'View organization details', category: 'organization', resource: 'organization', action: 'read', isSystemPermission: true },
  { name: 'organization:update', description: 'Update organization settings', category: 'organization', resource: 'organization', action: 'update', isSystemPermission: true },
  { name: 'organization:delete', description: 'Delete organization', category: 'organization', resource: 'organization', action: 'delete', isSystemPermission: true },
  { name: 'organization:billing', description: 'Manage organization billing', category: 'organization', resource: 'organization', action: 'billing', isSystemPermission: true },

  // User Management
  { name: 'user:read', description: 'View users in organization', category: 'user', resource: 'user', action: 'read', isSystemPermission: true },
  { name: 'user:create', description: 'Invite users to organization', category: 'user', resource: 'user', action: 'create', isSystemPermission: true },
  { name: 'user:update', description: 'Update user details', category: 'user', resource: 'user', action: 'update', isSystemPermission: true },
  { name: 'user:delete', description: 'Remove users from organization', category: 'user', resource: 'user', action: 'delete', isSystemPermission: true },
  { name: 'user:impersonate', description: 'Impersonate other users', category: 'user', resource: 'user', action: 'impersonate', isSystemPermission: true },

  // Role Management
  { name: 'role:read', description: 'View roles in organization', category: 'role', resource: 'role', action: 'read', isSystemPermission: true },
  { name: 'role:create', description: 'Create new roles', category: 'role', resource: 'role', action: 'create', isSystemPermission: true },
  { name: 'role:update', description: 'Update role permissions', category: 'role', resource: 'role', action: 'update', isSystemPermission: true },
  { name: 'role:delete', description: 'Delete roles', category: 'role', resource: 'role', action: 'delete', isSystemPermission: true },
  { name: 'role:assign', description: 'Assign roles to users', category: 'role', resource: 'role', action: 'assign', isSystemPermission: true },

  // Content Management
  { name: 'content:read', description: 'View content', category: 'content', resource: 'content', action: 'read', isSystemPermission: true },
  { name: 'content:create', description: 'Create new content', category: 'content', resource: 'content', action: 'create', isSystemPermission: true },
  { name: 'content:update', description: 'Update existing content', category: 'content', resource: 'content', action: 'update', isSystemPermission: true },
  { name: 'content:delete', description: 'Delete content', category: 'content', resource: 'content', action: 'delete', isSystemPermission: true },
  { name: 'content:publish', description: 'Publish content', category: 'content', resource: 'content', action: 'publish', isSystemPermission: true },

  // Analytics
  { name: 'analytics:read', description: 'View analytics and reports', category: 'analytics', resource: 'analytics', action: 'read', isSystemPermission: true },
  { name: 'analytics:export', description: 'Export analytics data', category: 'analytics', resource: 'analytics', action: 'export', isSystemPermission: true },

  // Settings
  { name: 'settings:read', description: 'View organization settings', category: 'settings', resource: 'settings', action: 'read', isSystemPermission: true },
  { name: 'settings:update', description: 'Update organization settings', category: 'settings', resource: 'settings', action: 'update', isSystemPermission: true },

  // Platform Admin (for superadmin)
  { name: 'platform:organizations', description: 'Manage all organizations', category: 'platform', resource: 'platform', action: 'organizations', isSystemPermission: true },
  { name: 'platform:users', description: 'Manage all platform users', category: 'platform', resource: 'platform', action: 'users', isSystemPermission: true },
  { name: 'platform:billing', description: 'Manage platform billing', category: 'platform', resource: 'platform', action: 'billing', isSystemPermission: true },
  { name: 'platform:settings', description: 'Manage platform settings', category: 'platform', resource: 'platform', action: 'settings', isSystemPermission: true }
];

// Helper function to create users using Better Auth client
async function createUser(userData: {
  name: string;
  email: string;
  password: string;
  role?: string;
}) {
  try {
    console.log(`🔄 Creating user: ${userData.email}`);
    
    // Use Better Auth client to create user with proper password hashing
    const result = await authClient.signUp.email({
      email: userData.email,
      password: userData.password,
      name: userData.name,
    });

    if (result.error) {
      if (result.error.message?.includes('already exists')) {
        console.log(`⚠️ User ${userData.email} already exists`);
        // Get existing user
        const [existingUser] = await db.select().from(schema.user).where(eq(schema.user.email, userData.email)).limit(1);
        return existingUser;
      }
      throw new Error(`Failed to create user ${userData.email}: ${result.error.message}`);
    }

    // Update user role if specified (Better Auth creates users with default role)
    if (userData.role && userData.role !== 'user' && result.data?.user) {
      await db.update(schema.user)
        .set({ 
          role: userData.role,
          emailVerified: true // Ensure email is verified for demo users
        })
        .where(eq(schema.user.id, result.data.user.id));
      
      // Get the updated user record
      const [updatedUser] = await db.select().from(schema.user).where(eq(schema.user.id, result.data.user.id));
      console.log(`✅ Created user: ${userData.email} with role: ${userData.role}`);
      return updatedUser;
    }

    console.log(`✅ Created user: ${userData.email}`);
    return result.data?.user;
  } catch (error) {
    console.error(`❌ Error creating user ${userData.email}:`, error);
    throw error;
  }
}

async function main() {
  try {
    console.log('🚀 Starting database seeding...\n');

    // Clean up existing user data (but keep permissions and roles)
    console.log('🧹 Cleaning up existing user data...');
    await db.delete(schema.organizationMember);
    await db.delete(schema.account);
    await db.delete(schema.user);
    await db.delete(schema.organization);
    console.log('✅ Cleanup completed\n');

    // Step 1: Seed permissions
    console.log('🌱 Seeding permissions...');
    for (const perm of permissions) {
      await db.insert(schema.permission).values(perm).onConflictDoNothing();
    }
    console.log(`✅ Successfully seeded ${permissions.length} permissions\n`);

    // Step 2: Seed system roles
    console.log('🌱 Seeding system roles...');
    const allPermissions = await db.select().from(schema.permission);
    const permissionNames = allPermissions.map(p => p.name);

    const systemRoles = [
      {
        name: 'Super Admin',
        description: 'Platform super administrator with all permissions',
        organizationId: null,
        isSystemRole: true,
        permissions: permissionNames // All permissions
      },
      {
        name: 'Platform Admin',
        description: 'Platform administrator with limited permissions',
        organizationId: null,
        isSystemRole: true,
        permissions: [
          'platform:organizations',
          'platform:users',
          'analytics:read',
          'analytics:export'
        ]
      }
    ];

    for (const roleData of systemRoles) {
      await db.insert(schema.role).values({
        ...roleData,
        permissions: JSON.stringify(roleData.permissions)
      }).onConflictDoNothing();
    }
    console.log(`✅ Successfully seeded ${systemRoles.length} system roles\n`);

    // Step 3: Create demo users
    console.log('🌱 Creating demo users...');
    const demoUsers = [
      {
        name: 'Super Admin',
        email: 'admin@example.com',
        password: 'password123',
        role: 'superadmin'
      },
      {
        name: 'John Doe',
        email: 'john@acmecorp.com',
        password: 'password123',
        role: 'user'
      },
      {
        name: 'Jane Smith',
        email: 'jane@acmecorp.com',
        password: 'password123',
        role: 'user'
      },
      {
        name: 'Bob Wilson',
        email: 'bob@acmecorp.com',
        password: 'password123',
        role: 'user'
      },
      {
        name: 'Alice Johnson',
        email: 'alice@techstart.io',
        password: 'password123',
        role: 'user'
      }
    ];

    const createdUsers: Record<string, any> = {};
    for (const userData of demoUsers) {
      const user = await createUser(userData);
      createdUsers[userData.email] = user;
    }
    console.log('');

    // Step 4: Create demo organizations
    console.log('🌱 Creating demo organizations...');
    const johnUser = createdUsers['john@acmecorp.com'];
    const aliceUser = createdUsers['alice@techstart.io'];

    if (!johnUser || !aliceUser) {
      throw new Error('Required users not created properly');
    }

    const demoOrgs = [
      {
        name: 'Acme Corporation',
        slug: 'acme-corp',
        description: 'A leading technology company',
        plan: 'pro',
        subscriptionStatus: 'active',
        maxUsers: 50,
        maxStorage: 10000,
        ownerId: johnUser.id,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'TechStart',
        slug: 'techstart',
        description: 'An innovative startup',
        plan: 'free',
        subscriptionStatus: 'active',
        maxUsers: 5,
        maxStorage: 1000,
        ownerId: aliceUser.id,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    const createdOrgs: Record<string, any> = {};
    for (const orgData of demoOrgs) {
      const [insertedOrg] = await db.insert(schema.organization).values(orgData).onConflictDoNothing().returning();
      if (insertedOrg) {
        createdOrgs[orgData.slug] = insertedOrg;
        console.log(`✅ Created organization: ${orgData.name}`);
      } else {
        // Get existing org
        const [existingOrg] = await db.select().from(schema.organization).where(eq(schema.organization.slug, orgData.slug));
        if (existingOrg) {
          createdOrgs[orgData.slug] = existingOrg;
          console.log(`⚠️ Organization ${orgData.name} already exists`);
        }
      }
    }
    console.log('');

    // Step 5: Create organization roles
    console.log('🌱 Creating organization roles...');
    const orgRoleTemplates = [
      { name: 'Owner', permissions: ['organization:read', 'organization:update', 'organization:delete', 'user:read', 'user:create', 'user:update', 'user:delete', 'role:read', 'role:create', 'role:update', 'role:delete', 'role:assign', 'content:read', 'content:create', 'content:update', 'content:delete', 'content:publish', 'analytics:read', 'analytics:export', 'settings:read', 'settings:update'] },
      { name: 'Admin', permissions: ['organization:read', 'user:read', 'user:create', 'user:update', 'role:read', 'role:assign', 'content:read', 'content:create', 'content:update', 'content:delete', 'content:publish', 'analytics:read', 'settings:read'] },
      { name: 'Editor', permissions: ['organization:read', 'user:read', 'content:read', 'content:create', 'content:update', 'analytics:read'] },
      { name: 'Viewer', permissions: ['organization:read', 'user:read', 'content:read', 'analytics:read'] }
    ];

    const orgRoles: Record<string, Record<string, any>> = {};
    for (const [orgSlug, org] of Object.entries(createdOrgs)) {
      orgRoles[org.id] = {};
      
      for (const template of orgRoleTemplates) {
        const roleData = {
          name: template.name,
          description: `${template.name} role for ${org.name}`,
          organizationId: org.id,
          isSystemRole: false,
          permissions: JSON.stringify(template.permissions),
          createdAt: new Date(),
          updatedAt: new Date()
        };

        const [insertedRole] = await db.insert(schema.role).values(roleData).onConflictDoNothing().returning();
        if (insertedRole) {
          orgRoles[org.id][template.name] = insertedRole;
        } else {
          // Get existing role
          const [existingRole] = await db.select().from(schema.role)
            .where(and(
              eq(schema.role.name, template.name),
              eq(schema.role.organizationId, org.id)
            ));
          if (existingRole) {
            orgRoles[org.id][template.name] = existingRole;
          }
        }
      }
    }
    console.log('✅ Organization roles created\n');

    // Step 6: Create organization memberships
    console.log('🌱 Creating organization memberships...');
    const acmeOrg = createdOrgs['acme-corp'];
    const techStartOrg = createdOrgs['techstart'];

    const memberships = [
      // Acme Corp members
      {
        organizationId: acmeOrg.id,
        userId: johnUser.id,
        roleId: orgRoles[acmeOrg.id]['Owner'].id,
        joinedAt: new Date(),
        status: 'active'
      },
      {
        organizationId: acmeOrg.id,
        userId: createdUsers['jane@acmecorp.com'].id,
        roleId: orgRoles[acmeOrg.id]['Admin'].id,
        joinedAt: new Date(),
        status: 'active',
        invitedBy: johnUser.id,
        invitedAt: new Date()
      },
      {
        organizationId: acmeOrg.id,
        userId: createdUsers['bob@acmecorp.com'].id,
        roleId: orgRoles[acmeOrg.id]['Editor'].id,
        joinedAt: new Date(),
        status: 'active',
        invitedBy: johnUser.id,
        invitedAt: new Date()
      },
      // TechStart members
      {
        organizationId: techStartOrg.id,
        userId: aliceUser.id,
        roleId: orgRoles[techStartOrg.id]['Owner'].id,
        joinedAt: new Date(),
        status: 'active'
      }
    ];

    for (const membership of memberships) {
      await db.insert(schema.organizationMember).values(membership).onConflictDoNothing();
    }

    // Update users' current organization
    await db.update(schema.user)
      .set({ currentOrganizationId: acmeOrg.id })
      .where(eq(schema.user.id, johnUser.id));

    await db.update(schema.user)
      .set({ currentOrganizationId: acmeOrg.id })
      .where(eq(schema.user.id, createdUsers['jane@acmecorp.com'].id));

    await db.update(schema.user)
      .set({ currentOrganizationId: acmeOrg.id })
      .where(eq(schema.user.id, createdUsers['bob@acmecorp.com'].id));

    await db.update(schema.user)
      .set({ currentOrganizationId: techStartOrg.id })
      .where(eq(schema.user.id, aliceUser.id));

    console.log('✅ Organization memberships created\n');

    console.log('🎉 Database seeding completed successfully!');
    console.log('\n📧 Demo Login Credentials:');
    console.log('Super Admin: admin@example.com / password123');
    console.log('Org Owner (Acme): john@acmecorp.com / password123');
    console.log('Org Admin (Acme): jane@acmecorp.com / password123');
    console.log('Org Editor (Acme): bob@acmecorp.com / password123');
    console.log('Org Owner (TechStart): alice@techstart.io / password123');

    console.log('\n🔗 Next steps:');
    console.log('1. Start the development server: pnpm dev');
    console.log('2. Navigate to /auth/sign-in');
    console.log('3. Use the demo credentials shown above');
    console.log('4. Explore the multi-tenant dashboard');

  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();