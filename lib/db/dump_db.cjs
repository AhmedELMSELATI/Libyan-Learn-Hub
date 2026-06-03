const { Pool } = require('pg');
const fs = require('fs');

async function dump() {
  const pool = new Pool({ connectionString: 'postgresql://neondb_owner:npg_Ftd09uiBHhqk@ep-soft-cake-alu8ahw0-pooler.c-3.eu-central-1.aws.neon.tech/neondb?sslmode=require' });
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
