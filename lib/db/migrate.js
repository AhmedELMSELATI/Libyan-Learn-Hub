import pg from "pg";
const { Client } = pg;

const client = new Client({
  connectionString: "postgresql://neondb_owner:npg_Ftd09uiBHhqk@ep-soft-cake-alu8ahw0-pooler.c-3.eu-central-1.aws.neon.tech/neondb?sslmode=require",
});

async function main() {
  await client.connect();
  try {
    await client.query(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "biometric_profile" text;`);
    console.log("Added biometric_profile");
  } catch (err) {
    console.error(err.message);
  }

  try {
    await client.query(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "biometrics_verified" boolean DEFAULT false NOT NULL;`);
    console.log("Added biometrics_verified");
  } catch (err) {
    console.error(err.message);
  }

  await client.end();
}

main();
