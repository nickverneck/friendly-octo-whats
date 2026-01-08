import { log } from "./log";

export function startHourlySchedule(task: () => Promise<void>): void {
  const run = async () => {
    try {
      await task();
    } catch (error) {
      log.error("Scheduled task failed.", error);
    }
  };

  void run();
  setInterval(() => void run(), 60 * 60 * 1000);
  log.info("Hourly schedule started.");
}
