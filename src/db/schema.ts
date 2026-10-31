import { relations } from 'drizzle-orm';
import { boolean, integer, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';

// Users table
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(), // Firebase Auth UID or local ID
  email: text('email').notNull().unique(),
  fullName: text('full_name').notNull(),
  role: text('role').notNull().default('donor'), // 'donor', 'recipient', 'volunteer', 'admin'
  organization: text('organization'),
  phone: text('phone'),
  address: text('address'),
  avatarUrl: text('avatar_url'),
  isVerified: boolean('is_verified').default(true),
  createdAt: timestamp('created_at').defaultNow(),
});

// Food Donations table
export const donations = pgTable('donations', {
  id: serial('id').primaryKey(),
  donorId: integer('donor_id')
    .references(() => users.id)
    .notNull(),
  donorUid: text('donor_uid').notNull(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  category: text('category').notNull(), // 'Prepared Meals', 'Produce', 'Bakery', 'Dairy', 'Pantry', 'Other'
  quantity: text('quantity').notNull(),
  servings: integer('servings').notNull().default(10),
  expiryDate: text('expiry_date').notNull(),
  pickupLocation: text('pickup_location').notNull(),
  pickupWindow: text('pickup_window').notNull(),
  dietaryInfo: text('dietary_info'), // comma-separated or description
  storageCondition: text('storage_condition').default('Refrigerated'), // 'Ambient', 'Refrigerated', 'Frozen'
  status: text('status').notNull().default('available'), // 'available', 'claimed', 'in_transit', 'completed', 'cancelled'
  imageUrl: text('image_url'),
  recipientId: integer('recipient_id').references(() => users.id),
  volunteerId: integer('volunteer_id').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Food Claims table
export const claims = pgTable('claims', {
  id: serial('id').primaryKey(),
  donationId: integer('donation_id')
    .references(() => donations.id)
    .notNull(),
  recipientId: integer('recipient_id')
    .references(() => users.id)
    .notNull(),
  recipientUid: text('recipient_uid').notNull(),
  requestedServings: integer('requested_servings').notNull(),
  urgency: text('urgency').default('Standard'), // 'Urgent', 'Standard', 'Flexible'
  notes: text('notes'),
  status: text('status').notNull().default('pending'), // 'pending', 'approved', 'picked_up', 'delivered', 'cancelled'
  createdAt: timestamp('created_at').defaultNow(),
});

// Volunteer Deliveries table
export const deliveries = pgTable('deliveries', {
  id: serial('id').primaryKey(),
  donationId: integer('donation_id')
    .references(() => donations.id)
    .notNull(),
  claimId: integer('claim_id').references(() => claims.id),
  volunteerId: integer('volunteer_id')
    .references(() => users.id)
    .notNull(),
  volunteerUid: text('volunteer_uid').notNull(),
  status: text('status').notNull().default('assigned'), // 'assigned', 'picked_up', 'in_transit', 'delivered'
  pickupTime: timestamp('pickup_time'),
  deliveryTime: timestamp('delivery_time'),
  deliveryNotes: text('delivery_notes'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Impact Metrics Summary
export const impactMetrics = pgTable('impact_metrics', {
  id: serial('id').primaryKey(),
  totalMealsRescued: integer('total_meals_rescued').notNull().default(0),
  co2DivertedKg: integer('co2_diverted_kg').notNull().default(0),
  activeDonors: integer('active_donors').notNull().default(0),
  activeRecipients: integer('active_recipients').notNull().default(0),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Relationships
export const usersRelations = relations(users, ({ many }) => ({
  donations: many(donations, { relationName: 'donorDonations' }),
  claims: many(claims, { relationName: 'recipientClaims' }),
  deliveries: many(deliveries, { relationName: 'volunteerDeliveries' }),
}));

export const donationsRelations = relations(donations, ({ one, many }) => ({
  donor: one(users, {
    fields: [donations.donorId],
    references: [users.id],
    relationName: 'donorDonations',
  }),
  recipient: one(users, {
    fields: [donations.recipientId],
    references: [users.id],
  }),
  volunteer: one(users, {
    fields: [donations.volunteerId],
    references: [users.id],
  }),
  claims: many(claims),
  deliveries: many(deliveries),
}));

export const claimsRelations = relations(claims, ({ one, many }) => ({
  donation: one(donations, {
    fields: [claims.donationId],
    references: [donations.id],
  }),
  recipient: one(users, {
    fields: [claims.recipientId],
    references: [users.id],
    relationName: 'recipientClaims',
  }),
  deliveries: many(deliveries),
}));

export const deliveriesRelations = relations(deliveries, ({ one }) => ({
  donation: one(donations, {
    fields: [deliveries.donationId],
    references: [donations.id],
  }),
  claim: one(claims, {
    fields: [deliveries.claimId],
    references: [claims.id],
  }),
  volunteer: one(users, {
    fields: [deliveries.volunteerId],
    references: [users.id],
    relationName: 'volunteerDeliveries',
  }),
}));
