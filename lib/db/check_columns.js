import pg from "pg";
const { Client } = pg;

const client = new Client({
  connectionString: "postgresql://neondb_owner:npg_Ftd09uiBHhqk@ep-soft-cake-alu8ahw0-pooler.c-3.eu-central-1.aws.neon.tech/neondb?sslmode=require",
});

async function main() {
  await client.connect();
  
  try {
    const result = await client.query(`
      select "id", "email", "password_hash", "full_name", "full_name_ar", "role", "avatar_url", "bio", "bio_ar", "expertise", "language", "phone_number", "phone_verified", "email_verified", "otp_code", "otp_expiry", "is_verified", "is_tutoring_enabled", "tutoring_hourly_rate", "tutoring_subjects", "cv_url", "face_photo_url", "voice_sample_url", "copyright_agreed_at", "profile_slug", "onboarding_completed", "biometric_profile", "biometrics_verified", "tier", "pro_expiry", "storage_used", "is_bonus_unlocked", "is_sponsored", "sponsored_until", "balance", "passkey_hash", "created_at", "updated_at" from "users" where "users"."email" = $1 limit $2
    `, ['A95ALmeslati@gmail.com', 1]);
    console.log("SUCCESS! Rows:", result.rowCount);
    if (result.rows.length > 0) {
      console.log("User found:", JSON.stringify({ id: result.rows[0].id, email: result.rows[0].email, role: result.rows[0].role }));
    } else {
      console.log("No user found with that email - this is fine, means they don't exist yet");
    }
  } catch (err) {
    console.error("QUERY FAILED:", err.message);
    console.error("DETAIL:", err.detail);
    console.error("CODE:", err.code);
  }
  
  await client.end();
}

main().catch(console.error);
