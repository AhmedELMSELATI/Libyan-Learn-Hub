import pg from 'pg';
const { Pool } = pg;
const pool = new Pool({connectionString: process.env.DATABASE_URL});
pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS balance numeric(10, 2) DEFAULT \'0.00\' NOT NULL;').then(res => {
  console.log("Added balance column successfully!");
  process.exit(0);
}).catch(err => {
  console.error("DB Error:", err.message);
  process.exit(1);
});
