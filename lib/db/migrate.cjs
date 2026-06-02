const { Client } = require('pg'); 
const client = new Client({ connectionString: 'postgresql://neondb_owner:npg_Ftd09uiBHhqk@ep-soft-cake-alu8ahw0-pooler.c-3.eu-central-1.aws.neon.tech/neondb?sslmode=require' }); 
client.connect().then(() => client.query('ALTER TABLE "live_sessions" ADD COLUMN IF NOT EXISTS "recording_url" text;')).then(() => { console.log('Done!'); process.exit(0); }).catch(e => { console.error(e); process.exit(1); });
