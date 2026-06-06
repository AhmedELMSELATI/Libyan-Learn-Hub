const { Client } = require('pg'); 
const client = new Client({ connectionString: 'postgresql://neondb_owner:npg_Ftd09uiBHhqk@ep-soft-cake-alu8ahw0-pooler.c-3.eu-central-1.aws.neon.tech/neondb?sslmode=require' }); 
client.connect().then(() => client.query("SELECT id, email, role, biometrics_verified, is_verified FROM users WHERE email='A95ALmeslati@gmail.com';")).then(res => { console.log(res.rows); client.end(); }).catch(console.error);
