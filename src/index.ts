import { loadConfig } from "./config";
import { startHourlySchedule } from "./scheduler";
import { runDailyProcessing } from "./processor";
import { startWebhookServer } from "./webhook";
import { log } from "./log";

const config = loadConfig();

startHourlySchedule(async () => {
  log.info("Starting daily calendar processing.");
  await runDailyProcessing(config);
});

startWebhookServer(config);
