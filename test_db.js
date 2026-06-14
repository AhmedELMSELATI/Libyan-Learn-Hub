const postgres = require('postgres');
const sql = postgres('postgresql://neondb_owner:npg_Ftd09uiBHhqk@ep-soft-cake-alu8ahw0-pooler.c-3.eu-central-1.aws.neon.tech/neondb?sslmode=require');
sql`SELECT id, title, "videoFilePath" FROM lessons WHERE "courseId" = 9`.then(res => {
  console.log(res);
  process.exit(0);
}).catch(err => console.error(err));
