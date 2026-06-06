import pg from 'pg';
import path from 'path';
import fs from 'fs';

// Load connection string
try {
  const envPath = path.resolve('../../artifacts/api-server/.env');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    for (const line of envContent.split('\n')) {
      const match = line.match(/^\s*([^#=]+)\s*=\s*(.*)$/);
      if (match) {
        const key = match[1].trim();
        let val = match[2].trim();
        if (val.startsWith('"') && val.endsWith('"')) {
          val = val.substring(1, val.length - 1);
        }
        process.env[key] = val;
      }
    }
  }
} catch (e) {
  console.warn('Could not read .env file:', e.message);
}

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

async function restore() {
  const client = await pool.connect();
  try {
    const query = `
      INSERT INTO users (
        id, email, password_hash, full_name, role, phone_number, 
        phone_verified, email_verified, is_verified, is_tutoring_enabled, 
        tutoring_hourly_rate, tier, balance, passkey_hash
      ) VALUES (
        6, 'A95ALmeslati@gmail.com', '$2b$10$nmHpgaoRmAdN.o/J8KAO/OY2tSL9AnZBn8zQTcAJ0ngHE.PGgVOty', 
        'Ahmed Ly', 'teacher', '926273696', true, false, false, false, 
        '0.00', 'bronze', '0.00', '$2b$10$6HzPT.iCtr.4zWwv60dfc.QMDXLAJYJyxLAqrcle8LlpUGYoafYXS'
      ) ON CONFLICT (id) DO UPDATE SET 
        email = EXCLUDED.email,
        password_hash = EXCLUDED.password_hash,
        role = EXCLUDED.role;
    `;
    await client.query(query);
    console.log("Developer account successfully restored!");
  } catch (err) {
    console.error("Failed to restore account:", err);
  } finally {
    client.release();
  }
}

restore().then(() => pool.end());
