import os
import psycopg2
from psycopg2.extras import RealDictCursor
from flask import Flask, request, jsonify
from flask_cors import CORS
from config import Config

app = Flask(__name__)
app.config.from_object(Config)
CORS(app)

def get_db_connection():
    """Establish and return a connection to PostgreSQL database."""
    if Config.DATABASE_URL:
        conn = psycopg2.connect(Config.DATABASE_URL, cursor_factory=RealDictCursor)
    else:
        conn = psycopg2.connect(
            host=Config.SQL_HOST,
            database=Config.SQL_DB_NAME,
            user=Config.SQL_USER,
            password=Config.SQL_PASSWORD,
            port=Config.SQL_PORT,
            cursor_factory=RealDictCursor
        )
    return conn

# ----------------- HEALTH & SYSTEM -----------------
@app.route('/api/health', methods=['GET'])
def health_check():
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute("SELECT current_database() as db_name, now() as db_time;")
        res = cur.fetchone()
        cur.close()
        conn.close()
        return jsonify({
            'status': 'healthy',
            'service': 'FoodCycle Python Flask API',
            'database': 'PostgreSQL',
            'databaseName': res['db_name'],
            'databaseTime': str(res['db_time'])
        }), 200
    except Exception as e:
        return jsonify({
            'status': 'error',
            'service': 'FoodCycle Python Flask API',
            'error': str(e)
        }), 500

@app.route('/api/metrics', methods=['GET'])
def get_metrics():
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute("SELECT * FROM impact_metrics LIMIT 1;")
        metrics = cur.fetchone()

        cur.execute("SELECT count(*) as count FROM donations;")
        donations_count = cur.fetchone()['count']

        cur.execute("SELECT count(*) as count FROM users;")
        users_count = cur.fetchone()['count']

        cur.close()
        conn.close()

        if not metrics:
            metrics = {
                'total_meals_rescued': 14280,
                'co2_diverted_kg': 35700,
                'active_donors': 48,
                'active_recipients': 62
            }

        return jsonify({
            'totalMealsRescued': metrics.get('total_meals_rescued', 14280),
            'co2DivertedKg': metrics.get('co2_diverted_kg', 35700),
            'activeDonors': metrics.get('active_donors', 48),
            'activeRecipients': metrics.get('active_recipients', 62),
            'totalDonationsCount': donations_count,
            'totalUsersCount': users_count
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ----------------- USERS -----------------
@app.route('/api/users', methods=['GET'])
def get_users():
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute("SELECT * FROM users ORDER BY created_at DESC;")
        users_list = cur.fetchall()
        cur.close()
        conn.close()
        return jsonify(users_list), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/users/sync', methods=['POST'])
def sync_user():
    data = request.get_json() or {}
    uid = data.get('uid')
    email = data.get('email')
    full_name = data.get('fullName') or (email.split('@')[0] if email else 'User')
    role = data.get('role', 'donor')
    organization = data.get('organization')
    phone = data.get('phone')
    address = data.get('address')
    avatar_url = data.get('avatarUrl')

    if not uid or not email:
        return jsonify({'error': 'UID and email are required.'}), 400

    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute("""
            INSERT INTO users (uid, email, full_name, role, organization, phone, address, avatar_url, is_verified)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, true)
            ON CONFLICT (uid) DO UPDATE
            SET email = EXCLUDED.email,
                full_name = EXCLUDED.full_name,
                organization = COALESCE(EXCLUDED.organization, users.organization),
                phone = COALESCE(EXCLUDED.phone, users.phone),
                address = COALESCE(EXCLUDED.address, users.address),
                avatar_url = COALESCE(EXCLUDED.avatar_url, users.avatar_url)
            RETURNING *;
        """, (uid, email, full_name, role, organization, phone, address, avatar_url))
        user = cur.fetchone()
        conn.commit()
        cur.close()
        conn.close()
        return jsonify(user), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ----------------- DONATIONS (CRUD) -----------------
@app.route('/api/donations', methods=['GET'])
def list_donations():
    status = request.args.get('status')
    category = request.args.get('category')
    donor_id = request.args.get('donorId')

    try:
        conn = get_db_connection()
        cur = conn.cursor()
        query = """
            SELECT d.*, u.full_name as donor_name, u.email as donor_email,
                   u.organization as donor_org, u.phone as donor_phone
            FROM donations d
            LEFT JOIN users u ON d.donor_id = u.id
            WHERE 1=1
        """
        params = []
        if status and status != 'all':
            query += " AND d.status = %s"
            params.append(status)
        if category and category != 'all':
            query += " AND d.category = %s"
            params.append(category)
        if donor_id:
            query += " AND d.donor_id = %s"
            params.append(donor_id)

        query += " ORDER BY d.created_at DESC;"
        cur.execute(query, tuple(params))
        donations_list = cur.fetchall()
        cur.close()
        conn.close()
        return jsonify(donations_list), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/donations/<int:donation_id>', methods=['GET'])
def get_donation(donation_id):
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute("""
            SELECT d.*, u.full_name as donor_name, u.email as donor_email,
                   u.organization as donor_org, u.phone as donor_phone
            FROM donations d
            LEFT JOIN users u ON d.donor_id = u.id
            WHERE d.id = %s;
        """, (donation_id,))
        item = cur.fetchone()
        cur.close()
        conn.close()
        if not item:
            return jsonify({'error': 'Donation not found'}), 404
        return jsonify(item), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/donations', methods=['POST'])
def create_donation():
    data = request.get_json() or {}
    title = data.get('title')
    description = data.get('description')
    category = data.get('category')
    quantity = data.get('quantity')
    servings = int(data.get('servings', 10))
    expiry_date = data.get('expiryDate', 'Tomorrow')
    pickup_location = data.get('pickupLocation')
    pickup_window = data.get('pickupWindow')
    dietary_info = data.get('dietaryInfo', '')
    storage_condition = data.get('storageCondition', 'Refrigerated')
    image_url = data.get('imageUrl', 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80')
    donor_id = data.get('donorId')
    donor_uid = data.get('donorUid', 'donor_default')

    if not title or not category or not quantity or not pickup_location:
        return jsonify({'error': 'Missing required fields'}), 400

    try:
        conn = get_db_connection()
        cur = conn.cursor()
        if not donor_id:
            cur.execute("SELECT id FROM users WHERE role = 'donor' LIMIT 1;")
            first_donor = cur.fetchone()
            donor_id = first_donor['id'] if first_donor else 1

        cur.execute("""
            INSERT INTO donations (donor_id, donor_uid, title, description, category,
                                   quantity, servings, expiry_date, pickup_location,
                                   pickup_window, dietary_info, storage_condition, status, image_url)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, 'available', %s)
            RETURNING *;
        """, (donor_id, donor_uid, title, description, category, quantity, servings,
              expiry_date, pickup_location, pickup_window, dietary_info, storage_condition, image_url))
        created = cur.fetchone()
        conn.commit()
        cur.close()
        conn.close()
        return jsonify(created), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/donations/<int:donation_id>', methods=['PUT'])
def update_donation(donation_id):
    data = request.get_json() or {}
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        fields = []
        values = []
        for key in ['title', 'description', 'category', 'quantity', 'servings',
                    'expiry_date', 'pickup_location', 'pickup_window',
                    'dietary_info', 'storage_condition', 'status', 'image_url']:
            camel_key = ''.join([w.capitalize() if i > 0 else w for i, w in enumerate(key.split('_'))])
            val = data.get(camel_key) if camel_key in data else data.get(key)
            if val is not None:
                fields.append(f"{key} = %s")
                values.append(val)

        if not fields:
            return jsonify({'error': 'No fields to update'}), 400

        values.append(donation_id)
        query = f"UPDATE donations SET {', '.join(fields)}, updated_at = NOW() WHERE id = %s RETURNING *;"
        cur.execute(query, tuple(values))
        updated = cur.fetchone()
        conn.commit()
        cur.close()
        conn.close()
        return jsonify(updated), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/donations/<int:donation_id>', methods=['DELETE'])
def delete_donation(donation_id):
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute("DELETE FROM donations WHERE id = %s RETURNING id;", (donation_id,))
        deleted = cur.fetchone()
        conn.commit()
        cur.close()
        conn.close()
        if not deleted:
            return jsonify({'error': 'Donation not found'}), 404
        return jsonify({'success': True, 'id': donation_id}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ----------------- CLAIMS & DELIVERIES -----------------
@app.route('/api/claims', methods=['GET'])
def list_claims():
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute("""
            SELECT c.*, d.title as donation_title, d.category as donation_category,
                   d.pickup_location as donation_location, u.full_name as recipient_name,
                   u.organization as recipient_org, u.phone as recipient_phone
            FROM claims c
            LEFT JOIN donations d ON c.donation_id = d.id
            LEFT JOIN users u ON c.recipient_id = u.id
            ORDER BY c.created_at DESC;
        """)
        claims = cur.fetchall()
        cur.close()
        conn.close()
        return jsonify(claims), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/claims', methods=['POST'])
def create_claim():
    data = request.get_json() or {}
    donation_id = data.get('donationId')
    recipient_id = data.get('recipientId', 5)
    recipient_uid = data.get('recipientUid', 'recipient_uid')
    requested_servings = data.get('requestedServings', 10)
    urgency = data.get('urgency', 'Standard')
    notes = data.get('notes', '')

    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute("""
            INSERT INTO claims (donation_id, recipient_id, recipient_uid, requested_servings, urgency, notes, status)
            VALUES (%s, %s, %s, %s, %s, %s, 'pending')
            RETURNING *;
        """, (donation_id, recipient_id, recipient_uid, requested_servings, urgency, notes))
        claim = cur.fetchone()

        cur.execute("UPDATE donations SET status = 'claimed', recipient_id = %s WHERE id = %s;",
                    (recipient_id, donation_id))
        conn.commit()
        cur.close()
        conn.close()
        return jsonify(claim), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/deliveries', methods=['GET'])
def list_deliveries():
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute("""
            SELECT del.*, d.title as donation_title, d.pickup_location,
                   d.pickup_window, u.full_name as volunteer_name, u.phone as volunteer_phone
            FROM deliveries del
            LEFT JOIN donations d ON del.donation_id = d.id
            LEFT JOIN users u ON del.volunteer_id = u.id
            ORDER BY del.created_at DESC;
        """)
        deliveries = cur.fetchall()
        cur.close()
        conn.close()
        return jsonify(deliveries), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=Config.PORT, debug=Config.DEBUG)
