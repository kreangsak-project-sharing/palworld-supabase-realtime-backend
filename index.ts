import { config } from "dotenv";
import express, { Request, Response, Application } from "express";

import {
  addSelectPolicy,
  enableRowLevelSecurity,
  enableSupabaseRealtime,
  exposedSchemas,
  insertDataWithSpecificID,
} from "./prisma/config";
import {
  metricsUpdatePrisma,
  playersUpdatePrisma,
  systemInfoUpdatePrisma,
} from "./components/prismaclient";

config();
const app: Application  = express();
app.use(express.json());

// Function to repeatedly update Supabase
const intervalId = setInterval(async () => {
  try {
    await systemInfoUpdatePrisma();
    await playersUpdatePrisma();
    await metricsUpdatePrisma();
  } catch (error: any) {
    console.error("Error updating Supabase:", error?.message);
  }
}, 5000); // Update every 5 seconds

// Stop the interval when the process is terminated
process.on("SIGINT", () => {
  clearInterval(intervalId);
  console.log("Interval stopped");
  process.exit();
});

const PORT = process.env.NODE_PORT;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);

  // First config
  enableRowLevelSecurity();
  addSelectPolicy();
  insertDataWithSpecificID();
  enableSupabaseRealtime();

  exposedSchemas();
});
