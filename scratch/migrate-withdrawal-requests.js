import pg from 'pg';

const connectionString = 'postgresql://neondb_owner:npg_Ftd09uiBHhqk@ep-soft-cake-alu8ahw0-pooler.c-3.eu-central-1.aws.neon.tech/neondb?sslmode=require';

const client = new pg.Client({
  connectionString,
});

async function main() {
  try {
    await client.connect();
    console.log('Connected to database.');

    const sql = `
      ALTER TABLE withdrawal_requests DROP COLUMN IF EXISTS bank_name;
      ALTER TABLE withdrawal_requests DROP COLUMN IF EXISTS account_number;
      ALTER TABLE withdrawal_requests DROP COLUMN IF EXISTS account_holder;
      ALTER TABLE withdrawal_requests DROP COLUMN IF EXISTS iban;
      ALTER TABLE withdrawal_requests ADD COLUMN IF NOT EXISTS payment_method varchar(50) NOT NULL DEFAULT 'bank_transfer';
      ALTER TABLE withdrawal_requests ADD COLUMN IF NOT EXISTS details text;
    `;
    console.log('Running migration SQL...');
    await client.query(sql);
    console.log('Migration SQL executed successfully!');
  } catch (err) {
    console.error('Error running migration SQL:', err);
  } finally {
    await client.end();
  }
}

main();
