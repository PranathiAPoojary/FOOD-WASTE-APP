-- ========================================================
-- FoodCycle PostgreSQL Database Schema & Seed Data
-- ========================================================

-- Enable UUID extension if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing tables if needed (cascade to avoid orphan constraints)
DROP TABLE IF EXISTS deliveries CASCADE;
DROP TABLE IF EXISTS claims CASCADE;
DROP TABLE IF EXISTS donations CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS impact_metrics CASCADE;

-- 1. USERS TABLE
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  uid TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'donor', -- 'donor', 'recipient', 'volunteer', 'admin'
  organization TEXT,
  phone TEXT,
  address TEXT,
  avatar_url TEXT,
  is_verified BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. DONATIONS TABLE
CREATE TABLE donations (
  id SERIAL PRIMARY KEY,
  donor_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  donor_uid TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL, -- 'Prepared Meals', 'Produce', 'Bakery', 'Dairy', 'Pantry', 'Other'
  quantity TEXT NOT NULL,
  servings INTEGER NOT NULL DEFAULT 10,
  expiry_date TEXT NOT NULL,
  pickup_location TEXT NOT NULL,
  pickup_window TEXT NOT NULL,
  dietary_info TEXT,
  storage_condition TEXT DEFAULT 'Refrigerated', -- 'Ambient', 'Refrigerated', 'Frozen'
  status TEXT NOT NULL DEFAULT 'available', -- 'available', 'claimed', 'in_transit', 'completed', 'cancelled'
  image_url TEXT,
  recipient_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  volunteer_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. CLAIMS TABLE
CREATE TABLE claims (
  id SERIAL PRIMARY KEY,
  donation_id INTEGER NOT NULL REFERENCES donations(id) ON DELETE CASCADE,
  recipient_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  recipient_uid TEXT NOT NULL,
  requested_servings INTEGER NOT NULL,
  urgency TEXT DEFAULT 'Standard', -- 'Urgent', 'Standard', 'Flexible'
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'approved', 'picked_up', 'delivered', 'cancelled'
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. DELIVERIES TABLE
CREATE TABLE deliveries (
  id SERIAL PRIMARY KEY,
  donation_id INTEGER NOT NULL REFERENCES donations(id) ON DELETE CASCADE,
  claim_id INTEGER REFERENCES claims(id) ON DELETE SET NULL,
  volunteer_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  volunteer_uid TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'assigned', -- 'assigned', 'picked_up', 'in_transit', 'delivered'
  pickup_time TIMESTAMP,
  delivery_time TIMESTAMP,
  delivery_notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. IMPACT METRICS TABLE
CREATE TABLE impact_metrics (
  id SERIAL PRIMARY KEY,
  total_meals_rescued INTEGER NOT NULL DEFAULT 0,
  co2_diverted_kg INTEGER NOT NULL DEFAULT 0,
  active_donors INTEGER NOT NULL DEFAULT 0,
  active_recipients INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ========================================================
-- SEED DATA
-- ========================================================
INSERT INTO users (uid, email, full_name, role, organization, phone, address, is_verified)
VALUES 
  ('admin_default_uid', 'admin@foodcycle.org', 'Elena Vance', 'admin', 'FoodCycle Central HQ', '+1 (555) 019-2834', '100 Green Way, Metro City', true),
  ('donor_artisan_uid', 'baker@harvestbakery.com', 'Marco Rossi', 'donor', 'Harvest Artisanal Bakery', '+1 (555) 234-5678', '424 S Market St, Downtown', true),
  ('donor_green_uid', 'sarah@greengrocer.com', 'Sarah Chen', 'donor', 'Organic Valley Farm & Grocer', '+1 (555) 345-6789', '88 River Rd, West End', true),
  ('donor_bistro_uid', 'chef@sunbistro.com', 'Antoine Dubois', 'donor', 'Le Soleil French Bistro', '+1 (555) 456-7890', '12 Culinary Row, Arts District', true),
  ('recipient_hope_uid', 'coordinator@hopeshelter.org', 'David Washington', 'recipient', 'Hope Valley Community Shelter', '+1 (555) 789-0123', '310 Hope Ave, Eastside', true),
  ('recipient_youth_uid', 'clara@youthcenter.org', 'Clara Barton', 'recipient', 'Youth Outreach & Family Kitchen', '+1 (555) 890-1234', '712 Pine St, Midtown', true),
  ('volunteer_alex_uid', 'alex.driver@gmail.com', 'Alex Rivera', 'volunteer', 'FoodCycle Active Responder', '+1 (555) 901-2345', 'Metro Region Fleet 4', true);

INSERT INTO impact_metrics (total_meals_rescued, co2_diverted_kg, active_donors, active_recipients)
VALUES (14280, 35700, 48, 62);

INSERT INTO donations (donor_id, donor_uid, title, description, category, quantity, servings, expiry_date, pickup_location, pickup_window, dietary_info, storage_condition, status, image_url)
VALUES 
  (2, 'donor_artisan_uid', 'Fresh Sourdough Loaves & Croissants', 'Day-end fresh baked organic sourdough breads, baguettes, and butter croissants. Packaged in food-grade bakery bags.', 'Bakery', '35 units (assorted)', 50, 'Tomorrow 20:00', '424 S Market St, Back Delivery Bay', 'Today 6:00 PM - 9:00 PM', 'Vegetarian, Nut-Free', 'Ambient', 'available', 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=800&q=80'),
  (3, 'donor_green_uid', 'Organic Seasonal Crisp Apples & Farm Greens', 'Crates of crisp Honeycrisp apples, baby spinach, romaine lettuce, and bell peppers. Surpluses from daily morning harvest.', 'Produce', '65 lbs crates', 75, 'In 3 days', '88 River Rd, Loading Dock 2', 'Today 4:00 PM - 7:30 PM', 'Vegan, Gluten-Free, Organic', 'Refrigerated', 'available', 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?auto=format&fit=crop&w=800&q=80'),
  (4, 'donor_bistro_uid', 'Gourmet Vegetable Lasagna & Roasted Herb Chicken Trays', 'Catering trays prepared today in commercial kitchen. Blast chilled and sealed under hygienic food safety guidelines.', 'Prepared Meals', '8 large catering trays', 80, 'Tonight 22:00', '12 Culinary Row, Kitchen Staff Entrance', 'Tonight 8:30 PM - 10:00 PM', 'Halal, High Protein, Contains Dairy', 'Refrigerated', 'available', 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80');
