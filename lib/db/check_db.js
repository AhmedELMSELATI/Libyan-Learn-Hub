import pkg from 'pg';
const { Client } = pkg;

async function checkDb() {
  const client = new Client({
    connectionString: "postgresql://neondb_owner:npg_Ftd09uiBHhqk@ep-soft-cake-alu8ahw0-pooler.c-3.eu-central-1.aws.neon.tech/neondb?sslmode=require"
  });

  try {
    await client.connect();
    const res = await client.query('SELECT * FROM prepaid_cards');
    console.log("Cards in DB:", res.rows);
  } catch (err) {
    console.error("DB Error:", err);
  } finally {
    await client.end();
  }
}

checkDb();
