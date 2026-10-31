import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import {
  getAllUsers,
  getUserByUid,
  getUserById,
  upsertUser,
  updateUser,
  deleteUser,
  getDonations,
  getDonationById,
  createDonation,
  updateDonation,
  deleteDonation,
  getAllClaims,
  createClaim,
  updateClaimStatus,
  getAllDeliveries,
  createDelivery,
  updateDeliveryStatus,
  getImpactMetrics,
} from './src/db/queries.ts';
import { requireAuth, optionalAuth, AuthRequest } from './src/middleware/auth.ts';
import { db } from './src/db/index.ts';
import { sql } from 'drizzle-orm';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const isProduction = process.env.NODE_ENV === 'production';

app.use(cors());
app.use(express.json());

// ----------------- HEALTH & SYSTEM APIS -----------------
app.get('/api/health', async (_req: Request, res: Response) => {
  try {
    const dbTest = await db.execute(sql`SELECT current_database() as db_name, now() as db_time`);
    const row = dbTest.rows[0] as { db_name: string; db_time: string };
    
    res.json({
      status: 'healthy',
      service: 'FoodCycle API',
      database: 'PostgreSQL (Cloud SQL)',
      databaseName: row.db_name,
      databaseTime: row.db_time,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Database health check failed:', error);
    res.status(500).json({
      status: 'error',
      service: 'FoodCycle API',
      database: 'Disconnected',
      error: error.message || 'Database connection error',
    });
  }
});

app.get('/api/metrics', async (_req: Request, res: Response) => {
  try {
    const metrics = await getImpactMetrics();
    res.json(metrics);
  } catch (error: any) {
    console.error('Error fetching metrics:', error);
    res.status(500).json({ error: 'Failed to retrieve impact metrics.' });
  }
});

// ----------------- USER PROFILE APIS -----------------
app.get('/api/users', async (_req: Request, res: Response) => {
  try {
    const usersList = await getAllUsers();
    res.json(usersList);
  } catch (error: any) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to retrieve users.' });
  }
});

app.post('/api/users/sync', optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { uid, email, fullName, role, organization, phone, address, avatarUrl } = req.body;

    const userUid = uid || req.user?.uid;
    const userEmail = email || req.user?.email;

    if (!userUid || !userEmail) {
      return res.status(400).json({ error: 'User UID and email are required.' });
    }

    const synched = await upsertUser({
      uid: userUid,
      email: userEmail,
      fullName: fullName || req.user?.name || userEmail.split('@')[0],
      role: role || req.user?.role || 'donor',
      organization,
      phone,
      address,
      avatarUrl,
    });

    res.json(synched);
  } catch (error: any) {
    console.error('Error syncing user:', error);
    res.status(500).json({ error: 'Failed to sync user profile.' });
  }
});

app.get('/api/users/:uid', async (req: Request, res: Response) => {
  try {
    const user = await getUserByUid(req.params.uid);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (error: any) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Failed to get user.' });
  }
});

app.patch('/api/users/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid user ID' });

    const updated = await updateUser(id, req.body);
    res.json(updated);
  } catch (error: any) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: 'Failed to update user profile.' });
  }
});

app.delete('/api/users/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid user ID' });

    const deleted = await deleteUser(id);
    res.json({ success: true, deleted });
  } catch (error: any) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Failed to delete user.' });
  }
});

// ----------------- DONATIONS APIS (CRUD) -----------------
app.get('/api/donations', async (req: Request, res: Response) => {
  try {
    const { status, category, donorId } = req.query;
    const filter = {
      status: status ? String(status) : undefined,
      category: category ? String(category) : undefined,
      donorId: donorId ? parseInt(String(donorId), 10) : undefined,
    };
    const list = await getDonations(filter);
    res.json(list);
  } catch (error: any) {
    console.error('Error fetching donations:', error);
    res.status(500).json({ error: 'Failed to retrieve food donations.' });
  }
});

app.get('/api/donations/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid donation ID' });

    const item = await getDonationById(id);
    if (!item) {
      return res.status(404).json({ error: 'Donation listing not found' });
    }
    res.json(item);
  } catch (error: any) {
    console.error('Error getting donation:', error);
    res.status(500).json({ error: 'Failed to retrieve donation details.' });
  }
});

app.post('/api/donations', optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    const {
      title,
      description,
      category,
      quantity,
      servings,
      expiryDate,
      pickupLocation,
      pickupWindow,
      dietaryInfo,
      storageCondition,
      imageUrl,
      donorId,
      donorUid,
    } = req.body;

    // Validation
    if (!title || !description || !category || !quantity || !pickupLocation || !pickupWindow) {
      return res.status(400).json({
        error: 'Missing required donation fields (title, description, category, quantity, pickupLocation, pickupWindow).',
      });
    }

    // Determine donor ID
    let finalDonorId = donorId;
    let finalDonorUid = donorUid || req.user?.uid || 'donor_demo_uid';

    if (!finalDonorId) {
      // Find existing or fallback to user 2 (Marco Rossi, baker) or first donor
      const existingUser = await getUserByUid(finalDonorUid);
      if (existingUser) {
        finalDonorId = existingUser.id;
      } else {
        const fallback = await getUserById(2);
        finalDonorId = fallback ? fallback.id : 1;
      }
    }

    const created = await createDonation({
      donorId: finalDonorId,
      donorUid: finalDonorUid,
      title: title.trim(),
      description: description.trim(),
      category,
      quantity: quantity.trim(),
      servings: Number(servings) || 10,
      expiryDate: expiryDate || 'Tomorrow 18:00',
      pickupLocation: pickupLocation.trim(),
      pickupWindow: pickupWindow.trim(),
      dietaryInfo: dietaryInfo || 'Standard',
      storageCondition: storageCondition || 'Refrigerated',
      imageUrl:
        imageUrl ||
        'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80',
      status: 'available',
    });

    res.status(201).json(created);
  } catch (error: any) {
    console.error('Error creating donation:', error);
    res.status(500).json({ error: 'Failed to create food donation listing.' });
  }
});

app.put('/api/donations/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid donation ID' });

    const updated = await updateDonation(id, req.body);
    if (!updated) {
      return res.status(404).json({ error: 'Donation listing not found.' });
    }
    res.json(updated);
  } catch (error: any) {
    console.error('Error updating donation:', error);
    res.status(500).json({ error: 'Failed to update donation.' });
  }
});

app.delete('/api/donations/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid donation ID' });

    const deleted = await deleteDonation(id);
    res.json({ success: true, deleted });
  } catch (error: any) {
    console.error('Error deleting donation:', error);
    res.status(500).json({ error: 'Failed to delete donation.' });
  }
});

// ----------------- CLAIMS APIS -----------------
app.get('/api/claims', async (_req: Request, res: Response) => {
  try {
    const claimsList = await getAllClaims();
    res.json(claimsList);
  } catch (error: any) {
    console.error('Error fetching claims:', error);
    res.status(500).json({ error: 'Failed to retrieve claims.' });
  }
});

app.post('/api/claims', optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { donationId, recipientId, recipientUid, requestedServings, urgency, notes } = req.body;

    if (!donationId) {
      return res.status(400).json({ error: 'donationId is required to claim food.' });
    }

    let finalRecipientId = recipientId;
    let finalRecipientUid = recipientUid || req.user?.uid || 'recipient_demo_uid';

    if (!finalRecipientId) {
      const recipientUser = await getUserByUid(finalRecipientUid);
      if (recipientUser) {
        finalRecipientId = recipientUser.id;
      } else {
        // Fallback to Hope Valley Shelter
        const fallback = await getUserById(5);
        finalRecipientId = fallback ? fallback.id : 1;
      }
    }

    const created = await createClaim({
      donationId: Number(donationId),
      recipientId: finalRecipientId,
      recipientUid: finalRecipientUid,
      requestedServings: Number(requestedServings) || 10,
      urgency: urgency || 'Standard',
      notes: notes || '',
      status: 'pending',
    });

    res.status(201).json(created);
  } catch (error: any) {
    console.error('Error creating claim:', error);
    res.status(500).json({ error: 'Failed to submit food claim request.' });
  }
});

app.patch('/api/claims/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { status } = req.body;
    if (isNaN(id) || !status) {
      return res.status(400).json({ error: 'Invalid ID or status.' });
    }

    const updated = await updateClaimStatus(id, status);
    res.json(updated);
  } catch (error: any) {
    console.error('Error updating claim:', error);
    res.status(500).json({ error: 'Failed to update claim status.' });
  }
});

// ----------------- DELIVERIES APIS -----------------
app.get('/api/deliveries', async (_req: Request, res: Response) => {
  try {
    const deliveriesList = await getAllDeliveries();
    res.json(deliveriesList);
  } catch (error: any) {
    console.error('Error fetching deliveries:', error);
    res.status(500).json({ error: 'Failed to retrieve deliveries.' });
  }
});

app.post('/api/deliveries', optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { donationId, claimId, volunteerId, volunteerUid } = req.body;

    if (!donationId) {
      return res.status(400).json({ error: 'donationId is required for mission assignment.' });
    }

    let finalVolunteerId = volunteerId;
    let finalVolunteerUid = volunteerUid || req.user?.uid || 'volunteer_alex_uid';

    if (!finalVolunteerId) {
      const volUser = await getUserByUid(finalVolunteerUid);
      if (volUser) {
        finalVolunteerId = volUser.id;
      } else {
        const fallback = await getUserById(7);
        finalVolunteerId = fallback ? fallback.id : 1;
      }
    }

    const created = await createDelivery({
      donationId: Number(donationId),
      claimId: claimId ? Number(claimId) : null,
      volunteerId: finalVolunteerId,
      volunteerUid: finalVolunteerUid,
      status: 'assigned',
    });

    res.status(201).json(created);
  } catch (error: any) {
    console.error('Error creating delivery:', error);
    res.status(500).json({ error: 'Failed to assign delivery mission.' });
  }
});

app.patch('/api/deliveries/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { status, deliveryNotes } = req.body;
    if (isNaN(id) || !status) {
      return res.status(400).json({ error: 'Invalid delivery ID or status.' });
    }

    const updated = await updateDeliveryStatus(id, status, deliveryNotes);
    res.json(updated);
  } catch (error: any) {
    console.error('Error updating delivery:', error);
    res.status(500).json({ error: 'Failed to update delivery mission.' });
  }
});

// ----------------- ADMIN DIAGNOSTICS & RAW QUERY APIS -----------------
app.post('/api/admin/diagnostics', async (_req: Request, res: Response) => {
  try {
    const statsQuery = await db.execute(sql`
      SELECT 
        (SELECT count(*) FROM users) as total_users,
        (SELECT count(*) FROM donations) as total_donations,
        (SELECT count(*) FROM claims) as total_claims,
        (SELECT count(*) FROM deliveries) as total_deliveries
    `);

    res.json({
      database: 'PostgreSQL Cloud SQL',
      connected: true,
      stats: statsQuery.rows[0],
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Diagnostic query failed' });
  }
});

// ----------------- VITE MIDDLEWARE / FRONTEND SERVING -----------------
async function startServer() {
  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const path = await import('path');
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`FoodCycle full-stack server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Server startup error:', err);
});
