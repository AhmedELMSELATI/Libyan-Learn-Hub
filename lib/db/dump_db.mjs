import pg from 'pg';
import fs from 'fs';
import dotenv from 'dotenv';
dotenv.config({ path: 'artifacts/api-server/.env' });

async function dump() {
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  try {
    const res = await pool.query("SELECT tablename FROM pg_tables WHERE schemaname='public'");
    const tables = res.rows.map(r => r.tablename);
    const backup = {};
    for (const table of tables) {
      const data = await pool.query(`SELECT * FROM "${table}"`);
      backup[table] = data.rows;
    }
    fs.writeFileSync('database_backup.json', JSON.stringify(backup, null, 2));
    console.log('Database backed up to database_backup.json');
  } catch(e) {
    console.error(e);
  } finally {
    await pool.end();
  }
}
dump();
