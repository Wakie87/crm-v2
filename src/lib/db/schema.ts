import { pgTable, text, timestamp, boolean, uuid, integer, primaryKey, unique, jsonb } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const user = pgTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('emailVerified').notNull(),
  image: text('image'),
  createdAt: timestamp('createdAt').notNull(),
  updatedAt: timestamp('updatedAt').notNull(),
  role: text('role').default('user').notNull(),
  banned: boolean('banned').default(false),
  banReason: text('banReason'),
  banExpires: timestamp('banExpires'),
  currentOrganizationId: uuid('currentOrganizationId')
});

export const session = pgTable('session', {
  id: text('id').primaryKey(),
  expiresAt: timestamp('expiresAt').notNull(),
  token: text('token').notNull().unique(),
  createdAt: timestamp('createdAt').notNull(),
  updatedAt: timestamp('updatedAt').notNull(),
  ipAddress: text('ipAddress'),
  userAgent: text('userAgent'),
  userId: text('userId')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  impersonatedBy: text('impersonatedBy'),
  organizationId: uuid('organizationId')
});

export const account = pgTable('account', {
  id: text('id').primaryKey(),
  accountId: text('accountId').notNull(),
  providerId: text('providerId').notNull(),
  userId: text('userId')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  accessToken: text('accessToken'),
  refreshToken: text('refreshToken'),
  idToken: text('idToken'),
  accessTokenExpiresAt: timestamp('accessTokenExpiresAt'),
  refreshTokenExpiresAt: timestamp('refreshTokenExpiresAt'),
  scope: text('scope'),
  password: text('password'),
  createdAt: timestamp('createdAt').notNull(),
  updatedAt: timestamp('updatedAt').notNull()
});

export const verification = pgTable('verification', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expiresAt').notNull(),
  createdAt: timestamp('createdAt'),
  updatedAt: timestamp('updatedAt')
});

export const organization = pgTable('organization', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  description: text('description'),
  logo: text('logo'),
  website: text('website'),
  settings: jsonb('settings').default('{}'),
  plan: text('plan').default('free').notNull(),
  subscriptionStatus: text('subscriptionStatus').default('active').notNull(),
  maxUsers: integer('maxUsers').default(5),
  maxStorage: integer('maxStorage').default(1000),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
  ownerId: text('ownerId')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  isActive: boolean('isActive').default(true).notNull()
});

export const organizationMember = pgTable('organizationMember', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organizationId')
    .notNull()
    .references(() => organization.id, { onDelete: 'cascade' }),
  userId: text('userId')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  roleId: uuid('roleId')
    .notNull()
    .references(() => role.id, { onDelete: 'cascade' }),
  joinedAt: timestamp('joinedAt').notNull().defaultNow(),
  invitedAt: timestamp('invitedAt'),
  invitedBy: text('invitedBy').references(() => user.id),
  status: text('status').default('active').notNull(),
  permissions: jsonb('permissions').default('{}')
}, (table) => ({
  uniqueUserOrg: unique().on(table.organizationId, table.userId)
}));

export const role = pgTable('role', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  description: text('description'),
  organizationId: uuid('organizationId')
    .references(() => organization.id, { onDelete: 'cascade' }),
  isSystemRole: boolean('isSystemRole').default(false),
  permissions: jsonb('permissions').default('[]').notNull(),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow()
}, (table) => ({
  uniqueNamePerOrg: unique().on(table.name, table.organizationId)
}));

export const permission = pgTable('permission', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull().unique(),
  description: text('description'),
  category: text('category').notNull(),
  resource: text('resource').notNull(),
  action: text('action').notNull(),
  isSystemPermission: boolean('isSystemPermission').default(false),
  createdAt: timestamp('createdAt').notNull().defaultNow()
});

export const organizationInvitation = pgTable('organizationInvitation', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organizationId')
    .notNull()
    .references(() => organization.id, { onDelete: 'cascade' }),
  email: text('email').notNull(),
  roleId: uuid('roleId')
    .notNull()
    .references(() => role.id, { onDelete: 'cascade' }),
  token: text('token').notNull().unique(),
  invitedBy: text('invitedBy')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  expiresAt: timestamp('expiresAt').notNull(),
  acceptedAt: timestamp('acceptedAt'),
  createdAt: timestamp('createdAt').notNull().defaultNow()
}, (table) => ({
  uniqueEmailOrg: unique().on(table.organizationId, table.email)
}));

export const auditLog = pgTable('auditLog', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organizationId')
    .references(() => organization.id, { onDelete: 'cascade' }),
  userId: text('userId')
    .references(() => user.id, { onDelete: 'set null' }),
  action: text('action').notNull(),
  resource: text('resource').notNull(),
  resourceId: text('resourceId'),
  details: jsonb('details').default('{}'),
  ipAddress: text('ipAddress'),
  userAgent: text('userAgent'),
  createdAt: timestamp('createdAt').notNull().defaultNow()
});

export const userRelations = relations(user, ({ many, one }) => ({
  organizationMembers: many(organizationMember),
  ownedOrganizations: many(organization, { relationName: 'organizationOwner' }),
  currentOrganization: one(organization, {
    fields: [user.currentOrganizationId],
    references: [organization.id]
  }),
  sessions: many(session),
  accounts: many(account),
  auditLogs: many(auditLog)
}));

export const organizationRelations = relations(organization, ({ many, one }) => ({
  members: many(organizationMember),
  owner: one(user, {
    fields: [organization.ownerId],
    references: [user.id],
    relationName: 'organizationOwner'
  }),
  roles: many(role),
  invitations: many(organizationInvitation),
  auditLogs: many(auditLog)
}));

export const organizationMemberRelations = relations(organizationMember, ({ one }) => ({
  organization: one(organization, {
    fields: [organizationMember.organizationId],
    references: [organization.id]
  }),
  user: one(user, {
    fields: [organizationMember.userId],
    references: [user.id]
  }),
  role: one(role, {
    fields: [organizationMember.roleId],
    references: [role.id]
  }),
  invitedByUser: one(user, {
    fields: [organizationMember.invitedBy],
    references: [user.id],
    relationName: 'invitedBy'
  })
}));

export const roleRelations = relations(role, ({ one, many }) => ({
  organization: one(organization, {
    fields: [role.organizationId],
    references: [organization.id]
  }),
  members: many(organizationMember),
  invitations: many(organizationInvitation)
}));

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, {
    fields: [session.userId],
    references: [user.id]
  }),
  organization: one(organization, {
    fields: [session.organizationId],
    references: [organization.id]
  })
}));

export const organizationInvitationRelations = relations(organizationInvitation, ({ one }) => ({
  organization: one(organization, {
    fields: [organizationInvitation.organizationId],
    references: [organization.id]
  }),
  role: one(role, {
    fields: [organizationInvitation.roleId],
    references: [role.id]
  }),
  invitedByUser: one(user, {
    fields: [organizationInvitation.invitedBy],
    references: [user.id]
  })
}));

export const auditLogRelations = relations(auditLog, ({ one }) => ({
  organization: one(organization, {
    fields: [auditLog.organizationId],
    references: [organization.id]
  }),
  user: one(user, {
    fields: [auditLog.userId],
    references: [user.id]
  })
}));
