const { Pool } = require('pg'); 
const pool = new Pool({connectionString: 'postgresql://neondb_owner:npg_Ftd09uiBHhqk@ep-soft-cake-alu8ahw0-pooler.c-3.eu-central-1.aws.neon.tech/neondb?sslmode=require'}); 
pool.query("SELECT email FROM users WHERE role = 'admin'").then(r => console.log(r.rows)).finally(() => pool.end());
