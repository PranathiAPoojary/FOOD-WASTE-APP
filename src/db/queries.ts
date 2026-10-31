import { eq, desc, sql } from 'drizzle-orm';
import { db } from './index.ts';
import { users, donations, claims, deliveries, impactMetrics } from './schema.ts';

// ----------------- USERS -----------------
export async function getAllUsers() {
  try {
    return await db.select().from(users).orderBy(desc(users.createdAt));
  } catch (error) {
    console.error('Failed to get all users from database:', error);
    throw new Error('Database error retrieving users list.', { cause: error });
  }
}

export async function getUserByUid(uid: string) {
  try {
    const records = await db.select().from(users).where(eq(users.uid, uid)).limit(1);
    return records[0] || null;
  } catch (error) {
    console.error(`Failed to get user by UID ${uid}:`, error);
    throw new Error('Database error retrieving user profile.', { cause: error });
  }
}

export async function getUserById(id: number) {
  try {
    const records = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return records[0] || null;
  } catch (error) {
    console.error(`Failed to get user by ID ${id}:`, error);
    throw new Error('Database error retrieving user profile.', { cause: error });
  }
}

export async function upsertUser(data: {
  uid: string;
  email: string;
  fullName: string;
  role?: string;
  organization?: string;
  phone?: string;
  address?: string;
  avatarUrl?: string;
}) {
  try {
    const result = await db
      .insert(users)
      .values({
        uid: data.uid,
        email: data.email,
        fullName: data.fullName,
        role: data.role || 'donor',
        organization: data.organization || null,
        phone: data.phone || null,
        address: data.address || null,
        avatarUrl: data.avatarUrl || null,
        isVerified: true,
      })
      .onConflictDoUpdate({
        target: users.uid,
        set: {
          email: data.email,
          fullName: data.fullName,
          organization: data.organization || sql`${users.organization}`,
          phone: data.phone || sql`${users.phone}`,
          address: data.address || sql`${users.address}`,
          avatarUrl: data.avatarUrl || sql`${users.avatarUrl}`,
        },
      })
      .returning();

    return result[0];
  } catch (error) {
    console.error('Failed to upsert user in database:', error);
    throw new Error('Database error synchronizing user account.', { cause: error });
  }
}

export async function updateUser(
  id: number,
  data: Partial<typeof users.$inferInsert>
) {
  try {
    const result = await db
      .update(users)
      .set(data)
      .where(eq(users.id, id))
      .returning();
    return result[0];
  } catch (error) {
    console.error(`Failed to update user ${id}:`, error);
    throw new Error('Database error updating user record.', { cause: error });
  }
}

export async function deleteUser(id: number) {
  try {
    const result = await db.delete(users).where(eq(users.id, id)).returning();
    return result[0];
  } catch (error) {
    console.error(`Failed to delete user ${id}:`, error);
    throw new Error('Database error deleting user record.', { cause: error });
  }
}

// ----------------- DONATIONS -----------------
export async function getDonations(filter?: {
  status?: string;
  category?: string;
  donorId?: number;
}) {
  try {
    const query = db.select({
      id: donations.id,
      donorId: donations.donorId,
      donorUid: donations.donorUid,
      title: donations.title,
      description: donations.description,
      category: donations.category,
      quantity: donations.quantity,
      servings: donations.servings,
      expiryDate: donations.expiryDate,
      pickupLocation: donations.pickupLocation,
      pickupWindow: donations.pickupWindow,
      dietaryInfo: donations.dietaryInfo,
      storageCondition: donations.storageCondition,
      status: donations.status,
      imageUrl: donations.imageUrl,
      recipientId: donations.recipientId,
      volunteerId: donations.volunteerId,
      createdAt: donations.createdAt,
      donorName: users.fullName,
      donorEmail: users.email,
      donorOrg: users.organization,
      donorPhone: users.phone,
    })
    .from(donations)
    .leftJoin(users, eq(donations.donorId, users.id))
    .orderBy(desc(donations.createdAt));

    const rows = await query;

    return rows.filter((d) => {
      if (filter?.status && filter.status !== 'all' && d.status !== filter.status) {
        return false;
      }
      if (filter?.category && filter.category !== 'all' && d.category !== filter.category) {
        return false;
      }
      if (filter?.donorId && d.donorId !== filter.donorId) {
        return false;
      }
      return true;
    });
  } catch (error) {
    console.error('Failed to query donations:', error);
    throw new Error('Database error querying food donations.', { cause: error });
  }
}

export async function getDonationById(id: number) {
  try {
    const rows = await db
      .select({
        id: donations.id,
        donorId: donations.donorId,
        donorUid: donations.donorUid,
        title: donations.title,
        description: donations.description,
        category: donations.category,
        quantity: donations.quantity,
        servings: donations.servings,
        expiryDate: donations.expiryDate,
        pickupLocation: donations.pickupLocation,
        pickupWindow: donations.pickupWindow,
        dietaryInfo: donations.dietaryInfo,
        storageCondition: donations.storageCondition,
        status: donations.status,
        imageUrl: donations.imageUrl,
        recipientId: donations.recipientId,
        volunteerId: donations.volunteerId,
        createdAt: donations.createdAt,
        updatedAt: donations.updatedAt,
        donorName: users.fullName,
        donorEmail: users.email,
        donorOrg: users.organization,
        donorPhone: users.phone,
      })
      .from(donations)
      .leftJoin(users, eq(donations.donorId, users.id))
      .where(eq(donations.id, id))
      .limit(1);

    return rows[0] || null;
  } catch (error) {
    console.error(`Failed to query donation ${id}:`, error);
    throw new Error('Database error retrieving donation details.', { cause: error });
  }
}

export async function createDonation(data: typeof donations.$inferInsert) {
  try {
    const result = await db.insert(donations).values(data).returning();
    
    // Auto increment impact metrics
    try {
      await db
        .update(impactMetrics)
        .set({
          totalMealsRescued: sql`${impactMetrics.totalMealsRescued} + ${data.servings || 10}`,
          co2DivertedKg: sql`${impactMetrics.co2DivertedKg} + ${Math.round((data.servings || 10) * 2.5)}`,
          updatedAt: new Date(),
        })
        .where(eq(impactMetrics.id, 1));
    } catch {
      // Non-blocking metric bump
    }

    return result[0];
  } catch (error) {
    console.error('Failed to create donation:', error);
    throw new Error('Database error creating food donation listing.', { cause: error });
  }
}

export async function updateDonation(
  id: number,
  data: Partial<typeof donations.$inferInsert>
) {
  try {
    const result = await db
      .update(donations)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(donations.id, id))
      .returning();
    return result[0];
  } catch (error) {
    console.error(`Failed to update donation ${id}:`, error);
    throw new Error('Database error updating food donation.', { cause: error });
  }
}

export async function deleteDonation(id: number) {
  try {
    // Delete any dependent claims or deliveries first to prevent foreign key errors
    await db.delete(deliveries).where(eq(deliveries.donationId, id));
    await db.delete(claims).where(eq(claims.donationId, id));
    const result = await db.delete(donations).where(eq(donations.id, id)).returning();
    return result[0];
  } catch (error) {
    console.error(`Failed to delete donation ${id}:`, error);
    throw new Error('Database error removing food donation.', { cause: error });
  }
}

// ----------------- CLAIMS -----------------
export async function getAllClaims() {
  try {
    return await db
      .select({
        id: claims.id,
        donationId: claims.donationId,
        recipientId: claims.recipientId,
        recipientUid: claims.recipientUid,
        requestedServings: claims.requestedServings,
        urgency: claims.urgency,
        notes: claims.notes,
        status: claims.status,
        createdAt: claims.createdAt,
        donationTitle: donations.title,
        donationCategory: donations.category,
        donationLocation: donations.pickupLocation,
        recipientName: users.fullName,
        recipientOrg: users.organization,
        recipientPhone: users.phone,
      })
      .from(claims)
      .leftJoin(donations, eq(claims.donationId, donations.id))
      .leftJoin(users, eq(claims.recipientId, users.id))
      .orderBy(desc(claims.createdAt));
  } catch (error) {
    console.error('Failed to query claims:', error);
    throw new Error('Database error querying food claims.', { cause: error });
  }
}

export async function createClaim(data: typeof claims.$inferInsert) {
  try {
    const result = await db.insert(claims).values(data).returning();
    // Mark donation status as claimed
    await db
      .update(donations)
      .set({
        status: 'claimed',
        recipientId: data.recipientId,
        updatedAt: new Date(),
      })
      .where(eq(donations.id, data.donationId));

    return result[0];
  } catch (error) {
    console.error('Failed to create food claim:', error);
    throw new Error('Database error creating food claim.', { cause: error });
  }
}

export async function updateClaimStatus(id: number, status: string) {
  try {
    const result = await db
      .update(claims)
      .set({ status })
      .where(eq(claims.id, id))
      .returning();
    return result[0];
  } catch (error) {
    console.error(`Failed to update claim ${id}:`, error);
    throw new Error('Database error updating claim status.', { cause: error });
  }
}

// ----------------- DELIVERIES -----------------
export async function getAllDeliveries() {
  try {
    return await db
      .select({
        id: deliveries.id,
        donationId: deliveries.donationId,
        claimId: deliveries.claimId,
        volunteerId: deliveries.volunteerId,
        volunteerUid: deliveries.volunteerUid,
        status: deliveries.status,
        pickupTime: deliveries.pickupTime,
        deliveryTime: deliveries.deliveryTime,
        deliveryNotes: deliveries.deliveryNotes,
        createdAt: deliveries.createdAt,
        donationTitle: donations.title,
        pickupLocation: donations.pickupLocation,
        pickupWindow: donations.pickupWindow,
        volunteerName: users.fullName,
        volunteerPhone: users.phone,
      })
      .from(deliveries)
      .leftJoin(donations, eq(deliveries.donationId, donations.id))
      .leftJoin(users, eq(deliveries.volunteerId, users.id))
      .orderBy(desc(deliveries.createdAt));
  } catch (error) {
    console.error('Failed to query deliveries:', error);
    throw new Error('Database error querying volunteer deliveries.', { cause: error });
  }
}

export async function createDelivery(data: typeof deliveries.$inferInsert) {
  try {
    const result = await db.insert(deliveries).values(data).returning();
    // Update donation status and volunteer link
    await db
      .update(donations)
      .set({
        volunteerId: data.volunteerId,
        status: 'in_transit',
        updatedAt: new Date(),
      })
      .where(eq(donations.id, data.donationId));

    return result[0];
  } catch (error) {
    console.error('Failed to assign delivery mission:', error);
    throw new Error('Database error creating volunteer mission.', { cause: error });
  }
}

export async function updateDeliveryStatus(
  id: number,
  status: string,
  notes?: string
) {
  try {
    const updateData: Partial<typeof deliveries.$inferInsert> = { status };
    if (notes) updateData.deliveryNotes = notes;
    if (status === 'picked_up') updateData.pickupTime = new Date();
    if (status === 'delivered') updateData.deliveryTime = new Date();

    const result = await db
      .update(deliveries)
      .set(updateData)
      .where(eq(deliveries.id, id))
      .returning();

    // If delivered, mark donation completed
    if (status === 'delivered' && result[0]) {
      await db
        .update(donations)
        .set({ status: 'completed', updatedAt: new Date() })
        .where(eq(donations.id, result[0].donationId));
    }

    return result[0];
  } catch (error) {
    console.error(`Failed to update delivery ${id}:`, error);
    throw new Error('Database error updating delivery status.', { cause: error });
  }
}

// ----------------- METRICS -----------------
export async function getImpactMetrics() {
  try {
    const metrics = await db.select().from(impactMetrics).limit(1);
    const donationCountResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(donations);
    const userCountResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(users);

    const baseMetrics = metrics[0] || {
      totalMealsRescued: 14280,
      co2DivertedKg: 35700,
      activeDonors: 48,
      activeRecipients: 62,
    };

    return {
      ...baseMetrics,
      totalDonationsCount: Number(donationCountResult[0]?.count || 0),
      totalUsersCount: Number(userCountResult[0]?.count || 0),
    };
  } catch (error) {
    console.error('Failed to get impact metrics:', error);
    throw new Error('Database error loading impact metrics.', { cause: error });
  }
}
