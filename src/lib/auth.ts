import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { admin, organization } from 'better-auth/plugins';
import { db } from './db';
import { 
  account, 
  session, 
  user, 
  verification,
  organization as orgTable,
  organizationMember,
  organizationInvitation
} from './db/schema';

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema: {
      user,
      session,
      account,
      verification,
      organization: orgTable,
      member: organizationMember,
      invitation: organizationInvitation
    }
  }),
  emailAndPassword: {
    enabled: true
  },
  plugins: [
    admin(),
    organization({
      allowUserToCreateOrganization: true,
      organizationLimit: 3,
      createdOrganizationLimit: 1,
      memberLimit: 10
    })
  ],
  socialProviders: {
    ...(process.env.GITHUB_CLIENT_ID &&
      process.env.GITHUB_CLIENT_SECRET && {
        github: {
          clientId: process.env.GITHUB_CLIENT_ID,
          clientSecret: process.env.GITHUB_CLIENT_SECRET
        }
      }),
    ...(process.env.GOOGLE_CLIENT_ID &&
      process.env.GOOGLE_CLIENT_SECRET && {
        google: {
          clientId: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET
        }
      })
  },
  secret: process.env.BETTER_AUTH_SECRET!,
  baseURL: process.env.BETTER_AUTH_URL || 'http://localhost:3000',
  session: {
    updateAge: 24 * 60 * 60,
    expiresIn: 60 * 60 * 24 * 7
  }
});

export type Session = typeof auth.$Infer.Session;
