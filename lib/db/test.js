import pg from 'pg';
const { Pool } = pg;
const pool = new Pool({connectionString: process.env.DATABASE_URL});
pool.query('select * from users limit 1').then(res => {
  console.log("Columns:", Object.keys(res.rows[0]));
  process.exit(0);
}).catch(err => {
  console.error("DB Error:", err.message);
  process.exit(1);
});
