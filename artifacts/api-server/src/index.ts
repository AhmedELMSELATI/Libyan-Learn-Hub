import "dotenv/config.js";
import app from "./app";
import { startScheduler } from "./lib/scheduler.js";

const rawPort = process.env["PORT"] || "5001";

const port = Number(rawPort);

// Start background workers
startScheduler();

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
