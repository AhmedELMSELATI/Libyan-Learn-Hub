import { spawn } from 'child_process';
import path from 'path';

const dbDir = 'C:\\Libyan-Learn-Hub\\Libyan-Learn-Hub\\lib\\db';
const databaseUrl = 'postgresql://neondb_owner:npg_Ftd09uiBHhqk@ep-soft-cake-alu8ahw0-pooler.c-3.eu-central-1.aws.neon.tech/neondb?sslmode=require';

console.log('Spawning drizzle-kit push...');
const child = spawn('npx', ['drizzle-kit', 'push', '--force', '--config', './drizzle.config.ts'], {
  cwd: dbDir,
  env: {
    ...process.env,
    DATABASE_URL: databaseUrl,
  },
  shell: true,
});

child.stdout.on('data', (data) => {
  const output = data.toString();
  process.stdout.write(output);

  if (output.includes('Is payment_method column in withdrawal_requests table')) {
    console.log('\n[Script] Detected payment_method prompt, sending Enter...');
    child.stdin.write('\n');
  } else if (output.includes('Is details column in withdrawal_requests table')) {
    console.log('\n[Script] Detected details prompt, sending Enter...');
    child.stdin.write('\n');
  }
});

child.stderr.on('data', (data) => {
  process.stderr.write(data.toString());
});

child.on('close', (code) => {
  console.log(`[Script] Child process exited with code ${code}`);
  process.exit(code);
});
