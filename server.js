const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
app.use(cors());
// 10MB limit is needed for large screenshot uploads!
app.use(express.json({ limit: '10mb' })); 

const pool = new Pool({
    connectionString: 'postgresql:Raghav@2511@db.ycbwoegthivqnoaascfx.supabase.co:5432/postgres' 
    ssl: { rejectUnauthorized: false }
}); 
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Cloud Backend running on port ${PORT}`));

// --- USER ROUTES ---
app.post('/api/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;
        await pool.query('INSERT INTO users (name, email, password) VALUES ($1, $2, $3)', [name, email, password]);
        res.json({ success: true });
    } catch (err) { res.json({ success: false, error: "Email already registered" }); }
});

app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const result = await pool.query('SELECT * FROM users WHERE email = $1 AND password = $2', [email, password]);
        if (result.rows.length > 0) res.json({ success: true, user: result.rows[0] });
        else res.json({ success: false });
    } catch (err) { res.json({ success: false }); }
});

app.put('/api/users/:id', async (req, res) => {
    const { name, phone, address } = req.body;
    await pool.query('UPDATE users SET name=$1, phone=$2, address=$3 WHERE id=$4', [name, phone, address, req.params.id]);
    const updated = await pool.query('SELECT * FROM users WHERE id=$1', [req.params.id]);
    res.json({ success: true, user: updated.rows[0] });
});

// --- MENU ROUTES ---
app.get('/api/menu', async (req, res) => {
    const result = await pool.query('SELECT * FROM menu ORDER BY id ASC');
    res.json(result.rows);
});

app.post('/api/menu', async (req, res) => {
    const { name, price, image, is_veg } = req.body;
    await pool.query('INSERT INTO menu (name, price, image, is_veg) VALUES ($1, $2, $3, $4)', [name, price, image, is_veg]);
    res.json({ success: true });
});

app.put('/api/menu/:id', async (req, res) => {
    const { name, price, image, is_veg } = req.body;
    await pool.query('UPDATE menu SET name=$1, price=$2, image=$3, is_veg=$4 WHERE id=$5', [name, price, image, is_veg, req.params.id]);
    res.json({ success: true });
});

app.delete('/api/menu/:id', async (req, res) => {
    await pool.query('DELETE FROM menu WHERE id = $1', [req.params.id]);
    res.json({ success: true });
});

// --- ORDER ROUTES ---
app.post('/api/orders', async (req, res) => {
    const { user_id, total, address, payment_method, payment_screenshot, date, items } = req.body;
    await pool.query('INSERT INTO orders (user_id, total, address, payment_method, payment_screenshot, date, items) VALUES ($1, $2, $3, $4, $5, $6, $7)', 
    [user_id, total, address, payment_method, payment_screenshot, date, JSON.stringify(items)]);
    res.json({ success: true });
});

app.get('/api/orders', async (req, res) => {
    const result = await pool.query(`
        SELECT orders.*, users.name as customer_name, users.phone 
        FROM orders JOIN users ON orders.user_id = users.id ORDER BY orders.id DESC
    `);
    res.json(result.rows);
});

app.get('/api/orders/user/:id', async (req, res) => {
    const result = await pool.query('SELECT * FROM orders WHERE user_id = $1 ORDER BY id DESC', [req.params.id]);
    res.json(result.rows);
});

app.put('/api/orders/:id/status', async (req, res) => {
    await pool.query('UPDATE orders SET status=$1 WHERE id=$2', [req.body.status, req.params.id]);
    res.json({ success: true });
});

app.listen(3000, () => console.log('🚀 V2 Server Running on Port 3000'));