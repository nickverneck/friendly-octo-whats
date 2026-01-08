import { Config } from "./config";
import { handleWebhook } from "./processor";
import { log } from "./log";

export function startWebhookServer(config: Config): void {
  const { port, path } = config.webhook;
  Bun.serve({
    port,
    async fetch(req) {
      const url = new URL(req.url);
      if (url.pathname !== path) {
        return new Response("Not Found", { status: 404 });
      }
      try {
        await handleWebhook(config);
        return new Response("OK", { status: 200 });
      } catch (error) {
        log.error("Webhook handler failed.", error);
        return new Response("Error", { status: 500 });
      }
    },
  });
  log.info(`Webhook server listening on ${port}${path}.`);
}
